import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

// Branded fallback card used whenever the rich (cover) render fails — Satori is
// strict about layout, so we never want a thrown error to bubble up as a 502 and
// leave link previews with no image at all.
function fallbackCard(title: string, subtitle: string, organizer: string) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 72,
        background: "linear-gradient(135deg, #0A1628 0%, #122644 60%, #1b3a66 100%)",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, opacity: 0.85, marginBottom: 20 }}>
        ⚽ FootballEvents.eu
      </div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
      {subtitle ? (
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85, marginTop: 18 }}>{subtitle}</div>
      ) : null}
      {organizer ? (
        <div style={{ display: "flex", fontSize: 22, opacity: 0.7, marginTop: 18 }}>by {organizer}</div>
      ) : null}
    </div>
  );
}

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

  // Rich card with the event cover behind a dark gradient. Every <div> with more
  // than one child carries an explicit display:flex — Satori throws otherwise.
  const rich = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#0A1628",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(0deg, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.30) 55%, rgba(10,22,40,0.10) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          padding: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          height: "100%",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, opacity: 0.85, marginBottom: 16 }}>
          ⚽ FootballEvents.eu
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ display: "flex", fontSize: 26, opacity: 0.85, maxWidth: 1000, marginTop: 16 }}>
            {subtitle}
          </div>
        ) : null}
        {organizer ? (
          <div style={{ display: "flex", fontSize: 22, opacity: 0.7, marginTop: 16 }}>by {organizer}</div>
        ) : null}
      </div>
    </div>
  );

  try {
    return new ImageResponse(rich, size);
  } catch {
    return new ImageResponse(fallbackCard(title, subtitle, organizer), size);
  }
}
