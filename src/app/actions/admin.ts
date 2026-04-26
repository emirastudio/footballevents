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

// ─────────────────────────────────────────────────────────────
// Ban / unban users
// ─────────────────────────────────────────────────────────────

export async function banUserAction(formData: FormData) {
  const adminId = await requireAdmin();
  const userId = formData.get("userId") as string;
  const reason = (formData.get("reason") as string | null)?.trim() || null;
  if (!userId) return;
  if (userId === adminId) return; // cannot ban self
  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return;
  if (target.role === "ADMIN") return; // cannot ban admins
  await db.user.update({
    where: { id: userId },
    data: { bannedAt: new Date(), banReason: reason },
  });
  // AUDIT: admin {adminId} banned user {userId} reason={reason}
  revalidatePath("/admin/users");
}

export async function unbanUserAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  if (!userId) return;
  await db.user.update({
    where: { id: userId },
    data: { bannedAt: null, banReason: null },
  });
  revalidatePath("/admin/users");
}

// ─────────────────────────────────────────────────────────────
// Organizer verified toggle
// ─────────────────────────────────────────────────────────────

export async function setOrganizerVerifiedAction(formData: FormData) {
  await requireAdmin();
  const organizerId = formData.get("organizerId") as string;
  const verified = formData.get("verified") === "true";
  if (!organizerId) return;
  await db.organizer.update({
    where: { id: organizerId },
    data: { isVerified: verified },
  });
  revalidatePath("/admin/organizers");
}

// ─────────────────────────────────────────────────────────────
// Manual subscription tier override
// ─────────────────────────────────────────────────────────────

const TIERS = ["FREE", "PRO", "PREMIUM", "ENTERPRISE"] as const;
type Tier = (typeof TIERS)[number];

export async function setOrganizerTierAction(formData: FormData) {
  await requireAdmin();
  const organizerId = formData.get("organizerId") as string;
  const tier = formData.get("tier") as string;
  const monthsRaw = Number(formData.get("monthsValid") ?? 1);
  if (!organizerId || !TIERS.includes(tier as Tier)) return;
  const months = Number.isFinite(monthsRaw) && monthsRaw > 0 ? Math.floor(monthsRaw) : 1;

  // Manual override — does NOT touch Stripe.
  // AUDIT: admin manually set tier for organizer {organizerId} → {tier} for {months} months.
  if (tier === "FREE") {
    await db.organizer.update({
      where: { id: organizerId },
      data: { subscriptionTier: "FREE", subscriptionEndsAt: null },
    });
  } else {
    const endsAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    await db.organizer.update({
      where: { id: organizerId },
      data: { subscriptionTier: tier as Tier, subscriptionEndsAt: endsAt },
    });
  }
  revalidatePath("/admin/organizers");
}

// ─────────────────────────────────────────────────────────────
// Manual boost grant
// ─────────────────────────────────────────────────────────────

const BOOST_KINDS = ["basic", "featured", "premium", "bundle31", "bundle52"] as const;
type BoostKind = (typeof BOOST_KINDS)[number];

function tierFromKind(kind: BoostKind): "BASIC" | "FEATURED" | "PREMIUM" {
  if (kind === "featured") return "FEATURED";
  if (kind === "premium") return "PREMIUM";
  return "BASIC"; // basic, bundle31, bundle52
}

function defaultDays(kind: BoostKind): number {
  if (kind === "featured") return 14;
  return 7; // basic, premium, bundle31, bundle52
}

export async function grantBoostAction(formData: FormData) {
  await requireAdmin();
  const eventId = formData.get("eventId") as string;
  const kind = formData.get("kind") as string;
  const daysRaw = Number(formData.get("days") ?? 0);
  if (!eventId || !BOOST_KINDS.includes(kind as BoostKind)) return;
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : defaultDays(kind as BoostKind);

  const tier = tierFromKind(kind as BoostKind);
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // AUDIT: admin granted boost {kind}/{days}d to event {eventId} (manual, $0).
  await db.boost.create({
    data: {
      eventId,
      tier,
      startsAt,
      endsAt,
      priceCents: 0,
      currency: "EUR",
    },
  });

  // Mirror webhook behaviour: bump featured + boost markers on the event.
  const ev = await db.event.findUnique({
    where: { id: eventId },
    select: { featuredUntil: true, boostUntil: true, slug: true },
  });
  if (!ev) return;

  const newBoostUntil =
    !ev.boostUntil || endsAt > ev.boostUntil ? endsAt : ev.boostUntil;
  const isFeaturedBoost = tier !== "BASIC";
  const newFeaturedUntil = isFeaturedBoost
    ? !ev.featuredUntil || endsAt > ev.featuredUntil
      ? endsAt
      : ev.featuredUntil
    : ev.featuredUntil;

  await db.event.update({
    where: { id: eventId },
    data: {
      boostTier: tier,
      boostUntil: newBoostUntil,
      ...(isFeaturedBoost
        ? { isFeatured: true, featuredUntil: newFeaturedUntil }
        : {}),
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/events/${ev.slug}`);
}

// ─────────────────────────────────────────────────────────────
// Review moderation
// ─────────────────────────────────────────────────────────────

export async function moderateReviewAction(formData: FormData) {
  const adminId = await requireAdmin();
  const reviewId = formData.get("reviewId") as string;
  const decision = formData.get("decision") as string;
  if (!reviewId || (decision !== "approve" && decision !== "reject")) return;
  await db.review.update({
    where: { id: reviewId },
    data: {
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      moderatedAt: new Date(),
      moderatedBy: adminId,
    },
  });
  revalidatePath("/admin/reviews");
}
