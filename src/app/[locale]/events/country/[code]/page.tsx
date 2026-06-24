// Programmatic SEO hub: every country with published events gets a landing page.
// URL: /[locale]/events/country/[code]  (code = ISO 3166-1 alpha-2, lowercase)
//
// Why it matters:
// - Long-tail queries like "football tournaments in germany" → this page
// - Aggregates the country into a single canonical hub, distributing PageRank
// - Linked to from sitemap, event detail breadcrumbs, and country pickers

import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Link } from "@/i18n/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { WaitlistEmptyState } from "@/components/seo/WaitlistEmptyState";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";
import { getEventsByCountry, getCountryCodesWithEvents } from "@/lib/queries";
import { findCountry, getCountries } from "@/lib/countries";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
// `force-dynamic`, not `revalidate = N`. The locale layout reads `headers()`
// (to detect embed paths) — in Next 16 that makes every child route inherently
// dynamic, and combining it with `revalidate` throws DYNAMIC_SERVER_USAGE at
// request time → bare 500 on every country hub. Until embed detection moves
// out of the locale layout, ISR isn't an option here.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Pre-render the top countries; the rest are still served via ISR.
  try {
    const rows = await getCountryCodesWithEvents();
    return rows.slice(0, 100).map((r) => ({ code: r.code.toLowerCase() }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const country = findCountry(code);
  if (!country) return {};
  const countries = getCountries(locale);
  const localizedName = countries.find((c) => c.code === country.code)?.name ?? country.name;
  const title = `Football events in ${localizedName}`;
  const description = `Browse upcoming football tournaments, camps, festivals and match tours in ${localizedName}. Verified organizers and venues, transparent pricing.`;
  const path = `/events/country/${country.code.toLowerCase()}`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
        "x-default": `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}${path}`,
      title,
      description,
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-default.jpg`] },
  };
}

export default async function EventsByCountryPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const country = findCountry(code);
  if (!country) notFound();

  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  // Empty list is NOT a 404 — render a clean "no events yet" state. Two
  // reasons: (a) Next 16 deep-route notFound() was bubbling as a bare 500
  // on this route (NEXT_HTTP_ERROR_FALLBACK;404 escaped the locale layout's
  // not-found.tsx and Next served the plain-text fallback instead);
  // (b) SEO — keep the country hub indexed with helpful copy, don't 404
  // every page just because the catalog momentarily has no published events.
  const events = await getEventsByCountry(country.code, locale);

  const countries = getCountries(locale);
  const localizedName = countries.find((c) => c.code === country.code)?.name ?? country.name;

  const cardLabels = {
    from: tCommon("from"),
    free: tCommon("free"),
    premium: tCommon("premium"),
    featured: tCommon("featured"),
  };

  // Group events by city for richer internal linking
  const byCity = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.city || "—";
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(e);
  }
  const cityGroups = Array.from(byCity.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <PageHeader
        eyebrow={`${country.flag} ${events.length} ${events.length === 1 ? tCommon("event") : tCommon("events")}`}
        title={`Football events in ${localizedName}`}
        subtitle={`Browse ${events.length} verified football events across ${cityGroups.length} ${cityGroups.length === 1 ? "city" : "cities"} in ${localizedName} — tournaments, camps, festivals and match tours.`}
        breadcrumbs={[
          { href: "/", label: tNav("events") },
          { href: "/events", label: tNav("events") },
          { label: localizedName },
        ]}
      />

      <Container className="py-10">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", url: `${SITE_URL}/${locale}` },
            { name: tNav("events"), url: `${SITE_URL}/${locale}/events` },
            { name: localizedName, url: `${SITE_URL}/${locale}/events/country/${country.code.toLowerCase()}` },
          ]}
        />
        <ItemListJsonLd
          name={`Football events in ${localizedName}`}
          items={events.slice(0, 50).map((e) => ({
            url: `${SITE_URL}/${locale}/events/${e.slug}`,
            name: e.title,
            image: e.coverUrl,
          }))}
        />

        {/* City pivots — internal links to per-city hubs */}
        {cityGroups.length > 1 && (
          <nav aria-label="Cities" className="mb-8 flex flex-wrap gap-2">
            {cityGroups.slice(0, 24).map(([city, list]) => {
              const slug = list[0]?.city
                ? list[0].city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                : "";
              return slug ? (
                <Link
                  key={city}
                  href={`/events/city/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
                >
                  {city}
                  <span className="rounded-full bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-muted-strong)]">
                    {list.length}
                  </span>
                </Link>
              ) : null;
            })}
          </nav>
        )}

        {events.length === 0 ? (
          <WaitlistEmptyState countryCode={country.code} locationName={localizedName} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} labels={cardLabels} size="sm" />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
