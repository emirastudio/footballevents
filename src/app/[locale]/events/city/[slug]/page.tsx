// Programmatic SEO hub: every city with published events gets a landing page.
// URL: /[locale]/events/city/[slug]
//
// Captures long-tail queries like "youth football tournament barcelona 2026".

import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { EventCard } from "@/components/cards/EventCard";
import { Link } from "@/i18n/navigation";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";
import { getEventsByCity, getCityBySlug, getCitiesWithEvents } from "@/lib/queries";
import { findCountry, getCountries } from "@/lib/countries";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const rows = await getCitiesWithEvents();
    return rows
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 200)
      .map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  const country = findCountry(city.countryCode);
  const countries = getCountries(locale);
  const localizedCountry = countries.find((c) => c.code === city.countryCode)?.name ?? country?.name ?? "";
  const title = `Football events in ${city.nameEn}${localizedCountry ? `, ${localizedCountry}` : ""}`;
  const description = `Upcoming football tournaments, camps, festivals and training events in ${city.nameEn}. Verified organizers, real venues, transparent pricing.`;
  const path = `/events/city/${slug}`;
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

export default async function EventsByCityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  // Empty list is NOT a 404 — see the country hub for the rationale (Next 16
  // deep-route notFound() escapes the locale not-found.tsx and 500s instead).
  // Render a clean empty-state below.
  const events = await getEventsByCity(slug, locale);

  const country = findCountry(city.countryCode);
  const countries = getCountries(locale);
  const localizedCountry = countries.find((c) => c.code === city.countryCode)?.name ?? country?.name ?? "";

  const cardLabels = {
    from: tCommon("from"),
    free: tCommon("free"),
    premium: tCommon("premium"),
    featured: tCommon("featured"),
  };

  // Category breakdown for internal linking + scannability
  const byCategory = new Map<string, number>();
  for (const e of events) byCategory.set(e.categorySlug, (byCategory.get(e.categorySlug) ?? 0) + 1);
  const categoryChips = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        eyebrow={`${country?.flag ?? ""} ${events.length} ${events.length === 1 ? tCommon("event") : tCommon("events")}`}
        title={`Football events in ${city.nameEn}`}
        subtitle={`${events.length} verified events in ${city.nameEn}${localizedCountry ? `, ${localizedCountry}` : ""} — tournaments, camps, festivals and training across age groups and formats.`}
        breadcrumbs={[
          { href: "/", label: tNav("events") },
          { href: "/events", label: tNav("events") },
          {
            href: `/events/country/${city.countryCode.toLowerCase()}`,
            label: localizedCountry || city.countryCode,
          },
          { label: city.nameEn },
        ]}
      />

      <Container className="py-10">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", url: `${SITE_URL}/${locale}` },
            { name: tNav("events"), url: `${SITE_URL}/${locale}/events` },
            { name: localizedCountry || city.countryCode, url: `${SITE_URL}/${locale}/events/country/${city.countryCode.toLowerCase()}` },
            { name: city.nameEn, url: `${SITE_URL}/${locale}/events/city/${slug}` },
          ]}
        />
        <ItemListJsonLd
          name={`Football events in ${city.nameEn}`}
          items={events.slice(0, 50).map((e) => ({
            url: `${SITE_URL}/${locale}/events/${e.slug}`,
            name: e.title,
            image: e.coverUrl,
          }))}
        />

        {/* Category pivots */}
        {categoryChips.length > 1 && (
          <nav aria-label="Categories" className="mb-8 flex flex-wrap gap-2">
            {categoryChips.map(([cat, count]) => (
              <Link
                key={cat}
                href={`/categories/${cat}`}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
              >
                {cat}
                <span className="rounded-full bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-muted-strong)]">
                  {count}
                </span>
              </Link>
            ))}
          </nav>
        )}

        {events.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
            <div className="text-5xl">{country?.flag ?? "🏟"}</div>
            <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
              No published events in {city.nameEn} yet
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
              Organizers are getting ready — check back soon, or explore other cities.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
            >
              Browse all events
            </Link>
          </div>
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
