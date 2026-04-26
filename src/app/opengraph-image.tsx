import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        background: "linear-gradient(135deg,#0A1628 0%,#1A2540 100%)",
        color: "#fff", fontFamily: "sans-serif", padding: 64,
      }}>
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>⚽ FootballEvents.eu</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, textAlign: "center" }}>The world's football events, curated.</div>
        <div style={{ fontSize: 28, opacity: 0.8, marginTop: 16, textAlign: "center" }}>Tournaments · Camps · Festivals · Masterclasses</div>
      </div>
    ),
    size,
  );
}
