import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteUrl = SITE;

/** hreflang map for alternates.languages, given a locale-less path. */
export function hreflang(path: string): Record<string, string> {
  const clean = path === "" || path === "/" ? "" : (path.startsWith("/") ? path : `/${path}`);
  return Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}${clean}`]));
}

/** schema.org BreadcrumbList object from a list of {name, url}. */
export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

/**
 * Standard page metadata: self-canonical + hreflang for all locales + OpenGraph.
 * `path` is the locale-less path (e.g. "/events", "/org"). The layout applies
 * the `%s · SiteName` title template to the returned title.
 */
export function pageMeta(opts: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const clean = opts.path === "" || opts.path === "/" ? "" : (opts.path.startsWith("/") ? opts.path : `/${opts.path}`);
  const url = `${SITE}/${opts.locale}${clean}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}${clean}`])),
    },
    openGraph: {
      type: "website",
      url,
      title: opts.title,
      description: opts.description,
      images: [{ url: opts.image ?? `${SITE}/og-default.jpg`, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}
