"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newApplicationEmail, applicationReceivedEmail, bookingResponseEmail } from "@/lib/email";
import { tgEventActivity } from "@/lib/telegram";
import { parseForm, isMultiValue, isDisplayField } from "@/lib/forms/types";

const LOCALES = ["en", "ru", "de", "es"] as const;
/** Normalise an arbitrary locale hint (e.g. a hidden form field) to a supported one. */
function asLocale(x: FormDataEntryValue | null | undefined): string {
  const s = typeof x === "string" ? x : "";
  return (LOCALES as readonly string[]).includes(s) ? s : "en";
}
/** Pick the event title for a locale, falling back to EN then slug. */
function titleFor(translations: { locale: string; title: string }[], locale: string, slug: string): string {
  return (
    translations.find((t) => t.locale === locale)?.title ??
    translations.find((t) => t.locale === "en")?.title ??
    slug
  );
}

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

  // When the organizer's custom form replaces the standard fields, the base
  // contact fields aren't in the form — fall back to the signed-in account.
  const parsed = applySchema.safeParse({
    eventId:         formData.get("eventId"),
    participantName: formData.get("participantName") || session.user.name || "Participant",
    participantAge:  formData.get("participantAge") || undefined,
    teamName:        formData.get("teamName") || undefined,
    partySize:       formData.get("partySize") || 1,
    contactEmail:    formData.get("contactEmail") || session.user.email,
    contactPhone:    formData.get("contactPhone") || undefined,
    comment:         formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const d = parsed.data;

  const event = await db.event.findUnique({
    where: { id: d.eventId },
    include: {
      organizer: { include: { user: { select: { preferredLocale: true } } } },
      translations: { select: { locale: true, title: true } },
    },
  });
  if (!event) return { error: "Event not found" };
  if (!event.acceptsBookings) return { error: "This event doesn't accept applications via the platform" };
  if (event.status !== "PUBLISHED") return { error: "This event is not published" };

  // Prevent the organizer from applying to their own event
  if (event.organizer.userId === session.user.id) return { error: "You can't apply to your own event" };

  // Multiple applications per account are allowed on purpose — e.g. a parent
  // registering several children. Each submission is its own booking.

  // Capacity check: if maxParticipants is set and the new partySize would
  // overflow it, route to WAITLIST. Organizers can promote from waitlist
  // when seats free up.
  let initialStatus: "NEW" | "WAITLIST" = "NEW";
  if (event.maxParticipants != null) {
    const agg = await db.booking.aggregate({
      where: { eventId: d.eventId, status: { in: ["ACCEPTED", "COMPLETED"] } },
      _sum: { partySize: true },
    });
    const confirmed = agg._sum.partySize ?? 0;
    if (confirmed + d.partySize > event.maxParticipants) initialStatus = "WAITLIST";
  }

  // Collect + validate the organizer's custom form fields → Booking.customFields.
  const form = parseForm(event.registrationForm);
  const customFields: Record<string, unknown> = {};
  for (const f of form.fields) {
    if (isDisplayField(f.type)) continue;
    const key = `cf_${f.id}`;
    if (isMultiValue(f.type)) {
      const vals = formData.getAll(key).map(String).filter(Boolean);
      if (f.required && vals.length === 0) return { error: `«${f.label}» — required` };
      if (vals.length) customFields[f.id] = vals;
    } else if (f.type === "consent" || f.type === "rules") {
      const checked = formData.get(key) === "yes";
      if (f.required && !checked) return { error: `«${f.label}» — required` };
      customFields[f.id] = checked;
    } else {
      const v = String(formData.get(key) ?? "").trim();
      if (f.required && !v) return { error: `«${f.label}» — required` };
      if (v) customFields[f.id] = v;
    }
  }

  const booking = await db.booking.create({
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
      customFields: Object.keys(customFields).length ? (customFields as never) : undefined,
      status: initialStatus,
    },
  });

  // Localised titles: applicant gets their own language, organizer gets theirs.
  const applicantLocale = asLocale(formData.get("locale"));
  const organizerLocale = event.organizer.user?.preferredLocale ?? "en";
  const titleForApplicant = titleFor(event.translations, applicantLocale, event.slug);
  const titleForOrganizer = titleFor(event.translations, organizerLocale, event.slug);

  // Create messaging thread for this booking (best-effort; never blocks the booking).
  try {
    const applicantUserId = session.user.id;
    const organizerUserId = event.organizer.userId;
    if (applicantUserId !== organizerUserId) {
      await db.thread.create({
        data: {
          eventId: event.id,
          bookingId: booking.id,
          subject: titleFor(event.translations, "en", event.slug),
          participants: {
            create: [
              { userId: applicantUserId },
              { userId: organizerUserId },
            ],
          },
        },
      });
    }
  } catch (e) {
    console.error("[booking] thread create failed", e);
  }

  // Notify organizer (in their language) + confirm to applicant (in theirs).
  // Fire-and-forget — graceful no-op if RESEND_API_KEY not set.
  void newApplicationEmail({
    organizerEmail: event.organizer.email,
    organizerName: event.organizer.name,
    eventTitle: titleForOrganizer,
    applicantName: d.participantName,
    applicantEmail: d.contactEmail,
    comment: d.comment,
    locale: organizerLocale,
  });
  void applicationReceivedEmail({
    applicantEmail: d.contactEmail,
    applicantName: d.participantName,
    eventTitle: titleForApplicant,
    eventSlug: event.slug,
    organizerName: event.organizer.name,
    eventStart: event.startDate,
    eventEnd: event.endDate,
    locale: applicantLocale,
  });
  // Public marketing signal to the Telegram channels (no personal details).
  void tgEventActivity({ title: titleFor(event.translations, "en", event.slug), slug: event.slug });

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/me/applications");
  revalidatePath("/organizer/bookings");
  return { ok: true };
}

