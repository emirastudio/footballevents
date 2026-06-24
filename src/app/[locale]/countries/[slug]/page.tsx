import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { RichText } from "@/components/ui/RichText";
import { WaitlistEmptyState } from "@/components/seo/WaitlistEmptyState";
import { getEventsByCountry } from "@/lib/queries";
import { getCountryContent } from "@/content/countries";
import { locales, type Locale } from "@/i18n/config";
import {
  ChevronRight, Trophy, MapPin, CalendarDays, Building2, Plane,
  BedDouble, ShieldCheck, PlusCircle, Search,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";
export async function generateStaticParams() { return []; }

function localeContent(slug: string, locale: string) {
  const country = getCountryContent(slug);
  if (!country) return null;
  const c = country.locales[locale as Locale] ?? country.locales.en;
  return { country, c };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const data = localeContent(slug, locale);
  if (!data) return {};
  const { country, c } = data;
  const url = `${SITE_URL}/${locale}/countries/${country.slug}`;
  return {
    title: c.seoTitle,
    description: c.metaDescription,
    robots: country.published ? undefined : { index: false, follow: true },
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/countries/${country.slug}`]),
      ),
    },
    openGraph: {
      type: "website",
      url,
      title: c.seoTitle,
      description: c.metaDescription,
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: c.seoTitle }],
    },
    twitter: { card: "summary_large_image", title: c.seoTitle, description: c.metaDescription },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = localeContent(slug, locale);
  if (!data) notFound();
  const { country, c } = data;

  const t = await getTranslations("countries");
  const tCommon = await getTranslations("common");

  const tournaments = await getEventsByCountry(country.countryCode, locale);
  const countryName = c.facts.nationalTeam; // localized country name

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"), passed: tCommon("passed"),
  };

  const factRows: { label: string; value: string }[] = [
    { label: t("factLabels.capital"), value: c.facts.capital },
    { label: t("factLabels.population"), value: c.facts.population },
    { label: t("factLabels.uefaMember"), value: c.facts.uefaMember },
    { label: t("factLabels.nationalTeam"), value: c.facts.nationalTeam },
    { label: t("factLabels.topLeague"), value: c.facts.topLeague },
    { label: t("factLabels.proClubs"), value: c.facts.proClubs },
    { label: t("factLabels.faFounded"), value: c.facts.faFounded },
  ];

  const pageUrl = `${SITE_URL}/${locale}/countries/${country.slug}`;

  return (
    <>
      {/* Header band */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-navy-900)]">
        <Container className="py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-white/70">
            <Link href="/" className="hover:text-white">{t("breadcrumbHome")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{t("breadcrumbCountries")}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="line-clamp-1 text-white">{countryName}</span>
          </nav>
          <h1 className="max-w-3xl text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold text-white sm:text-5xl">
            <span aria-hidden className="mr-2">{country.flagEmoji}</span>{c.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{c.intro}</p>
        </Container>
      </section>

      <Container className="py-10">
        {/* JSON-LD: Breadcrumb + FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
                { "@type": "ListItem", position: 2, name: t("breadcrumbCountries"), item: `${SITE_URL}/${locale}/countries/${country.slug}` },
                { "@type": "ListItem", position: 3, name: countryName, item: pageUrl },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: c.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />

        {/* 1. Tournaments — above the fold */}
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--color-pitch-600)]" />
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("tournamentsHeading", { country: countryName })}
            </h2>
          </div>

          {tournaments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tournaments.map((e) => (
                <EventCard key={e.id} event={e} locale={locale} size="sm" labels={cardLabels} />
              ))}
            </div>
          ) : (
            <WaitlistEmptyState countryCode={country.countryCode} locationName={countryName} />
          )}
        </section>

        {/* 2. Football facts */}
        <section className="mb-12">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("factsHeading")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {factRows.map((f) => (
              <div key={f.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{f.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">{f.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Why bring your team here */}
        <section className="mb-12">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("whyVisitHeading", { country: countryName })}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.whyVisit.map((w, i) => (
              <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="mb-2 grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]">
                  {[<Building2 key="b" className="h-4 w-4" />, <MapPin key="m" className="h-4 w-4" />, <CalendarDays key="c" className="h-4 w-4" />, <Plane key="p" className="h-4 w-4" />][i % 4]}
                </div>
                <h3 className="font-semibold text-[var(--color-foreground)]">{w.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-strong)]">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Plan the trip — logistics / affiliate */}
        <section className="mb-12">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("logisticsHeading")}
          </h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="max-w-2xl text-sm text-[var(--color-muted-strong)]">{t("logisticsText", { country: countryName })}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" size="md" asChild>
                <a href={country.logistics.bookingUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
                  <BedDouble className="h-4 w-4" /> {t("bookingCta")}
                </a>
              </Button>
              {country.logistics.flightsUrl && (
                <Button variant="outline" size="md" asChild>
                  <a href={country.logistics.flightsUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
                    <Plane className="h-4 w-4" /> {t("flightsCta")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* 5. Football in {country} — depth */}
        <section className="mb-12">
          <h2 className="mb-4 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("historyHeading", { country: countryName })}
          </h2>
          <RichText html={c.historyHtml} className="text-[var(--color-muted-strong)]" />
        </section>

        {/* 6. FAQ */}
        <section>
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("faqHeading")}
          </h2>
          <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {c.faq.map((item, i) => (
              <details key={i} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--color-foreground)]">
                  {item.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("disclaimer")}
          </p>
        </section>
      </Container>
    </>
  );
}
