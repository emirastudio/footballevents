"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canAccessEvent, getOrganizerForUser } from "@/lib/organizer-access";

// Toggle a team member's access to a specific event.
//  - has row → revoke (delete it)
//  - no row  → grant (create it)
//
// Caller must be OWNER of the organizer that owns the event. Returns
// silently on any access mismatch so callers don't leak existence.
export async function toggleEventAccessAction(memberId: string, eventId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const access = await getOrganizerForUser(session.user.id);
  if (!access || access.role !== "OWNER") return;

  // Event must belong to the caller's organizer.
  const event = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true, slug: true } });
  if (!event || event.organizerId !== access.organizer.id) return;

  // Member must belong to the same organizer.
  const member = await db.organizerMember.findUnique({
    where: { id: memberId },
    select: { id: true, organizerId: true },
  });
  if (!member || member.organizerId !== access.organizer.id) return;

  const existing = await db.organizerMemberEvent.findUnique({
    where: { memberId_eventId: { memberId, eventId } },
    select: { id: true },
  });

  if (existing) {
    await db.organizerMemberEvent.delete({ where: { id: existing.id } });
  } else {
    try {
      await db.organizerMemberEvent.create({ data: { memberId, eventId } });
    } catch (err) {
      // Unique race — already exists. Idempotent.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") throw err;
    }
  }

  revalidatePath(`/organizer/events/${event.slug}/applications`);
  revalidatePath("/organizer/bookings");
}
