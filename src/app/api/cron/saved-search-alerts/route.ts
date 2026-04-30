import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedSearchAlertEmail } from "@/lib/email";
import {
  parseSearchFilters,
  filtersToPrismaWhere,
  filtersToSearchParams,
  summarizeFilters,
  type SearchFilters,
} from "@/lib/saved-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";
const MAX_EVENTS_PER_EMAIL = 5;

// Daily: for every active SavedSearch, find PUBLISHED events created since
// the search's lastRun date. Email a digest if there are matches. Always
// updates lastRun so we don't double-send.
//
// Hit from Coolify scheduled tasks daily:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/saved-search-alerts

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest)  { return run(req); }

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });

  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searches = await db.savedSearch.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  const now = new Date();
  let scanned = 0;
  let emailsSent = 0;
  let updatedNoMatch = 0;
  const failures: string[] = [];

  for (const s of searches) {
    scanned++;
    const filters: SearchFilters = parseSearchFilters(s.filters as never);
    const since = s.lastRun ?? s.createdAt;

    const matches = await db.event.findMany({
      where: filtersToPrismaWhere(filters, {
        status: "PUBLISHED",
        createdAt: { gt: since },
      }),
      include: {
        translations: { select: { locale: true, title: true } },
        venue: { select: { city: { select: { nameEn: true } } } },
        city: { select: { nameEn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_EVENTS_PER_EMAIL,
    });

    if (matches.length === 0 || !s.user.email) {
      await db.savedSearch.update({ where: { id: s.id }, data: { lastRun: now } });
      updatedNoMatch++;
      continue;
    }

    const sp = filtersToSearchParams(filters);
    const filterUrl = `${SITE}/en/events${sp.toString() ? `?${sp.toString()}` : ""}`;
    const manageUrl = `${SITE}/en/me/alerts`;
    const label = s.name ?? summarizeFilters(filters);

    const eventCards = matches.map((e) => {
      const tr = e.translations.find((t) => t.locale === "en") ?? e.translations[0];
      const title = tr?.title ?? e.slug;
      const city = e.city?.nameEn ?? e.venue?.city?.nameEn ?? null;
      const start = e.startDate ? new Date(e.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
      const end = e.endDate ? new Date(e.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
      const dateRange = start && end && start !== end ? `${start} — ${end}` : start || end;
      const priceLine = e.isFree
        ? "Free"
        : e.priceFrom != null
        ? `from €${Number(e.priceFrom).toFixed(0)}`
        : "";
      return {
        title,
        city,
        dateRange,
        priceLine,
        coverUrl: e.coverUrl,
        eventUrl: `${SITE}/en/events/${e.slug}`,
      };
    });

    try {
      await savedSearchAlertEmail({
        to: s.user.email,
        name: s.user.name ?? "there",
        searchLabel: label,
        filterUrl,
        manageUrl,
        events: eventCards,
      });
      emailsSent++;
    } catch (e) {
      failures.push(`${s.id}: ${String(e)}`);
    }

    await db.savedSearch.update({ where: { id: s.id }, data: { lastRun: now } });
  }

  return NextResponse.json({
    ok: true,
    scanned,
    emailsSent,
    updatedNoMatch,
    failureCount: failures.length,
    failures: failures.slice(0, 10),
  });
}
