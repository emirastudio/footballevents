import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const ev = await db.event.findUnique({
    where: { slug },
    include: { translations: true, organizer: true },
  });
  const en = ev?.translations.find((t) => t.locale === locale) ?? ev?.translations.find((t) => t.locale === "en");
  const title = en?.title ?? slug;
  const subtitle = en?.shortDescription ?? "";
  const organizer = ev?.organizer.name ?? "";
  const cover = ev?.coverUrl;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          background: "#0A1628", color: "#fff",
          fontFamily: "sans-serif", position: "relative",
        }}
      >
        {cover && (
          <img
            src={cover}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* dark gradient at the bottom so the title stays readable over the cover */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.30) 55%, rgba(10,22,40,0.10) 100%)" }} />
        <div style={{ position: "relative", padding: 64, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 16, height: "100%", width: "100%" }}>
          <div style={{ fontSize: 22, opacity: 0.85 }}>⚽ FootballEvents.eu</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 26, opacity: 0.85, maxWidth: 1000 }}>{subtitle}</div>}
          {organizer && <div style={{ fontSize: 22, opacity: 0.7 }}>by {organizer}</div>}
        </div>
      </div>
    ),
    size,
  );
}
