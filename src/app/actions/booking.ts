"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newApplicationEmail, bookingResponseEmail } from "@/lib/email";

const applySchema = z.object({
  eventId:         z.string().min(1),
  participantName: z.string().trim().min(2),
  participantAge:  z.coerce.number().int().positive().optional(),
  teamName:        z.string().trim().optional(),
  partySize:       z.coerce.number().int().positive().default(1),
  contactEmail:    z.string().email(),
  contactPhone:    z.string().optional(),
  comment:         z.string().trim().optional(),
});

export type BookingFormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | null;

export async function applyEventAction(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    const eventId = formData.get("eventId");
    redirect(`/sign-in?next=/events/${eventId}/apply`);
  }

  const parsed = applySchema.safeParse({
    eventId:         formData.get("eventId"),
    participantName: formData.get("participantName"),
    participantAge:  formData.get("participantAge") || undefined,
    teamName:        formData.get("teamName") || undefined,
    partySize:       formData.get("partySize") || 1,
    contactEmail:    formData.get("contactEmail"),
    contactPhone:    formData.get("contactPhone") || undefined,
    comment:         formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const d = parsed.data;

  const event = await db.event.findUnique({ where: { id: d.eventId }, include: { organizer: true } });
  if (!event) return { error: "Event not found" };
  if (!event.acceptsBookings) return { error: "This event doesn't accept applications via the platform" };
  if (event.status !== "PUBLISHED") return { error: "This event is not published" };

  // Prevent the organizer from applying to their own event
  if (event.organizer.userId === session.user.id) return { error: "You can't apply to your own event" };

  // Idempotent: if a booking already exists for (event, user) — return its existing state.
  const existing = await db.booking.findFirst({ where: { eventId: d.eventId, userId: session.user.id } });
  if (existing) return { ok: true };

  await db.booking.create({
    data: {
      eventId: d.eventId,
      userId: session.user.id,
      participantName: d.participantName,
      participantAge: d.participantAge ?? null,
      teamName: d.teamName ?? null,
      partySize: d.partySize,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone ?? null,
      comment: d.comment ?? null,
      status: "NEW",
    },
  });

  // Notify organizer (fire-and-forget — graceful no-op if RESEND_API_KEY not set)
  const en = await db.eventTranslation.findFirst({ where: { eventId: d.eventId, locale: "en" } });
  void newApplicationEmail({
    organizerEmail: event.organizer.email,
    organizerName: event.organizer.name,
    eventTitle: en?.title ?? event.slug,
    applicantName: d.participantName,
    applicantEmail: d.contactEmail,
    comment: d.comment,
    eventId: event.id,
  });

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/me/applications");
  revalidatePath("/organizer/bookings");
  return { ok: true };
}

const respondSchema = z.object({
  bookingId: z.string().min(1),
  decision:  z.enum(["accept", "decline"]),
  note:      z.string().trim().optional(),
});

export async function respondBookingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const parsed = respondSchema.safeParse({
    bookingId: formData.get("bookingId"),
    decision:  formData.get("decision"),
    note:      formData.get("note") || undefined,
  });
  if (!parsed.success) return;
  const { bookingId, decision, note } = parsed.data;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { event: true },
  });
  if (!booking || booking.event.organizerId !== organizer.id) return;

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: decision === "accept" ? "ACCEPTED" : "DECLINED",
      organizerNote: note ?? null,
      respondedAt: new Date(),
    },
  });

  const en = await db.eventTranslation.findFirst({ where: { eventId: booking.eventId, locale: "en" } });
  void bookingResponseEmail({
    applicantEmail: booking.contactEmail,
    applicantName: booking.participantName,
    eventTitle: en?.title ?? booking.event.slug,
    eventSlug: booking.event.slug,
    decision,
    organizerName: organizer.name,
    organizerEmail: organizer.email,
    note,
  });

  revalidatePath("/organizer/bookings");
  revalidatePath("/me/applications");
}
