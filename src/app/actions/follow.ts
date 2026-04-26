"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user.id;
}

export async function toggleFollowOrganizer(organizerId: string, returnTo: string) {
  const userId = await requireUser();
  const existing = await db.organizerFollow.findUnique({
    where: { userId_organizerId: { userId, organizerId } },
  });
  if (existing) {
    await db.organizerFollow.delete({ where: { id: existing.id } });
  } else {
    await db.organizerFollow.create({ data: { userId, organizerId } });
  }
  revalidatePath(returnTo);
}

export async function toggleSaveEvent(eventId: string, returnTo: string) {
  const userId = await requireUser();
  const existing = await db.eventSave.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing) {
    await db.eventSave.delete({ where: { id: existing.id } });
  } else {
    await db.eventSave.create({ data: { userId, eventId } });
  }
  revalidatePath(returnTo);
}
