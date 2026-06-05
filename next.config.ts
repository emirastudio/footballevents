import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone", // produces a self-contained .next/standalone for Docker
  // Next's tracer doesn't follow the world-countries data file by default, so
  // it gets stripped from the standalone bundle and every country hub crashes
  // with "Cannot find module" in production. Force-include the whole package.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/world-countries/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      // Our own CDN — goal.footballevents.eu is the public S3_PUBLIC_URL where
      // organizer-uploaded event covers/logos live. Wildcard covers any future
      // subdomain (cdn.*, img.*, …) without another config tweak.
      { protocol: "https", hostname: "**.footballevents.eu" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      // OAuth avatar providers (next-auth session.user.image)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withNextIntl(nextConfig);
