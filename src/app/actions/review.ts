"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recalcEventRating } from "@/lib/review-stats";
import { newReviewNotificationEmail, reviewModerationEmail } from "@/lib/email";

const BODY_MIN = 50;
const BODY_MAX = 1500;
const TITLE_MAX = 80;

type Result = { ok: true } | { ok: false; error: string };

function eventEnded(startDate: Date | null, endDate: Date | null): boolean {
  const ref = endDate ?? startDate;
  if (!ref) return false;
  return ref.getTime() < Date.now();
}

export async function createReviewAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in to leave a review." };

  const eventId = String(formData.get("eventId") ?? "");
  const ratingRaw = Number(formData.get("rating") ?? 0);
  const title = String(formData.get("title") ?? "").trim().slice(0, TITLE_MAX);
  const body = String(formData.get("body") ?? "").trim();

  if (!eventId) return { ok: false, error: "Missing event." };
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { ok: false, error: "Rating must be 1–5." };
  }
  if (body.length < BODY_MIN) return { ok: false, error: `Review must be at least ${BODY_MIN} characters.` };
  if (body.length > BODY_MAX) return { ok: false, error: `Review must be under ${BODY_MAX} characters.` };

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      startDate: true,
      endDate: true,
      organizerId: true,
      organizer: { select: { email: true, name: true } },
      translations: { select: { locale: true, title: true } },
    },
  });
  if (!event) return { ok: false, error: "Event not found." };
  if (!eventEnded(event.startDate, event.endDate)) {
    return { ok: false, error: "This event hasn't ended yet." };
  }

  const booking = await db.booking.findFirst({
    where: {
      eventId,
      userId: session.user.id,
      status: { in: ["ACCEPTED", "COMPLETED"] },
    },
    select: { id: true },
  });
  if (!booking) {
    return { ok: false, error: "Reviews are open to participants who attended this event." };
  }

  const existing = await db.review.findUnique({
    where: { eventId_authorId: { eventId, authorId: session.user.id } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "You already submitted a review for this event." };

  await db.review.create({
    data: {
      eventId,
      authorId: session.user.id,
      rating: ratingRaw,
      title: title || null,
      body,
      status: "PENDING",
    },
  });

  // Notify organizer
  const eventTitle =
    event.translations.find((t) => t.locale === "en")?.title ??
    event.translations[0]?.title ??
    event.slug;
  await newReviewNotificationEmail({
    organizerEmail: event.organizer.email,
    organizerName: event.organizer.name,
    eventTitle,
    rating: ratingRaw,
    bodyPreview: body.slice(0, 200),
  }).catch(() => {});

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/organizer/reviews");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Organizer moderation: approve / reject / reply / flag
// ─────────────────────────────────────────────────────────────

async function loadOrganizerReview(reviewId: string, userId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          organizerId: true,
          organizer: { select: { userId: true, name: true } },
          translations: { select: { locale: true, title: true } },
        },
      },
      author: { select: { email: true, name: true } },
    },
  });
  if (!review) return null;
  if (review.event.organizer.userId !== userId) return null;
  return review;
}

export async function approveReviewAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const reviewId = String(formData.get("reviewId") ?? "");
  const review = await loadOrganizerReview(reviewId, session.user.id);
  if (!review) return { ok: false, error: "Review not found." };

  await db.review.update({
    where: { id: reviewId },
    data: {
      status: "APPROVED",
      moderatedAt: new Date(),
      moderatedBy: session.user.id,
      rejectedReason: null,
    },
  });
  await recalcEventRating(review.event.id);

  const eventTitle =
    review.event.translations.find((t) => t.locale === "en")?.title ??
    review.event.translations[0]?.title ??
    review.event.slug;
  if (review.author.email) {
    await reviewModerationEmail({
      to: review.author.email,
      authorName: review.author.name ?? "",
      eventTitle,
      eventSlug: review.event.slug,
      decision: "approve",
    }).catch(() => {});
  }

  revalidatePath("/organizer/reviews");
  revalidatePath(`/events/${review.event.slug}`);
  return { ok: true };
}

export async function rejectReviewAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const reviewId = String(formData.get("reviewId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const review = await loadOrganizerReview(reviewId, session.user.id);
  if (!review) return { ok: false, error: "Review not found." };

  const wasApproved = review.status === "APPROVED";

  await db.review.update({
    where: { id: reviewId },
    data: {
      status: "REJECTED",
      moderatedAt: new Date(),
      moderatedBy: session.user.id,
      rejectedReason: reason,
    },
  });
  if (wasApproved) await recalcEventRating(review.event.id);

  const eventTitle =
    review.event.translations.find((t) => t.locale === "en")?.title ??
    review.event.translations[0]?.title ??
    review.event.slug;
  if (review.author.email) {
    await reviewModerationEmail({
      to: review.author.email,
      authorName: review.author.name ?? "",
      eventTitle,
      eventSlug: review.event.slug,
      decision: "reject",
      reason,
    }).catch(() => {});
  }

  revalidatePath("/organizer/reviews");
  revalidatePath(`/events/${review.event.slug}`);
  return { ok: true };
}

export async function replyToReviewAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const reviewId = String(formData.get("reviewId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1500);
  const review = await loadOrganizerReview(reviewId, session.user.id);
  if (!review) return { ok: false, error: "Review not found." };
  if (!reply) return { ok: false, error: "Reply can't be empty." };

  await db.review.update({
    where: { id: reviewId },
    data: {
      organizerReply: reply,
      organizerRepliedAt: new Date(),
    },
  });

  revalidatePath("/organizer/reviews");
  revalidatePath(`/events/${review.event.slug}`);
  return { ok: true };
}

export async function flagReviewAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const reviewId = String(formData.get("reviewId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const review = await loadOrganizerReview(reviewId, session.user.id);
  if (!review) return { ok: false, error: "Review not found." };

  const wasApproved = review.status === "APPROVED";

  await db.review.update({
    where: { id: reviewId },
    data: {
      status: "FLAGGED",
      moderatedAt: new Date(),
      moderatedBy: session.user.id,
      rejectedReason: reason,
    },
  });
  if (wasApproved) await recalcEventRating(review.event.id);

  revalidatePath("/organizer/reviews");
  return { ok: true };
}
