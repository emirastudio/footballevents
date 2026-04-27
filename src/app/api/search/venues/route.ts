import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const country = (url.searchParams.get("country") ?? "").toUpperCase();

  if (!q || q.length < 1) return NextResponse.json({ items: [] });

  const where = country
    ? { countryCode: country, name: { contains: q, mode: "insensitive" as const } }
    : { name: { contains: q, mode: "insensitive" as const } };

  const venues = await db.venue.findMany({
    where,
    select: { id: true, name: true, slug: true, address: true, countryCode: true, capacity: true },
    orderBy: { name: "asc" },
    take: 10,
  });

  return NextResponse.json({
    items: venues.map((v) => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      address: v.address,
      countryCode: v.countryCode,
      capacity: v.capacity,
    })),
  });
}
