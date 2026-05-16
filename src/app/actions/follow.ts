"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

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
  try {
    if (existing) {
      await db.organizerFollow.delete({ where: { id: existing.id } });
    } else {
      await db.organizerFollow.create({ data: { userId, organizerId } });
    }
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return; // already exists
    console.error("[toggleFollowOrganizer] error:", err);
    return;
  }
  revalidatePath(returnTo);
}

export async function toggleSaveEvent(eventId: string, returnTo: string) {
  const userId = await requireUser();
  const existing = await db.eventSave.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  try {
    if (existing) {
      await db.eventSave.delete({ where: { id: existing.id } });
    } else {
      await db.eventSave.create({ data: { userId, eventId } });
    }
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return; // already exists
    console.error("[toggleSaveEvent] error:", err);
    return;
  }
  revalidatePath(returnTo);
}
