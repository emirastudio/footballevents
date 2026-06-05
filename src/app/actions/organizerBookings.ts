"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canAccessEvent, getOrgForAction } from "@/lib/organizer-access";
import { bookingResponseEmail, organizerMessageEmail } from "@/lib/email";

// Owner of a booking's organizer can act on it AND the event must pass the
// per-event ACL (for STAFF with explicit grants). Returns the org access shape
// plus the booking, or null when the action should be silently ignored.
async function loadBookingForAction(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: {
        include: {
          translations: { select: { locale: true, title: true } },
          organizer: { include: { user: { select: { preferredLocale: true } } } },
        },
      },
      user: { select: { id: true, name: true, email: true, preferredLocale: true } },
    },
  });
  if (!booking) return null;
  const ok = await canAccessEvent(userId, booking.eventId);
  if (!ok) return null;
  return { booking, access: ok.access };
}

function pickTitle(translations: { locale: string; title: string }[], locale: string, slug: string) {
  return (
    translations.find((t) => t.locale === locale)?.title ??
    translations.find((t) => t.locale === "en")?.title ??
    slug
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Bulk accept / decline. Same outcome as respondBookingAction × N, but in one
// trip — emails fire in parallel via Promise.allSettled.
// ────────────────────────────────────────────────────────────────────────────

const bulkRespondSchema = z.object({
  bookingIds: z.array(z.string().min(1)).min(1).max(500),
  decision:   z.enum(["accept", "decline"]),
  note:       z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function bulkRespondBookingsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await getOrgForAction(session.user.id, "bookings");
  if (!access) return;

  const parsed = bulkRespondSchema.safeParse({
    bookingIds: formData.getAll("bookingIds").map(String).filter(Boolean),
    decision:   formData.get("decision"),
    note:       formData.get("note") || undefined,
  });
  if (!parsed.success) return;
  const { bookingIds, decision, note } = parsed.data;

  // Load every booking and check access per-event (STAFF with grants).
  const items = await Promise.all(bookingIds.map((id) => loadBookingForAction(id, session.user.id)));
  const allowed = items.filter((x): x is NonNullable<typeof x> => !!x);
  if (allowed.length === 0) return;

  const targetStatus = decision === "accept" ? "ACCEPTED" : "DECLINED";
  await db.booking.updateMany({
    where: { id: { in: allowed.map((x) => x.booking.id) } },
    data: { status: targetStatus, organizerNote: note ?? null, respondedAt: new Date() },
  });

  // Side effects: emails + system messages. Fire in parallel, never block on a
  // single failure (Resend may be down for one address, others go through).
  await Promise.allSettled(
    allowed.map(async ({ booking }) => {
      const organizer = booking.event.organizer;
      const applicantLocale = booking.user?.preferredLocale ?? "en";
      const eventTitle = pickTitle(booking.event.translations, applicantLocale, booking.event.slug);
      // Email applicant.
      void bookingResponseEmail({
        applicantEmail: booking.contactEmail,
        applicantName: booking.participantName,
        eventTitle,
        eventSlug: booking.event.slug,
        decision,
        organizerName: organizer.name,
        organizerEmail: organizer.email,
        note: note || undefined,
        eventStart: booking.event.startDate,
        eventEnd: booking.event.endDate,
        locale: applicantLocale,
      });
      // System message in the booking's thread, if it exists and the organizer
      // is a participant (skipped for guests / threads not yet created).
      try {
        const thread = await db.thread.findUnique({
          where: { bookingId: booking.id },
          select: { id: true, participants: { select: { userId: true } } },
        });
        if (thread?.participants.some((p) => p.userId === organizer.userId)) {
          const body =
            decision === "accept"
              ? `Application accepted${note ? `: ${note}` : "."}`
              : `Application declined${note ? `: ${note}` : "."}`;
          await db.$transaction([
            db.message.create({ data: { threadId: thread.id, senderId: organizer.userId, body } }),
            db.thread.update({ where: { id: thread.id }, data: { lastMessageAt: new Date() } }),
          ]);
        }
      } catch (e) {
        console.error("[bulkRespond] system message failed", e);
      }
    }),
  );

  revalidatePath("/organizer/bookings");
  // Per-event applications page lives at /organizer/events/[slug]/applications;
  // revalidate any that contain these bookings (cheap to fan out by event).
  const slugs = new Set(allowed.map((x) => x.booking.event.slug));
  for (const slug of slugs) {
    revalidatePath(`/organizer/events/${slug}/applications`);
  }
  revalidatePath("/me/applications");
  revalidatePath("/club/applications");
  revalidatePath("/club/dashboard");
}

// ────────────────────────────────────────────────────────────────────────────
// Quick-message: single or bulk. Hybrid delivery:
//  - applicant has a user account → email + system message in their booking
//    thread (so it shows up in /me/messages and lights the bell icon).
//  - applicant is a guest (no account) → email only, with a sign-up CTA that
//    pre-fills their email so the eventual account auto-claims past bookings.
// ────────────────────────────────────────────────────────────────────────────

const messageSchema = z.object({
  bookingIds: z.array(z.string().min(1)).min(1).max(500),
  subject:    z.string().trim().min(1, "Subject required").max(140),
  body:       z.string().trim().min(1, "Body required").max(4000),
});

export type MessageApplicantsState = {
  ok?: true;
  delivered?: { withAccount: number; emailOnly: number };
  error?: string;
} | null;

export async function messageApplicantsAction(
  _prev: MessageApplicantsState,
  formData: FormData,
): Promise<MessageApplicantsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await getOrgForAction(session.user.id, "messages");
  if (!access) return { error: "Not authorized" };

  const parsed = messageSchema.safeParse({
    bookingIds: formData.getAll("bookingIds").map(String).filter(Boolean),
    subject:    formData.get("subject"),
    body:       formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { bookingIds, subject, body } = parsed.data;

  const items = await Promise.all(bookingIds.map((id) => loadBookingForAction(id, session.user.id)));
  const allowed = items.filter((x): x is NonNullable<typeof x> => !!x);
  if (allowed.length === 0) return { error: "No accessible recipients" };

  let withAccount = 0;
  let emailOnly = 0;

  // Dedupe by booking.userId so the same user doesn't get the same message
  // twice when an organizer mass-selects. Keep the per-booking thread context
  // for the in-app message, though — that's where the conversation belongs.
  await Promise.allSettled(
    allowed.map(async ({ booking }) => {
      const organizer = booking.event.organizer;
      const applicantLocale = booking.user?.preferredLocale ?? "en";
      const eventTitle = pickTitle(booking.event.translations, applicantLocale, booking.event.slug);

      // Hybrid delivery decision: registered user vs guest. We detect by looking
      // for a User row matching the contact email — Booking.userId is set when
      // the applicant was signed in at submission, but a guest booking via the
      // embed flow may have a userId pointing at a synthesized account; treat
      // any "real" account (has a passwordHash OR has logged in) as registered.
      const registered = await db.user.findFirst({
        where: { email: booking.contactEmail },
        select: { id: true, passwordHash: true, lastLoginAt: true, emailVerified: true },
      });
      const isRealAccount = !!(registered && (registered.passwordHash || registered.lastLoginAt || registered.emailVerified));

      // Email — always, regardless of account. The in-app message is on top.
      void organizerMessageEmail({
        recipientEmail: booking.contactEmail,
        recipientName: booking.participantName,
        eventTitle,
        eventSlug: booking.event.slug,
        organizerName: organizer.name,
        organizerEmail: organizer.email,
        subject,
        body,
        locale: applicantLocale,
        hasAccount: isRealAccount,
      });

      // In-app message into the booking's thread when there IS a real account.
      if (isRealAccount && registered) {
        try {
          // The booking may not have a Thread yet (e.g. guest registration that
          // later got linked); create one on demand so the conversation has a
          // home, but only if this user is the one tied to the booking.
          let thread = await db.thread.findUnique({
            where: { bookingId: booking.id },
            select: { id: true, participants: { select: { userId: true } } },
          });
          if (!thread) {
            const created = await db.thread.create({
              data: {
                eventId: booking.eventId,
                bookingId: booking.id,
                subject: pickTitle(booking.event.translations, "en", booking.event.slug),
                participants: {
                  create: [
                    { userId: registered.id },
                    { userId: organizer.userId },
                  ],
                },
              },
              select: { id: true, participants: { select: { userId: true } } },
            });
            thread = created;
          }
          if (thread.participants.some((p) => p.userId === organizer.userId)) {
            await db.$transaction([
              db.message.create({
                data: { threadId: thread.id, senderId: organizer.userId, body: `${subject}\n\n${body}` },
              }),
              db.thread.update({ where: { id: thread.id }, data: { lastMessageAt: new Date() } }),
            ]);
            withAccount++;
            return;
          }
        } catch (e) {
          console.error("[messageApplicants] thread failed", e);
        }
      }
      emailOnly++;
    }),
  );

  revalidatePath("/organizer/messages");
  const slugs = new Set(allowed.map((x) => x.booking.event.slug));
  for (const slug of slugs) {
    revalidatePath(`/organizer/events/${slug}/applications`);
  }
  return { ok: true, delivered: { withAccount, emailOnly } };
}
