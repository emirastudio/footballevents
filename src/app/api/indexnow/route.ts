// Manual IndexNow trigger — useful for one-off batch notifies and cron jobs.
//
// POST /api/indexnow                 → notify recently-updated published events
// POST /api/indexnow  { urls: [...]} → notify a custom URL list
//
// Auth: x-cron-secret header must match CRON_SECRET env (set in Coolify).
// This is a public endpoint that hits a 3rd-party API, so it MUST be guarded.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyIndexNow } from "@/lib/indexnow";
import { routing } from "@/i18n/routing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ ok: false, reason: "no-cron-secret" }, { status: 503 });
  }
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Custom URL list (advanced): caller provides exact URLs to ping.
  let body: { urls?: string[]; sinceMin?: number } | null = null;
  try {
    body = await req.json();
  } catch { /* empty body is fine */ }

  if (body?.urls && Array.isArray(body.urls) && body.urls.length > 0) {
    const result = await notifyIndexNow(body.urls);
    return NextResponse.json({ ...result, count: body.urls.length });
  }

  // Default behavior: pick recently-published or recently-updated events
  // (last 30 minutes by default) and notify all their locale variants.
  const sinceMin = body?.sinceMin ?? 30;
  const since = new Date(Date.now() - sinceMin * 60 * 1000);
  const rows = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { publishedAt: { gte: since } },
        { updatedAt: { gte: since } },
      ],
    },
    select: { slug: true },
    take: 500,
  });

  const urls: string[] = [];
  for (const e of rows) {
    for (const l of routing.locales) {
      urls.push(`${SITE}/${l}/events/${e.slug}`);
    }
  }
  // Always re-notify the sitemap itself.
  urls.push(`${SITE}/sitemap.xml`);

  if (urls.length === 0) {
    return NextResponse.json({ ok: true, count: 0, reason: "no-recent-content" });
  }

  const result = await notifyIndexNow(urls);
  return NextResponse.json({ ...result, count: urls.length, slugs: rows.length });
}

// GET → health/probe endpoint (no secret needed, no notification sent).
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.INDEXNOW_KEY),
    site: SITE,
    keyUrl: process.env.INDEXNOW_KEY ? `${SITE}/${process.env.INDEXNOW_KEY}.txt` : null,
  });
}
