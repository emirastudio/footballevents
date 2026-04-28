import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getSocialImageFonts } from "@/lib/social-image-fonts";
import type { Tier } from "@/lib/tier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stadium Night palette — matches the rest of the site.
const NIGHT_BG = "#0A1628";
const PITCH = "#10B981";
const PITCH_700 = "#047857";
const TEXT = "#FFFFFF";
const MUTED = "#CBD5E1";

type Format = "square" | "portrait" | "story" | "landscape";

const SIZES: Record<Format, { width: number; height: number }> = {
  square:    { width: 1080, height: 1080 }, // Insta square — Free tier
  portrait:  { width: 1080, height: 1350 }, // Insta feed
  story:     { width: 1080, height: 1920 }, // Stories / Reels / TikTok
  landscape: { width: 1920, height: 1080 }, // Twitter / Facebook / YouTube cover
};

function tierAllowsFormat(tier: Tier | string, format: Format, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (format === "square") return true; // Free + everyone
  return tier === "PRO" || tier === "PREMIUM" || tier === "ENTERPRISE";
}

function showWatermark(tier: Tier | string, isAdmin: boolean): boolean {
  if (isAdmin) return false;
  return !(tier === "PRO" || tier === "PREMIUM" || tier === "ENTERPRISE");
}

function fmtDate(d: Date | null | undefined, locale: string): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function fmtPrice(cents: unknown, currency: string | null | undefined, locale: string): string {
  if (cents == null) return "";
  const n = Number(cents);
  if (!Number.isFinite(n) || n === 0) return "";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency ?? "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `€${n}`;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") as Format) || "portrait";
  const locale = url.searchParams.get("locale") || "en";
  if (!(format in SIZES)) return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      translations: true,
      organizer: true,
      city: true,
      venue: { include: { city: true } },
    },
  });
  if (!event || event.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Authorize: anyone can fetch the FREE tier (square, watermarked) for public
  // events; higher formats require either the organizer themselves or any admin.
  const session = await auth();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const isOwner = session?.user?.id === event.organizer.userId;
  const tier = event.organizer.subscriptionTier as Tier;
  if (!tierAllowsFormat(tier, format, isAdmin || isOwner)) {
    // Non-allowed format requested by an outsider → fall back to square.
    return NextResponse.json({ error: "Tier does not allow this format" }, { status: 403 });
  }
  const watermark = showWatermark(tier, isAdmin || isOwner);

  // Pick best translation (active locale → en → first).
  const tr =
    event.translations.find((t) => t.locale === locale) ??
    event.translations.find((t) => t.locale === "en") ??
    event.translations[0];

  const title = (tr?.title ?? event.slug).slice(0, 90);
  const cover = event.coverUrl;
  const logo = event.logoUrl ?? event.organizer.logoUrl;
  const city = event.city?.nameEn ?? event.venue?.city?.nameEn ?? event.customLocation ?? "";
  const dateStr = event.startDate
    ? `${fmtDate(event.startDate, locale)}${event.endDate && event.endDate.getTime() !== event.startDate.getTime() ? " — " + fmtDate(event.endDate, locale) : ""}`
    : "";
  const priceStr = event.isFree ? "FREE" : fmtPrice(event.priceFrom, event.currency, locale);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";
  const eventUrl = `${siteUrl}/${locale}/events/${event.slug}`;
  const qrPng = await QRCode.toDataURL(eventUrl, { margin: 0, width: 200, color: { dark: NIGHT_BG, light: "#FFFFFF" } });

  const fonts = await getSocialImageFonts();
  const { width, height } = SIZES[format];
  const isPortraitLike = height > width;
  const titleSize = isPortraitLike
    ? (format === "story" ? 110 : 96)
    : (format === "landscape" ? 96 : 80);
  const padding = format === "story" ? 72 : 56;

  const node = (
    <div
      style={{
        width: "100%", height: "100%", display: "flex",
        position: "relative", color: TEXT,
        background: `linear-gradient(135deg, ${NIGHT_BG} 0%, #0F1F36 50%, ${PITCH_700} 100%)`,
        fontFamily: "Inter",
      }}
    >
      {cover && (
        <img
          src={cover}
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover", opacity: 0.45 }}
        />
      )}
      {/* Dark gradient overlay for text legibility (top + bottom) */}
      <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex",
        background: `linear-gradient(180deg, rgba(10,22,40,0.85) 0%, rgba(10,22,40,0.2) 35%, rgba(10,22,40,0.2) 60%, rgba(10,22,40,0.92) 100%)`,
      }} />

      {/* Top bar: logo + organizer name */}
      <div style={{ position: "absolute", top: padding, left: padding, right: padding, display: "flex", alignItems: "center", gap: 18 }}>
        {logo ? (
          <img src={logo} width={72} height={72} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", background: "#fff" }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 16, background: PITCH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontFamily: "Bebas Neue" }}>⚽</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{event.organizer.name}</div>
          <div style={{ fontSize: 16, color: MUTED }}>footballevents.eu</div>
        </div>
        {priceStr && (
          <div style={{ display: "flex", alignItems: "center", padding: "10px 18px", borderRadius: 999, background: PITCH, color: NIGHT_BG, fontSize: 24, fontWeight: 700 }}>
            {priceStr === "FREE" ? "FREE" : `from ${priceStr}`}
          </div>
        )}
      </div>

      {/* Bottom block: title + date/city + QR */}
      <div style={{ position: "absolute", left: padding, right: padding, bottom: padding, display: "flex", alignItems: "flex-end", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: titleSize,
              lineHeight: 0.95,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: TEXT,
              maxWidth: width - padding * 2 - 240,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 26, color: MUTED }}>
            {dateStr && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: PITCH, fontWeight: 700 }}>📅</span>
                <span>{dateStr}</span>
              </div>
            )}
            {city && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: PITCH, fontWeight: 700 }}>📍</span>
                <span>{city}</span>
              </div>
            )}
          </div>
        </div>
        {/* QR — links to the event page */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <img src={qrPng} width={170} height={170} style={{ width: 170, height: 170, borderRadius: 12, padding: 10, background: "#fff" }} />
          <div style={{ fontSize: 14, color: MUTED }}>scan to open</div>
        </div>
      </div>

      {watermark && (
        <div style={{ position: "absolute", top: padding, right: padding, fontSize: 14, color: MUTED, opacity: 0.85, display: "flex", padding: "6px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 6 }}>
          via footballevents.eu
        </div>
      )}
    </div>
  );

  return new ImageResponse(node, {
    width,
    height,
    fonts,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
