import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { getPublishedCountrySlugs } from "@/content/countries";
import { getWorldCupTeams } from "@/lib/api-football";

// Build at request time, never at build time: the CI build has no database, so
// a prerendered sitemap would silently fall back to static paths only (missing
// every event/category/organizer/venue URL). force-dynamic keeps it DB-backed.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales;
  const staticPaths = [
    "", "/events", "/org", "/stadiums", "/pricing", "/advertise", "/contact", "/world-cup-2026", "/blog",
    // About / informational landing pages (linked from the footer)
    "/about", "/about/tournaments", "/about/camps", "/about/festivals", "/about/match-tours",
    "/about/for-organizers", "/about/for-clubs", "/about/academy-trials",
    "/about/for-players", "/about/training-camps",
    "/legal/terms", "/legal/privacy", "/legal/cookies", "/legal/refund", "/legal/imprint",
  ];

  const where = process.env.HIDE_DEMO === "1" ? { status: "PUBLISHED" as const, isDemo: false } : { status: "PUBLISHED" as const };
  let events: Array<{ slug: string; updatedAt: Date }> = [];
  let organizers: Array<{ slug: string; updatedAt: Date }> = [];
  let venues: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string }> = [];
  let articles: Array<{ slug: string; updatedAt: Date }> = [];
  // pSEO hub data — only emit URLs that have at least one event,
  // so we never publish empty hubs in the sitemap.
  let cityRows: Array<{ slug: string; countryCode: string; eventCount: number }> = [];
  let countryRows: Array<{ countryCode: string; eventCount: number }> = [];
  try {
    [events, organizers, venues, categories, articles] = await Promise.all([
      db.event.findMany({ where, select: { slug: true, updatedAt: true }, take: 5000 }),
      db.organizer.findMany({ select: { slug: true, updatedAt: true } }),
      db.venue.findMany({ select: { slug: true, updatedAt: true } }),
      db.category.findMany({ select: { slug: true } }),
      db.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 5000 }),
    ]);
    const [cities, countries] = await Promise.all([
      db.city.findMany({
        where: { events: { some: where } },
        select: {
          slug: true,
          countryCode: true,
          _count: { select: { events: { where } } },
        },
        take: 2000,
      }),
      db.event.groupBy({
        by: ["countryCode"],
        where: { ...where, countryCode: { not: null } },
        _count: { _all: true },
      }),
    ]);
    cityRows = cities.map((c) => ({ slug: c.slug, countryCode: c.countryCode, eventCount: c._count.events }));
    countryRows = countries
      .filter((c): c is typeof c & { countryCode: string } => !!c.countryCode)
      .map((c) => ({ countryCode: c.countryCode, eventCount: c._count._all }));
  } catch (e) {
    // Build-time / DB unavailable — fall back to static paths only.
    console.warn("[sitemap] DB query failed, returning static paths only:", e);
  }

  const countrySlugs = getPublishedCountrySlugs();
  let wcTeamSlugs: string[] = [];
  try { wcTeamSlugs = (await getWorldCupTeams()).map((t) => t.slug); } catch { /* API down — skip */ }

  const out: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const slug of countrySlugs) {
      out.push({
        url: `${SITE}/${locale}/countries/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const slug of wcTeamSlugs) {
      out.push({ url: `${SITE}/${locale}/world-cup-2026/teams/${slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 });
    }
    for (const p of staticPaths) {
      out.push({
        url: `${SITE}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
    // Categories — fixed list of hub pages
    for (const c of categories) {
      out.push({
        url: `${SITE}/${locale}/categories/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    // pSEO country hubs
    for (const c of countryRows) {
      out.push({
        url: `${SITE}/${locale}/events/country/${c.countryCode.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
    // pSEO city hubs
    for (const c of cityRows) {
      out.push({
        url: `${SITE}/${locale}/events/city/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const e of events) {
      out.push({
        url: `${SITE}/${locale}/events/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const o of organizers) {
      out.push({
        url: `${SITE}/${locale}/org/${o.slug}`,
        lastModified: o.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const v of venues) {
      out.push({
        url: `${SITE}/${locale}/stadiums/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
    for (const a of articles) {
      out.push({
        url: `${SITE}/${locale}/blog/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  return out;
}
