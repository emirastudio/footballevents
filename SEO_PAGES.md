# SEO Pages — architecture & reference

Canonical reference for **programmatic catalog SEO pages** on footballevents.eu
(country, city, age, tournament-type, tournament, organizer, club, calendar).

Read this before building or changing any catalog/landing page. The country
page (§4) is the worked example; the principles (§1–3) apply to **all** page types.

---

## 1. Core idea

Build SEO as the **future structure of the catalog**, not as articles.

- Every page must be **meaningful even when it has zero tournaments**, and
  **automatically get stronger** as tournaments are added.
- One tournament auto-surfaces on many pages (country, city, age, type, …)
  with no manual editing. The data model — not hand-built pages — drives this.
- Pages are generated from the DB through **one template per page type**.

## 2. Non-negotiable rules (learned the hard way)

1. **Football-team lens, not tourism.** Audience = coach/club/parent planning a
   team trip to a tournament. Never compete with Lonely Planet / Wikipedia /
   Booking on generic travel — you lose and dilute intent. Write "bring your U12
   to Girona", not "things to do in Barcelona".
2. **One primary query per page; H1 + `<title>` anchored to it.** A country page
   targets `youth football tournaments in {country}`. Rich content is *support*,
   it must not pull the page off-query.
3. **Tournament cards / CTA stay high** (above the fold). The page is a
   tournaments page first; the guide is depth below it.
4. **Uniqueness lives in DATA, not prose.** Facts, cities, stadiums, real
   tournaments. Templated/AI-paraphrased paragraphs across N countries =
   near-duplicate → Google helpful-content / thin-content risk.
5. **Index gating by CONTENT readiness, not tournament count.** A rich guide with
   0 tournaments *should* be indexed. A stub with empty SEO fields must be
   `noindex` AND excluded from `sitemap.ts`. Quality > quantity, especially on a
   young domain.
6. **Affiliate complements, never dominates.** Too many partner links + thin
   editorial = "thin affiliate" classification. Cap links; value first.
7. **Empty state is a conversion asset, not a dead end** (see §3).

## 3. Empty state (0 tournaments) — required behavior

The tournament block is never blank. Dual CTA:

- **To users:** "Tournaments in {place} coming soon — leave your email, we'll
  notify you." → lead capture.
- **To organizers:** "Running a tournament in {place}? List it free, be first."
  → matches the outreach message (be first, grow with the catalog).

This makes the page useful, lead-generating, and indexable **before any
inventory exists**.

## 4. Country page — reference template

### URL & i18n
```
/{locale}/countries/{country_slug}        e.g. /en/countries/spain
```
- Single **English slug** across all locales (`spain`). No localized slugs (for now).
- `hreflang` across the 4 locales (en/ru/de/es) + `x-default` = EN.
- Canonical = self (per-locale).

### Section order (fixed)

| # | Section | Content type | Notes |
|---|---------|--------------|-------|
| 1 | H1 + intro | localized, 2–3 sentences | H1 strictly on-query ("Youth Football Tournaments in Spain"). |
| 2 | Tournament cards / empty-state | dynamic (Event) | **Above the fold.** See §3. |
| 3 | Football Facts | data cards | Capital, population, UEFA member, national team, top league, club count. |
| 4 | Why bring your team here | localized, short | Seasonal climate for matches, football culture, infrastructure. |
| 5 | Logistics / Plan the trip | affiliate slots | Accommodation, flights, transfer, facility rental, insurance. |
| 6 | Cities | dynamic (City) | Links to city pages (internal linking). |
| 7 | Football in {country}: facts & history | localized, depth | Facts/events, not Wikipedia. Dwell-time + uniqueness. |
| 8 | FAQ | localized + FAQ schema | Biggest tournaments, season timing, can foreign teams join. |

### Structured data
- `FAQPage` on the FAQ block.
- `BreadcrumbList`: Home → Countries → {Country}.
- `ItemList` on the tournament block (when populated).
- (Tournament pages later: `schema.org/Event`.)

