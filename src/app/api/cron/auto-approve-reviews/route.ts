import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recalcEventRating } from "@/lib/review-stats";
import { reviewModerationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTO_APPROVE_HOURS = 72;

// Hourly: any PENDING review older than 72h auto-publishes. This protects
// participants from organizers silently sitting on negative feedback.
//
// Hit from Coolify scheduled tasks (recommended: every hour):
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/auto-approve-reviews

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest)  { return run(req); }

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });

  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - AUTO_APPROVE_HOURS * 3600_000);

  const stale = await db.review.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          translations: { select: { locale: true, title: true } },
        },
      },
      author: { select: { name: true, email: true } },
    },
    take: 200,
  });

  const now = new Date();
  let approved = 0;
  const eventIdsToRecalc = new Set<string>();
  const notifyFailures: string[] = [];

  for (const review of stale) {
    await db.review.update({
      where: { id: review.id },
      data: { status: "APPROVED", moderatedAt: now },
    });
    eventIdsToRecalc.add(review.event.id);
    approved++;

    if (review.author.email) {
      const eventTitle =
        review.event.translations.find((t) => t.locale === "en")?.title ??
        review.event.translations[0]?.title ??
        review.event.slug;
      try {
        await reviewModerationEmail({
          to: review.author.email,
          authorName: review.author.name ?? "",
          eventTitle,
          eventSlug: review.event.slug,
          decision: "approve",
        });
      } catch (e) {
        notifyFailures.push(`${review.id}: ${String(e)}`);
      }
    }
  }

  for (const eventId of eventIdsToRecalc) {
    await recalcEventRating(eventId);
  }

  return NextResponse.json({
    ok: true,
    autoApproved: approved,
    eventsRecalculated: eventIdsToRecalc.size,
    notifyFailures: notifyFailures.length,
  });
}
