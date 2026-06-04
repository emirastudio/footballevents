# ADR 0001 — Clubs domain

Date: 2026-06-04
Status: Accepted

## Context

footballevents.eu started as a one-sided catalog: organizers list events, anonymous visitors browse and apply via `Booking` (one human submits a form, optionally types `teamName` as free text).

We are adding **Clubs** as a first-class actor — a football club (academy, team, school) that registers, declares persistent teams (e.g. "FC Astana U-13 A"), applies to events on behalf of those teams, and posts RFQs ("looking for a B-level U-13 8x8 tournament in Northern Europe, 1-3 days, July").

This turns the platform into a two-sided marketplace and produces structured demand signal — a strategic asset both for organic matchmaking and future monetization.

## Decisions

### D1. Dual-hat users (ORGANIZER + CLUB can coexist)

A single `User` may simultaneously be an organizer (runs events) and a club (sends teams to other events) — e.g. an academy that hosts its own cup and also travels to others.

**Implementation:**
- `UserRole` enum is NOT modified. It stays `USER | ORGANIZER | ADMIN`.
- Capability is determined by **presence of relation**, not by `role`:
  - `user.organizer != null` → has organizer hat
  - `user.club != null` → has club hat
- `role` continues to indicate the user's "primary" identity (legacy gate for `/admin`, default landing page); it is no longer the source of truth for organizer vs. club capability.
- Session callback exposes `session.user.organizerId` and `session.user.clubId` so capability checks are O(1) in server actions without an extra DB hit.

**Default landing after sign-in:**
1. has Club only → `/[locale]/club/dashboard`
2. has Organizer only → `/[locale]/organizer/dashboard`
3. has both → `/[locale]/account` (hub with hat-switcher; last choice cached in cookie)
4. neither → `/`

**Rejected:** roles-array (`role UserRole[]`) — too large a migration and breaks existing checks.
**Rejected:** add `CLUB` to `UserRole` — meaningless when dual-hat is possible.

### D2. Reuse `Booking` for club applications

A club application IS a booking with extra context. Rather than introducing a parallel `Application` model, we extend `Booking` with two optional FKs:

```prisma
clubId      String?   // who applied
clubTeamId  String?   // for which team
```

`Booking.userId` remains required — it's always the human who submitted the form. `clubId`/`clubTeamId` describe the entity the application is being made on behalf of.

**Rejected:** new `Application` model parallel to `Booking` — duplicates status enum, lifecycle, email plumbing, organizer dashboard, message threads. Not worth it for two optional columns.

### D3. Reuse `EventSave` and `OrganizerFollow` for favorites

Both already exist as user-level junction tables. A club's "favorites" are simply the favorites of the User-account that runs the club. No new table.

`/club/favorites` is a presentation layer over the existing data.

### D4. Monetization is wired in but disabled

Everything is FREE for clubs at launch. To avoid a painful retrofit later, all monetization hooks ship in v1, just configured for unlimited:

| Field | Now | Future role |
|---|---|---|
| `Club.subscriptionTier` | `FREE` | `PRO`/`PREMIUM` gating advanced features |
| `Club.quotaApplicationsPerMonth` | `null` (unlimited) | Cap Free clubs once usage data is in |
| `Club.quotaRfqPerMonth` | `null` | Same |
| `Club.quotaFavoritesMax` | `null` | Same |
| `Club.quotaTeamsMax` | `null` | Same |
| `Booking.priority` | `0` for all | Pro club = `1`; bumps to top of organizer dashboard |
| `Booking.visibleToOrganizer` | `true` for all | Free organizer sees first N; rest hidden behind upsell |
| `ClubUsage` (table) | tracks from day 1 | Real data → informed quota defaults |

**Rule in code:** never gate on `subscriptionTier === 'FREE'` directly. All gating goes through helpers in `src/lib/permissions/club.ts` (`canApplyForClub`, `canPostRfq`, `quotasLeft`). Flipping monetization on becomes a config change in the helper, not a hunt across 40 files.

**Trigger to switch on real monetization:** ≥100 organic applications/month AND ≥500 active clubs. Before that, throttling kills the demand side we depend on.

### D5. `ClubTeam` as a persistent entity, applied to many events

`ClubTeam` is created once per club (e.g. "U-13 A") and referenced from every `Booking` that team submits. This gives us:
- A team's tournament history is `Booking.findMany({ where: { clubTeamId } })`.
- A club's public profile can show "12 tournaments across 6 countries in the last year".
- Forms auto-fill from the team profile (age, format, skill level).

One form submission = one team = one `Booking`. If a club wants to send U-13 *and* U-15 to the same tournament, they submit twice. Bulk multi-team submission is deferred until usage data shows it's a common need.

### D6. `Rfq` is fire-and-forget in v1

A club posts an RFQ. The system emails matching organizers (by `targetCountries` + `eventType`). Organizer responds **out-of-band** (email/phone — we never had on-platform chat per `[[video_policy]]` and the user's "no chat" decision).

A future `RfqResponse` model can be added once we measure whether enough RFQs convert and whether on-platform responses would improve that.

### D7. `ageGroup` is a free `String` (matches `EventDivision.ageGroup`)

The catalog already uses string age groups (`"2013"`, `"U13"`, `"ADULT"`). `ClubTeam.ageGroup` follows the same shape. UI provides a select with presets (`U-9`, `U-11`, `U-13`, `U-15`, `U-17`, `U-19`, `Adult`, `Veterans`) plus a free-text fallback.

This keeps SEO filters working uniformly (`WHERE 'U13' = ANY(event.ageGroups)` for events, equality for teams).

## Consequences

**Positive:**
- Two-sided marketplace from day 1.
- Structured demand signal recorded from the first applied club (powers future paid features without a separate data effort).
- No new permissions model — existing relation-based gating extends naturally.
- Migration is additive: existing `Booking`/`User`/`Organizer` rows are untouched.

**Negative / open questions:**
- Public RFQ listing (`/[locale]/rfqs`) may attract spam/low-quality posts. Mitigation: must have a published Club profile, rate limit, basic moderation flag. Watch closely after launch.
- Dual-hat UI complexity — the account switcher must be obvious or users will get confused which hat they're acting under. Worth a usability check after week 1.
- Club verification (`isVerified`) is manual at first. Self-claim of "Real Madrid" must be blocked at moderation, not by the form. Acceptable risk while volume is low; revisit at >500 clubs.

## Out of scope (deferred)

- `RfqResponse` model — second iteration.
- `ClubFollow` (other users follow a club) — not core value yet.
- Multi-team bulk apply — wait for signal.
- Imported public club registries (UEFA, national federations) — separate sprint, after MVP proves engagement.
- Stripe wiring for `Club.subscriptionTier` — fields exist but no checkout flow until D4 trigger is met.