## 5. Data model conventions

Reuse existing entities (`Country`, `City`, `Category`, `Event`, `Organizer`,
`Venue`). **Do not** create parallel tables. Localized content goes in
`*Translation` tables following the existing `CategoryTranslation` pattern.

**`Country`** — add:
```prisma
slug   String  @unique          // URL
facts  Json?                     // { capital, populationApprox, topLeague,
                                  //   proClubsCount, uefaMember, nationalTeam }
```
Facts are non-localized JSON; card labels come from i18n UI strings.

**`CountryTranslation`** (new, mirrors `CategoryTranslation`):
```prisma
countryCode     String
locale          Locale
seoTitle        String
metaDescription String
introMd         String?  @db.Text   // section 1
whyVisitMd      String?  @db.Text   // section 4
historyMd       String?  @db.Text   // section 7
faqJson         Json?               // [{ q, a }]
isPublished     Boolean  @default(false)  // ← per-locale index gate (§2.5)
@@unique([countryCode, locale])
```

**`City`** — add `CityTranslation` (same shape) when building city pages (phase 2).

`Event` / `Category` / `Venue` — unchanged; used for queries.

### Indexability rule (implementation)
`indexable(country, locale) == CountryTranslation.isPublished` →
- if false: render `noindex` and **omit** from `sitemap.ts`.
- tournament count is irrelevant to indexability.

## 6. Affiliate slots (monetization)

Store as **config**, not hardcoded markup:
`{ type, partner, urlTemplate }` with `{country}/{city}` substitution.
Types: `accommodation` (Booking), `flights`, `transfer`, `facility_rental`,
`insurance`. Enforce a max link count per block (§2.6).

## 7. Internal linking & sitemap
- Link Country → Cities → Tournaments → Organizer, bidirectionally.
- Extend existing `src/app/sitemap.ts`: include only pages whose
  `*Translation.isPublished = true` for that locale.
- Breadcrumbs on every catalog page.

## 8. Known gotchas / open decisions
- **Age taxonomy is inconsistent in the codebase**: `Event.ageGroups` is
  documented as birth years ("2013","ADULT") but filtered as U-notation
  ("U10","U12") in `saved-search.ts` / `mock-data.ts`. **Fix this single
  canonical age axis (with a birth-year ↔ U-category season mapping) BEFORE
  building `/age` and country+age pages.**
- **Faceted explosion**: country × age × type × city is tens of thousands of
  URLs. Only generate/index combos with **both demand and content**;
  canonicalize empties to the parent; protect crawl budget.
- **Open decision — fill locales**: EN-pilot first (recommended) vs all 4 at
  once.
- **Open decision — lead capture in empty state**: reuse existing
  email/saved-search system vs a new simple "notify me".
- App routes are `/[locale]/...` (next-intl). This Next.js is non-standard —
  check `node_modules/next/dist/docs/` before writing route code.

## 9. Build phases
1. Schema (`Country.slug/facts`, `CountryTranslation`) + one country template
   rendering from DB.
2. Fill 5–10 top football countries deeply (EN): Spain, Portugal, Germany,
   Italy, Netherlands, England. Enable index, submit to GSC.
3. Affiliate slots (Booking) in logistics.
4. City pages (`CityTranslation`).
5. Age axis (fix the taxonomy first) → `/age` and country+age pages.

## 10. Pre-publish checklist (per page)
- [ ] H1 + `<title>` on the primary query
- [ ] Tournament block above the fold; empty-state dual CTA wired
- [ ] Unique data present (facts/cities/stadiums), not just prose
- [ ] `isPublished` reflects real content; `noindex` + sitemap-excluded otherwise
- [ ] hreflang + canonical correct for all locales
- [ ] Structured data (FAQ, BreadcrumbList, ItemList)
- [ ] Internal links in/out; breadcrumbs
- [ ] Affiliate links within cap; value-first
