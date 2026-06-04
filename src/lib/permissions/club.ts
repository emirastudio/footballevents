// Club gating + quota helpers.
// IMPORTANT: never check Club.subscriptionTier directly in product code.
// All gating goes through this file so flipping monetization on later
// is a config change here, not a hunt across the codebase.
// See: docs/architecture/0001-clubs.md §D4

import type { Club, ClubUsage, SubscriptionTier } from "@prisma/client";
import { db } from "@/lib/db";

type QuotaLimits = {
  applicationsPerMonth: number | null;
  rfqPerMonth: number | null;
  favoritesMax: number | null;
  teamsMax: number | null;
};

// Tier defaults. null = unlimited.
// LAUNCH STATE: every tier unlimited. When real monetization turns on,
// drop FREE to {applicationsPerMonth: 3, rfqPerMonth: 1, ...} here —
// no product-code changes needed.
const TIER_DEFAULTS: Record<SubscriptionTier, QuotaLimits> = {
  FREE: { applicationsPerMonth: null, rfqPerMonth: null, favoritesMax: null, teamsMax: null },
  PRO: { applicationsPerMonth: null, rfqPerMonth: null, favoritesMax: null, teamsMax: null },
  PREMIUM: { applicationsPerMonth: null, rfqPerMonth: null, favoritesMax: null, teamsMax: null },
  ENTERPRISE: { applicationsPerMonth: null, rfqPerMonth: null, favoritesMax: null, teamsMax: null },
};

type ClubQuotaShape = Pick<
  Club,
  | "subscriptionTier"
  | "quotaApplicationsPerMonth"
  | "quotaRfqPerMonth"
  | "quotaFavoritesMax"
  | "quotaTeamsMax"
>;

type UsageShape = Pick<ClubUsage, "applicationsThisMonth" | "rfqThisMonth">;

const EMPTY_USAGE: UsageShape = { applicationsThisMonth: 0, rfqThisMonth: 0 };

// Per-club override on the Club row wins over the tier default.
// Either may be null (= unlimited).
function resolveLimits(club: ClubQuotaShape): QuotaLimits {
  const tier = TIER_DEFAULTS[club.subscriptionTier];
  return {
    applicationsPerMonth: club.quotaApplicationsPerMonth ?? tier.applicationsPerMonth,
    rfqPerMonth: club.quotaRfqPerMonth ?? tier.rfqPerMonth,
    favoritesMax: club.quotaFavoritesMax ?? tier.favoritesMax,
    teamsMax: club.quotaTeamsMax ?? tier.teamsMax,
  };
}

function remaining(limit: number | null, used: number): number | null {
  if (limit === null) return null;
  return Math.max(0, limit - used);
}

export type ClubQuotaSnapshot = {
  applications: { limit: number | null; used: number; remaining: number | null };
  rfq: { limit: number | null; used: number; remaining: number | null };
  favoritesMax: number | null;
  teamsMax: number | null;
};

// Snapshot for UI: progress bars, "X of Y used this month" labels.
export function quotasFor(club: ClubQuotaShape, usage: UsageShape | null): ClubQuotaSnapshot {
  const limits = resolveLimits(club);
  const u = usage ?? EMPTY_USAGE;
  return {
    applications: {
      limit: limits.applicationsPerMonth,
      used: u.applicationsThisMonth,
      remaining: remaining(limits.applicationsPerMonth, u.applicationsThisMonth),
    },
    rfq: {
      limit: limits.rfqPerMonth,
      used: u.rfqThisMonth,
      remaining: remaining(limits.rfqPerMonth, u.rfqThisMonth),
    },
    favoritesMax: limits.favoritesMax,
    teamsMax: limits.teamsMax,
  };
}

// Pure predicates — safe to call in render / read paths.
export function canApplyForClub(club: ClubQuotaShape, usage: UsageShape | null): boolean {
  const r = remaining(resolveLimits(club).applicationsPerMonth, (usage ?? EMPTY_USAGE).applicationsThisMonth);
  return r === null || r > 0;
}

export function canPostRfq(club: ClubQuotaShape, usage: UsageShape | null): boolean {
  const r = remaining(resolveLimits(club).rfqPerMonth, (usage ?? EMPTY_USAGE).rfqThisMonth);
  return r === null || r > 0;
}

// Thrown when a quota would be exceeded. Server actions catch this and
// surface a localized message to the form.
export class ClubQuotaError extends Error {
  constructor(public readonly quota: "applications" | "rfq" | "favorites" | "teams") {
    super(`Club quota exceeded: ${quota}`);
    this.name = "ClubQuotaError";
  }
}

// Atomic check-and-increment used inside server actions.
// One transaction so two concurrent submissions can't both pass when only
// one slot is left.
export async function ensureCanApplyAndCount(clubId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const usage = await tx.clubUsage.upsert({
      where: { clubId },
      create: { clubId },
      update: {},
      select: { applicationsThisMonth: true, rfqThisMonth: true },
    });
    const club = await tx.club.findUnique({
      where: { id: clubId },
      select: {
        subscriptionTier: true,
        quotaApplicationsPerMonth: true,
        quotaRfqPerMonth: true,
        quotaFavoritesMax: true,
        quotaTeamsMax: true,
      },
    });
    if (!club) throw new Error(`Club not found: ${clubId}`);
    if (!canApplyForClub(club, usage)) throw new ClubQuotaError("applications");
    await tx.clubUsage.update({
      where: { clubId },
      data: {
        applicationsThisMonth: { increment: 1 },
        applicationsTotal: { increment: 1 },
      },
    });
  });
}

export async function ensureCanRfqAndCount(clubId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const usage = await tx.clubUsage.upsert({
      where: { clubId },
      create: { clubId },
      update: {},
      select: { applicationsThisMonth: true, rfqThisMonth: true },
    });
    const club = await tx.club.findUnique({
      where: { id: clubId },
      select: {
        subscriptionTier: true,
        quotaApplicationsPerMonth: true,
        quotaRfqPerMonth: true,
        quotaFavoritesMax: true,
        quotaTeamsMax: true,
      },
    });
    if (!club) throw new Error(`Club not found: ${clubId}`);
    if (!canPostRfq(club, usage)) throw new ClubQuotaError("rfq");
    await tx.clubUsage.update({
      where: { clubId },
      data: {
        rfqThisMonth: { increment: 1 },
        rfqTotal: { increment: 1 },
      },
    });
  });
}
