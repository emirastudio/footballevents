import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionExpiringEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily housekeeping: clear stale boost fields on Event so the column
// reflects reality even when no one is querying. Without this, Event.boostTier
// keeps pointing at a long-finished boost — toMockEvent compensates in JS, but
// any code that reads the column directly (search filters, admin views, future
// reports) sees the wrong state.
//
// Hit this from Coolify's scheduled tasks or any external cron with:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/expire-boosts
export async function POST(req: NextRequest) {
  return run(req);
}
export async function GET(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const [boostExpired, featuredExpired, subsDowngraded] = await Promise.all([
    db.event.updateMany({
      where: { boostUntil: { lt: now }, OR: [{ boostTier: { not: null } }] },
      data: { boostTier: null, boostUntil: null },
    }),
    db.event.updateMany({
      where: { featuredUntil: { lt: now }, isFeatured: true },
      data: { isFeatured: false, featuredUntil: null },
    }),
    // Downgrade organizers whose trial/promo subscription has expired back to FREE.
    db.organizer.updateMany({
      where: {
        subscriptionEndsAt: { lt: now },
        subscriptionTier: { not: "FREE" },
      },
      data: { subscriptionTier: "FREE", subscriptionEndsAt: null },
    }),
  ]);

  // Send 7-day expiry warning emails (window: 7d ± 12h to avoid double-send).
  const in7dMin = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000);
  const in7dMax = new Date(now.getTime() + 7.5 * 24 * 60 * 60 * 1000);
  const expiring = await db.organizer.findMany({
    where: {
      subscriptionEndsAt: { gte: in7dMin, lte: in7dMax },
      subscriptionTier: { not: "FREE" },
    },
    select: { name: true, email: true, subscriptionTier: true, subscriptionEndsAt: true },
  });

  const emailResults = await Promise.allSettled(
    expiring.map((org) =>
      subscriptionExpiringEmail({
        to: org.email,
        organizerName: org.name,
        tierName: org.subscriptionTier,
        expiresAt: org.subscriptionEndsAt!,
        daysLeft: 7,
      }),
    ),
  );
  const emailsSent = emailResults.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({
    ok: true,
    at: now.toISOString(),
    cleared: { boost: boostExpired.count, featured: featuredExpired.count, subsDowngraded: subsDowngraded.count },
    warnings: { sent: emailsSent, total: expiring.length },
  });
}
