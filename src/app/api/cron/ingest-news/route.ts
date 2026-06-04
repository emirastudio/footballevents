import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/news/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // pipeline may make many OpenAI calls

// Daily news ingest. Discover via RSS + NewsAPI, dedup, AI-rewrite, persist.
// WC2026 → PUBLISHED. GENERAL → DRAFT (admin moderation queue).
//
// Hit via GitHub Actions:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://footballevents.eu/api/cron/ingest-news

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest)  { return run(req); }

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization") || req.nextUrl.searchParams.get("token") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runPipeline();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message ?? String(e) },
      { status: 500 },
    );
  }
}
