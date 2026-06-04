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
