import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 1800; // 30 min — keep aggregators fresh without hammering the DB

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const where = process.env.HIDE_DEMO === "1"
    ? { status: "PUBLISHED" as const, isDemo: false }
    : { status: "PUBLISHED" as const };

  let events: Array<{
    slug: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    coverUrl: string | null;
    translations: { locale: string; title: string; shortDescription: string | null }[];
    organizer: { name: string };
  }> = [];
  try {
    events = await db.event.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        slug: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        coverUrl: true,
        translations: { select: { locale: true, title: true, shortDescription: true } },
        organizer: { select: { name: true } },
      },
    });
  } catch {
    // DB unavailable — return empty feed rather than 500
  }

  const lastBuild = events[0]?.updatedAt ?? new Date(0);

  const items = events.map((e) => {
    const en = e.translations.find((t) => t.locale === "en") ?? e.translations[0];
    const title = en?.title ?? e.slug;
    const desc = stripHtml(en?.shortDescription ?? "").slice(0, 500);
    const url = `${SITE}/en/events/${e.slug}`;
    const pub = (e.publishedAt ?? e.createdAt).toUTCString();
    const enclosure = e.coverUrl
      ? `<enclosure url="${esc(e.coverUrl)}" type="image/jpeg" />`
      : "";
    return `
    <item>
      <title>${esc(title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${pub}</pubDate>
      <dc:creator>${esc(e.organizer.name)}</dc:creator>
      <description>${esc(desc)}</description>
      ${enclosure}
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>FootballEvents.eu — Latest football events</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>New football tournaments, camps, festivals and match tours added to the FootballEvents.eu catalog.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
