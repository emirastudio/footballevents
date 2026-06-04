import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: { locale: string; slug: string } }) {
  const v = await db.venue.findUnique({
    where: { slug: params.slug },
    include: { country: true, city: true },
  });
  const name = v?.name ?? params.slug;
  const location = [v?.city?.nameEn, v?.country?.nameEn].filter(Boolean).join(", ");
  const cover = v?.coverUrl;
  const capacity = v?.capacity ? `${v.capacity.toLocaleString()} seats` : "";

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        background: "#0A1628", color: "#fff", fontFamily: "sans-serif", position: "relative",
      }}>
        {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
        <div style={{
          position: "relative", padding: 64, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", gap: 14, height: "100%", width: "100%",
        }}>
          <div style={{ fontSize: 22, opacity: 0.85 }}>🏟️ Stadium · FootballEvents.eu</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 1050 }}>{name}</div>
          {location && <div style={{ fontSize: 28, opacity: 0.9 }}>{location}</div>}
          {capacity && <div style={{ fontSize: 22, opacity: 0.7 }}>{capacity}</div>}
        </div>
      </div>
    ),
    size,
  );
}
