import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";
import { getPublishedCountrySlugs } from "@/content/countries";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales;
  const staticPaths = [
    "", "/events", "/org", "/stadiums", "/pricing", "/advertise", "/contact",
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
  try {
    [events, organizers, venues, categories] = await Promise.all([
      db.event.findMany({ where, select: { slug: true, updatedAt: true }, take: 5000 }),
      db.organizer.findMany({ select: { slug: true, updatedAt: true } }),
      db.venue.findMany({ select: { slug: true, updatedAt: true } }),
      db.category.findMany({ select: { slug: true } }),
    ]);
  } catch (e) {
    // Build-time / DB unavailable — fall back to static paths only.
    console.warn("[sitemap] DB query failed, returning static paths only:", e);
  }

  const countrySlugs = getPublishedCountrySlugs();

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
    for (const p of staticPaths) {
      out.push({
        url: `${SITE}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
    for (const c of categories) {
      out.push({
        url: `${SITE}/${locale}/categories/${c.slug}`,
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
  }
  return out;
}
