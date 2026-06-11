import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Organizer } from "@prisma/client";

export type OrgRole = "OWNER" | "MANAGER" | "STAFF";

export type PermKey =
  | "events" | "venues" | "marketing" | "analytics" | "reviews"
  | "bookings" | "messages" | "settings" | "billing" | "team";

// Permission matrix per role. OWNER created the organizer; MANAGER runs event
// operations; STAFF only handles applications + messages.
const PERMS: Record<OrgRole, Record<PermKey, boolean>> = {
  OWNER:   { events: true,  venues: true,  marketing: true,  analytics: true,  reviews: true,  bookings: true, messages: true, settings: true,  billing: true,  team: true },
  MANAGER: { events: true,  venues: true,  marketing: true,  analytics: true,  reviews: true,  bookings: true, messages: true, settings: false, billing: false, team: false },
  STAFF:   { events: false, venues: false, marketing: false, analytics: false, reviews: false, bookings: true, messages: true, settings: false, billing: false, team: false },
};

export function can(role: OrgRole, perm: PermKey): boolean {
  return PERMS[role]?.[perm] ?? false;
}

/** First page a role is allowed to see — used as the redirect target on denial. */
export function landingFor(role: OrgRole): string {
  return role === "STAFF" ? "/organizer/bookings" : "/organizer/dashboard";
}

export type OrgAccess = { organizer: Organizer; role: OrgRole };

/** The organizer a user can act on: the one they own (OWNER), else the first
 *  team they're a member of. Returns null if neither. */
export async function getOrganizerForUser(userId: string): Promise<OrgAccess | null> {
  const owned = await db.organizer.findUnique({ where: { userId } });
  if (owned) return { organizer: owned, role: "OWNER" };
  const m = await db.organizerMember.findFirst({
    where: { userId },
    include: { organizer: true },
    orderBy: { createdAt: "asc" },
  });
  if (m) return { organizer: m.organizer, role: m.role as OrgRole };
  return null;
}

/** For server-component pages: resolve the organizer and require a permission,
 *  redirecting to onboarding (no org) or the role's landing page (no permission). */
export async function requireOrgPage(userId: string, perm: PermKey): Promise<OrgAccess> {
  const access = await getOrganizerForUser(userId);
  if (!access) redirect("/onboarding/organizer");
  if (!can(access.role, perm)) redirect(landingFor(access.role));
  return access;
}

/** For server actions: resolve + require a permission. Returns null when the user
 *  has no org or lacks the permission — the caller should bail out. No redirect. */
export async function getOrgForAction(userId: string, perm: PermKey): Promise<OrgAccess | null> {
  const access = await getOrganizerForUser(userId);
  if (!access || !can(access.role, perm)) return null;
  return access;
}

// ─── Per-event ACL ─────────────────────────────────────────────────────────
// OWNER: always sees every event in the organizer (cannot be restricted).
// MANAGER / STAFF: sees every event by default — UNLESS the owner has added
//        one or more OrganizerMemberEvent rows for them, which switches them
//        to a whitelist. Empty set = no restriction (back-compat for pre-ACL
//        members). MANAGERs keep their elevated permissions on the events they
//        do have access to — the ACL only narrows scope, not capability.

/** Internal: returns null when the caller has no row-level restriction
 *  (OWNER always, MANAGER/STAFF without any explicit grant) — and a Set of
 *  allowed event ids otherwise. */
async function memberAllowedSet(userId: string, organizerId: string, role: OrgRole): Promise<Set<string> | null> {
  if (role === "OWNER") return null;
  const member = await db.organizerMember.findUnique({
    where: { organizerId_userId: { organizerId, userId } },
    select: { id: true, events: { select: { eventId: true } } },
  });
  if (!member || member.events.length === 0) return null;
  return new Set(member.events.map((e) => e.eventId));
}

/** Whether the user can read/operate on a specific event. Always verifies the
 *  event actually belongs to the user's organizer — never trust the URL :id. */
export async function canAccessEvent(userId: string, eventId: string): Promise<{ access: OrgAccess; eventId: string } | null> {
  const access = await getOrganizerForUser(userId);
  if (!access) return null;
  // Must belong to the same Organizer.
  const event = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  if (!event || event.organizerId !== access.organizer.id) return null;
  const allowed = await memberAllowedSet(userId, access.organizer.id, access.role);
  if (allowed && !allowed.has(eventId)) return null;
  return { access, eventId };
}

/** Same as canAccessEvent but resolves by event slug. Used by the per-event
 *  applications page where the URL carries the slug. */
export async function canAccessEventBySlug(userId: string, slug: string): Promise<{ access: OrgAccess; eventId: string } | null> {
  const access = await getOrganizerForUser(userId);
  if (!access) return null;
  const event = await db.event.findUnique({
    where: { slug },
    select: { id: true, organizerId: true },
  });
  if (!event || event.organizerId !== access.organizer.id) return null;
  const allowed = await memberAllowedSet(userId, access.organizer.id, access.role);
  if (allowed && !allowed.has(event.id)) return null;
  return { access, eventId: event.id };
}

/** Page guard: requires both a permission and event access. Redirects on miss. */
export async function requireEventAccessBySlug(
  userId: string,
  slug: string,
  perm: PermKey,
): Promise<{ access: OrgAccess; eventId: string }> {
  const ok = await canAccessEventBySlug(userId, slug);
  if (!ok) {
    const access = await getOrganizerForUser(userId);
    if (!access) redirect("/onboarding/organizer");
    redirect(landingFor(access.role));
  }
  if (!can(ok.access.role, perm)) redirect(landingFor(ok.access.role));
  return ok;
}

/** Used by listings (e.g. the main bookings inbox). Returns:
 *  - "all" → no restriction; caller should query without an extra clause
 *  - string[] → restricted to these event ids; caller should add WHERE eventId IN (…)
 *
 *  Prefer the `*ForUser` variant — this stub-style version always returns
 *  "all" because OrgAccess doesn't carry the user id needed for the lookup.
 *  Kept for back-compat with callers that haven't migrated yet.
 */
export async function allowedEventIds(access: OrgAccess): Promise<"all" | string[]> {
  if (access.role === "OWNER") return "all";
  return "all";
}

/** Same as allowedEventIds but takes userId explicitly — for use after auth(). */
export async function allowedEventIdsForUser(
  access: OrgAccess,
  userId: string,
): Promise<"all" | string[]> {
  const allowed = await memberAllowedSet(userId, access.organizer.id, access.role);
  if (!allowed) return "all";
  return Array.from(allowed);
}
