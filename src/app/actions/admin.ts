"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventModerationEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user.id;
}

const moderateSchema = z.object({
  eventId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().optional(),
});

export async function moderateEventAction(formData: FormData) {
  await requireAdmin();
  const parsed = moderateSchema.safeParse({
    eventId: formData.get("eventId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return;
  const { eventId, decision, reason } = parsed.data;
  const ev = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: true, translations: true },
  });
  if (!ev) return;

  await db.event.update({
    where: { id: eventId },
    data: decision === "approve"
      ? { status: "PUBLISHED", publishedAt: new Date() }
      : { status: "REJECTED" },
  });

  const en = ev.translations.find((t) => t.locale === "en") ?? ev.translations[0];
  void eventModerationEmail({
    organizerEmail: ev.organizer.email,
    organizerName: ev.organizer.name,
    eventTitle: en?.title ?? ev.slug,
    eventSlug: ev.slug,
    decision,
    reason,
  });

  revalidatePath("/admin/events");
  revalidatePath("/organizer/events");
  revalidatePath(`/events/${ev.slug}`);
}

export async function setUserRoleAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  if (!userId || !["USER", "ORGANIZER", "ADMIN"].includes(role)) return;
  await db.user.update({ where: { id: userId }, data: { role: role as never } });
  revalidatePath("/admin/users");
}
