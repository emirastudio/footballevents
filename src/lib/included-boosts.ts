// Monthly "included boosts" quota — Pro/Premium/Enterprise plans bundle some
// boosts at no extra cost. We track usage by tagging the Boost row's paymentId
// with the sentinel `included:<organizerId>:<YYYY-MM>:<kind>`, so quota math is
// just a count() over the Boost table — no extra schema needed.

import { db } from "@/lib/db";
import { BOOSTS_INCLUDED_PER_MONTH, type Tier } from "@/lib/tier";
import type { BoostKind } from "@/lib/stripe";

export function currentQuotaPeriod(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function includedSentinel(organizerId: string, period: string, kind: BoostKind): string {
  return `included:${organizerId}:${period}:${kind}`;
}

export async function getIncludedBoostsRemaining(organizerId: string, tier: Tier | string): Promise<number> {
  const t = (tier as Tier) ?? "FREE";
  const total = BOOSTS_INCLUDED_PER_MONTH[t] ?? 0;
  if (total <= 0) return 0;
  const period = currentQuotaPeriod();
  const used = await db.boost.count({
    where: {
      event: { organizerId },
      paymentId: { startsWith: `included:${organizerId}:${period}:` },
    },
  });
  return Math.max(0, total - used);
}

// Pro/Premium include only BASIC; Enterprise can spend included quota on any kind.
export function includedKindAllowed(tier: Tier | string, kind: BoostKind): boolean {
  if (tier === "ENTERPRISE") return kind === "basic" || kind === "featured" || kind === "premium";
  if (tier === "PRO" || tier === "PREMIUM") return kind === "basic";
  return false;
}