/**
 * Anonymous registration from an embedded form on a third-party site.
 * No session required — a lightweight guest user is created/reused by email.
 * Honeypot (`website` field) silently absorbs bots.
 */
export async function submitPublicRegistrationAction(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  // Honeypot: real users never fill this hidden field.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const parsed = applySchema.safeParse({
    eventId:         formData.get("eventId"),
    participantName: formData.get("participantName"),
    teamName:        formData.get("teamName") || undefined,
    partySize:       formData.get("partySize") || 1,
    contactEmail:    formData.get("contactEmail"),
    contactPhone:    formData.get("contactPhone") || undefined,
    comment:         formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const event = await db.event.findUnique({
    where: { id: d.eventId },
    include: {
      organizer: { include: { user: { select: { preferredLocale: true } } } },
      translations: { select: { locale: true, title: true } },
    },
  });
  if (!event) return { error: "Event not found" };
  if (!event.acceptsBookings) return { error: "This event doesn't accept applications" };
  if (event.status !== "PUBLISHED") return { error: "This event is not published" };

  // Collect + validate custom fields.
  const form = parseForm(event.registrationForm);
  const customFields: Record<string, unknown> = {};
  for (const f of form.fields) {
    if (isDisplayField(f.type)) continue;
    const key = `cf_${f.id}`;
    if (isMultiValue(f.type)) {
      const vals = formData.getAll(key).map(String).filter(Boolean);
      if (f.required && vals.length === 0) return { error: `«${f.label}» — required` };
      if (vals.length) customFields[f.id] = vals;
    } else if (f.type === "consent" || f.type === "rules") {
      const checked = formData.get(key) === "yes";
      if (f.required && !checked) return { error: `«${f.label}» — required` };
      customFields[f.id] = checked;
    } else {
      const v = String(formData.get(key) ?? "").trim();
      if (f.required && !v) return { error: `«${f.label}» — required` };
      if (v) customFields[f.id] = v;
    }
  }

  // Guest user (find-or-create by email) so the booking has an owner and the
  // person can later sign in with the same email to see their applications.
  const guest = await db.user.upsert({
    where: { email: d.contactEmail.toLowerCase() },
    create: { email: d.contactEmail.toLowerCase(), name: d.participantName },
    update: {},
    select: { id: true },
  });

  // Multiple registrations from the same email are allowed (e.g. several children).
  await db.booking.create({
    data: {
      eventId: d.eventId,
      userId: guest.id,
      participantName: d.participantName,
      teamName: d.teamName ?? null,
      partySize: d.partySize,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone ?? null,
      comment: d.comment ?? null,
      customFields: Object.keys(customFields).length ? (customFields as never) : undefined,
      status: "NEW",
    },
  });

  const applicantLocale = asLocale(formData.get("locale"));
  const organizerLocale = event.organizer.user?.preferredLocale ?? "en";
  void newApplicationEmail({
    organizerEmail: event.organizer.email,
    organizerName: event.organizer.name,
    eventTitle: titleFor(event.translations, organizerLocale, event.slug),
    applicantName: d.participantName,
    applicantEmail: d.contactEmail,
    comment: d.comment,
    locale: organizerLocale,
  });
  void applicationReceivedEmail({
    applicantEmail: d.contactEmail,
    applicantName: d.participantName,
    eventTitle: titleFor(event.translations, applicantLocale, event.slug),
    eventSlug: event.slug,
    organizerName: event.organizer.name,
    eventStart: event.startDate,
    eventEnd: event.endDate,
    locale: applicantLocale,
  });
  void tgEventActivity({ title: titleFor(event.translations, "en", event.slug), slug: event.slug });
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
    include: {
      event: { include: { translations: { select: { locale: true, title: true } } } },
      user: { select: { preferredLocale: true } },
    },
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

  const applicantLocale = booking.user?.preferredLocale ?? "en";
  void bookingResponseEmail({
    applicantEmail: booking.contactEmail,
    applicantName: booking.participantName,
    eventTitle: titleFor(booking.event.translations, applicantLocale, booking.event.slug),
    eventSlug: booking.event.slug,
    decision,
    organizerName: organizer.name,
    organizerEmail: organizer.email,
    note,
    eventStart: booking.event.startDate,
    eventEnd: booking.event.endDate,
    locale: applicantLocale,
  });

  // Post a system message into the booking's thread (best-effort).
  try {
    const thread = await db.thread.findUnique({
      where: { bookingId: booking.id },
      select: { id: true, participants: { select: { userId: true } } },
    });
    if (thread) {
      const senderId = organizer.userId;
      const isParticipant = thread.participants.some((p) => p.userId === senderId);
      if (isParticipant) {
        const body =
          decision === "accept"
            ? `Application accepted${note ? `: ${note}` : "."}`
            : `Application declined${note ? `: ${note}` : "."}`;
        const now = new Date();
        await db.$transaction([
          db.message.create({ data: { threadId: thread.id, senderId, body } }),
          db.thread.update({ where: { id: thread.id }, data: { lastMessageAt: now } }),
        ]);
      }
    }
  } catch (e) {
    console.error("[booking] system message failed", e);
  }

  revalidatePath("/organizer/bookings");
  revalidatePath("/me/applications");
  revalidatePath("/me/messages");
  revalidatePath("/organizer/messages");
}
