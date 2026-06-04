import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Typeahead for the event "co-organizers & partners" picker: find platform
// organizers by name. All returned fields are already public (org pages are public).
export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ items: [] });

  const orgs = await db.organizer.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: "asc" },
    take: 8,
  });

  return NextResponse.json({ items: orgs });
}
