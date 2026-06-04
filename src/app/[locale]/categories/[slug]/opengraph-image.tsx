import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { locale: string; slug: string } }) {
  let title = params.slug;
  let subtitle = "";
  try {
    const t = await getTranslations({ locale: params.locale, namespace: `categoryHeaders.${params.slug}` });
    title = t("title");
    subtitle = t("subtitle");
  } catch { /* fall back to slug */ }

  // Show event count for social proof.
  let count = 0;
  try {
    count = await db.event.count({
      where: { status: "PUBLISHED", category: { slug: params.slug } },
    });
  } catch { /* DB unavailable */ }

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        background: "linear-gradient(135deg, #0A1628 0%, #1A2540 100%)",
        color: "#fff", fontFamily: "sans-serif", position: "relative",
      }}>
        {/* Subtle pitch lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(0,210,106,0.25), transparent 50%)",
        }} />
        <div style={{
          position: "relative", padding: 80, display: "flex", flexDirection: "column",
          justifyContent: "center", gap: 20, height: "100%", width: "100%",
        }}>
          <div style={{ fontSize: 26, opacity: 0.85, color: "#00D26A", fontWeight: 700 }}>
            ⚽ FootballEvents.eu
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 30, opacity: 0.85, maxWidth: 1000 }}>{subtitle}</div>}
          {count > 0 && (
            <div style={{ fontSize: 24, opacity: 0.75, marginTop: 12 }}>
              {count} events worldwide
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
