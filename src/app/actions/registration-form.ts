"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseForm, type FormField } from "@/lib/forms/types";

export type FormBuilderState = { ok?: boolean; error?: string } | null;

/** Save an event's custom registration form (organizer-owned events only). */
export async function saveRegistrationFormAction(
  _prev: FormBuilderState,
  formData: FormData,
): Promise<FormBuilderState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) return { error: "notOrganizer" };

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { error: "missingEvent" };

  const ev = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true, slug: true } });
  if (!ev || ev.organizerId !== organizer.id) return { error: "notFound" };

  let fields: FormField[];
  try {
    const parsed = JSON.parse(String(formData.get("form") ?? "{}"));
    fields = parseForm(parsed).fields;
  } catch {
    return { error: "invalidForm" };
  }

  // Cap to keep the JSON sane.
  if (fields.length > 60) fields = fields.slice(0, 60);

  await db.event.update({
    where: { id: eventId },
    data: { registrationForm: fields.length ? { fields } : undefined },
  });

  revalidatePath(`/organizer/events/${eventId}/form`);
  revalidatePath(`/events/${ev.slug}/apply`);
  return { ok: true };
}
