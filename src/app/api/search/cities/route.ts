import { NextRequest, NextResponse } from "next/server";
import { City } from "country-state-city";
import { findCountry } from "@/lib/countries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const country = (url.searchParams.get("country") ?? "").toUpperCase();

  if (!country || !q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const all = City.getCitiesOfCountry(country) ?? [];
  const ql = q.toLowerCase();

  // Prefix match first, then substring match.
  const startsWith: typeof all = [];
  const contains: typeof all = [];
  for (const c of all) {
    const n = c.name.toLowerCase();
    if (n.startsWith(ql)) startsWith.push(c);
    else if (n.includes(ql)) contains.push(c);
  }
  const merged = [...startsWith, ...contains];

  // Dedupe by name (DB has duplicates per state).
  const seen = new Set<string>();
  const deduped: typeof merged = [];
  for (const c of merged) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    deduped.push(c);
    if (deduped.length >= 10) break;
  }

  const ctry = findCountry(country);

  return NextResponse.json({
    items: deduped.map((c) => ({
      name: c.name,
      country: ctry?.name ?? country,
      flag: ctry?.flag ?? "",
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      lat: c.latitude ? parseFloat(c.latitude) : undefined,
      lng: c.longitude ? parseFloat(c.longitude) : undefined,
    })),
  });
}
