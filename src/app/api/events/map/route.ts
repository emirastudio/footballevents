import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { GeoJSON } from "geojson";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(process.env.HIDE_DEMO === "1" ? { isDemo: false } : {}),
    },
    select: {
      id: true,
      slug: true,
      startDate: true,
      endDate: true,
      countryCode: true,
      logoUrl: true,
      category: { select: { slug: true } },
      organizer: { select: { logoUrl: true } },
      venue: { select: { lat: true, lng: true } },
      city: { select: { lat: true, lng: true } },
      translations: {
        where: { locale: "en" },
        select: { title: true },
        take: 1,
      },
    },
  });

  const features: GeoJSON.Feature[] = [];

  for (const e of events) {
    const lat = e.venue?.lat ?? e.city?.lat;
    const lng = e.venue?.lng ?? e.city?.lng;
    if (lat == null || lng == null) continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: e.id,
        slug: e.slug,
        title: e.translations[0]?.title ?? e.slug,
        startDate: e.startDate?.toISOString() ?? null,
        endDate: e.endDate?.toISOString() ?? null,
        countryCode: e.countryCode ?? "",
        logoUrl: e.logoUrl ?? e.organizer.logoUrl ?? null,
        categorySlug: e.category.slug,
      },
    });
  }

  const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

  return NextResponse.json(geojson, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
