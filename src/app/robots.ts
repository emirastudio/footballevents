import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export default function robots(): MetadataRoute.Robots {
  // Block crawlers entirely on non-prod domains
  const isProd = SITE.includes("footballevents.eu");
  return {
    rules: isProd
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/organizer", "/me", "/onboarding", "/api"],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
