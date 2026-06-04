import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FootballEvents.eu — The world's football events, curated",
    short_name: "FootballEvents",
    description:
      "Premium catalog of football tournaments, camps, festivals and match tours worldwide.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A1628",
    theme_color: "#00D26A",
    categories: ["sports", "events", "travel", "lifestyle"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
  };
}
