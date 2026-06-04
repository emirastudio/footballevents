import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingReminderEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily: find applications still sitting in NEW that the organizer hasn't
// answered for 3+ days, and email the organizer (in their language) a single
// "accept or decline" reminder. `reminderSentAt` guards against double-sending.
//
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/booking-reminders

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest)  { return run(req); }

function titleFor(translations: { locale: string; title: string }[], locale: string, slug: string): string {
  return (
    translations.find((t) => t.locale === locale)?.title ??
    translations.find((t) => t.locale === "en")?.title ??
    slug
  );
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });

  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600_000);

  const bookings = await db.booking.findMany({
    where: {
      status: "NEW",
      respondedAt: null,
      reminderSentAt: null,
      createdAt: { lte: threeDaysAgo },
    },
    include: {
      event: {
        select: {
          slug: true,
          translations: { select: { locale: true, title: true } },
          organizer: {
            select: { email: true, name: true, user: { select: { preferredLocale: true } } },
          },
        },
      },
    },
    take: 200,
  });

  let sent = 0;
  const failures: string[] = [];

  for (const b of bookings) {
    const org = b.event.organizer;
    const locale = org.user?.preferredLocale ?? "en";
    try {
      await bookingReminderEmail({
        organizerEmail: org.email,
        organizerName: org.name,
        applicantName: b.participantName,
        eventTitle: titleFor(b.event.translations, locale, b.event.slug),
        locale,
      });
      await db.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
      sent++;
    } catch (e) {
      failures.push(`${b.id}: ${String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: bookings.length,
    remindersSent: sent,
    failureCount: failures.length,
    failures: failures.slice(0, 10),
  });
}
