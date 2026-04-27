import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 60; // brief cache so repeated keystrokes don't re-fetch

// Free OpenStreetMap geocoder. Rate-limit: 1 req/sec/UA. Good enough for sporadic in-form lookups.
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "FootballEventsEU/1.0 (https://footballevents.eu)";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const country = (url.searchParams.get("country") ?? "").toLowerCase();
  if (q.length < 3) return NextResponse.json({ items: [] });

  const search = new URLSearchParams({
    format: "jsonv2",
    q,
    limit: "8",
    addressdetails: "1",
    "accept-language": "en",
  });
  if (country.length === 2) search.set("countrycodes", country);

  try {
    const r = await fetch(`${NOMINATIM}?${search.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!r.ok) return NextResponse.json({ items: [] });
    const raw = (await r.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: { road?: string; house_number?: string; postcode?: string; city?: string; town?: string; village?: string; country_code?: string };
    }>;
    const items = raw.map((p) => {
      const a = p.address ?? {};
      const street = [a.road, a.house_number].filter(Boolean).join(" ").trim();
      const city = a.city ?? a.town ?? a.village ?? "";
      // Compact label: "Street 12, City" — falls back to display_name when fields are missing.
      const compact = [street, city].filter(Boolean).join(", ").trim();
      return {
        label: compact || p.display_name,
        full: p.display_name,
        street,
        city,
        postcode: a.postcode ?? "",
        countryCode: (a.country_code ?? "").toUpperCase(),
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
      };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
