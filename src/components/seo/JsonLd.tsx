// JSON-LD helper components. Each renders a single <script type="application/ld+json">.
// Keep these stateless and serialization-safe — no Date.now(), no client-only fields.

type Json = Record<string, unknown>;

function emit(obj: Json) {
  // Drop undefined keys for cleaner output and smaller payload.
  const clean = JSON.parse(JSON.stringify(obj));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

// ── Site-wide WebSite + SearchAction (enables sitelinks searchbox in Google) ──
export function WebSiteJsonLd({ locale }: { locale: string }) {
  return emit({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FootballEvents.eu",
    alternateName: "Football Events",
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/events?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

// ── Organization (publisher entity) ──
export function OrganizationJsonLd({ locale }: { locale: string }) {
  return emit({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "FootballEvents.eu",
    url: `${SITE_URL}/${locale}`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://t.me/footballevents",
      "https://www.instagram.com/footballevents.eu",
    ],
  });
}

// ── BreadcrumbList ──
export type Crumb = { name: string; url: string };
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  return emit({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  });
}

// ── FAQPage ──
export function FaqJsonLd({ items }: { items: Array<{ q: string; a: string }> }) {
  if (!items.length) return null;
  return emit({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  });
}

// ── Place / SportsActivityLocation (stadium) ──
type PlaceArgs = {
  name: string;
  url: string;
  image?: string;
  address?: { city?: string; country?: string; street?: string };
  geo?: { lat: number; lng: number };
  capacity?: number;
};
export function PlaceJsonLd(p: PlaceArgs) {
  return emit({
    "@context": "https://schema.org",
    "@type": ["Place", "SportsActivityLocation"],
    name: p.name,
    url: p.url,
    image: p.image,
    address: p.address
      ? {
          "@type": "PostalAddress",
          streetAddress: p.address.street,
          addressLocality: p.address.city,
          addressCountry: p.address.country,
        }
      : undefined,
    geo: p.geo
      ? {
          "@type": "GeoCoordinates",
          latitude: p.geo.lat,
          longitude: p.geo.lng,
        }
      : undefined,
    maximumAttendeeCapacity: p.capacity,
  });
}

// ── ItemList (for listing pages / collection pages) ──
type ListItem = { url: string; name: string; image?: string };
export function ItemListJsonLd({ items, name }: { items: ListItem[]; name?: string }) {
  if (!items.length) return null;
  return emit({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: it.url,
      name: it.name,
      image: it.image,
    })),
  });
}
