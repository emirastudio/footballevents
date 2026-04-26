import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { locale: string; slug: string } }) {
  const o = await db.organizer.findUnique({
    where: { slug: params.slug },
    include: { translations: true },
  });
  const en = o?.translations.find((t) => t.locale === params.locale) ?? o?.translations.find((t) => t.locale === "en");
  const tagline = en?.tagline ?? "";
  const cover = o?.coverUrl;

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        background: "#0A1628", color: "#fff", fontFamily: "sans-serif", position: "relative",
      }}>
        {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
        <div style={{ position: "relative", padding: 64, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14, height: "100%", width: "100%" }}>
          <div style={{ fontSize: 22, opacity: 0.85 }}>⚽ Organizer · FootballEvents.eu</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{o?.name ?? params.slug}</div>
          {tagline && <div style={{ fontSize: 28, opacity: 0.85, maxWidth: 1000 }}>{tagline}</div>}
        </div>
      </div>
    ),
    size,
  );
}
