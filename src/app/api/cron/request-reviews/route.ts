import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewRequestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily: find events that ended yesterday and email each ACCEPTED/COMPLETED
// participant a "how was it?" review request — once per booking.
//
// Hit from Coolify scheduled tasks:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/request-reviews

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest)  { return run(req); }

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });

  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Window: events whose end (or start, if no end) is in the last 36 hours but
  // older than 12h. Wide enough to recover a missed run, narrow enough to avoid
  // emailing about events from days ago.
  const now = Date.now();
  const windowStart = new Date(now - 36 * 3600_000);
  const windowEnd = new Date(now - 12 * 3600_000);

  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { endDate:   { gte: windowStart, lte: windowEnd } },
        { endDate:   null, startDate: { gte: windowStart, lte: windowEnd } },
      ],
    },
    include: {
      translations: { select: { locale: true, title: true } },
      bookings: {
        where: { status: { in: ["ACCEPTED", "COMPLETED"] } },
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const event of events) {
    const titleEn = event.translations.find((t) => t.locale === "en")?.title;
    const titleAny = titleEn ?? event.translations[0]?.title ?? event.slug;

    for (const booking of event.bookings) {
      // Skip if this user already wrote a review for this event
      const existing = await db.review.findFirst({
        where: { eventId: event.id, authorId: booking.userId },
        select: { id: true },
      });
      if (existing) { skipped++; continue; }

      const to = booking.user.email ?? booking.contactEmail;
      if (!to) { skipped++; continue; }

      try {
        await reviewRequestEmail({
          to,
          participantName: booking.participantName ?? "there",
          eventTitle: titleAny,
          eventSlug: event.slug,
          locale: "en",
        });
        sent++;
      } catch (e) {
        failures.push(`${event.slug}/${booking.id}: ${String(e)}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    eventsScanned: events.length,
    requestsSent: sent,
    skipped,
    failureCount: failures.length,
    failures: failures.slice(0, 10),
  });
}
