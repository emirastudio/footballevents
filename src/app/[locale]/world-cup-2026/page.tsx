import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { RichText } from "@/components/ui/RichText";
import { getWorldCupFixtures } from "@/lib/api-football";
import { WC2026 } from "@/content/world-cup-2026";
import { locales, type Locale } from "@/i18n/config";
import { Trophy, CalendarDays, MapPin, Users, ChevronRight, Globe2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = WC2026.locales[locale as Locale] ?? WC2026.locales.en;
  const url = `${SITE_URL}/${locale}/${WC2026.slug}`;
  return {
    title: c.seoTitle,
    description: c.metaDescription,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}/${WC2026.slug}`])),
    },
    openGraph: {
      type: "website", url, title: c.seoTitle, description: c.metaDescription,
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: c.seoTitle }],
    },
    twitter: { card: "summary_large_image", title: c.seoTitle, description: c.metaDescription },
  };
}

function fmtKickoff(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function WorldCup2026Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = WC2026.locales[locale as Locale] ?? WC2026.locales.en;
  const t = await getTranslations("worldCup");
  const fixtures = await getWorldCupFixtures();
  const upcoming = fixtures.filter((f) => f.status === "NS").slice(0, 16);
  const shown = upcoming.length > 0 ? upcoming : fixtures.slice(0, 16);

  const facts: { icon: typeof Trophy; label: string; value: string }[] = [
    { icon: Globe2, label: t("factLabels.hosts"), value: c.facts.hosts },
    { icon: CalendarDays, label: t("factLabels.dates"), value: c.facts.dates },
    { icon: Users, label: t("factLabels.teams"), value: c.facts.teams },
    { icon: Trophy, label: t("factLabels.matches"), value: c.facts.matches },
    { icon: Users, label: t("factLabels.format"), value: c.facts.format },
    { icon: MapPin, label: t("factLabels.final"), value: c.facts.final },
  ];

  const url = `${SITE_URL}/${locale}/${WC2026.slug}`;

  return (
    <>
      {/* Gold hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-gold-300)] bg-[var(--color-navy-900)]">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(1200px 400px at 50% -10%, rgba(212,175,55,0.35), transparent 60%)" }}
          aria-hidden
        />
        <Container className="relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-white/70">
            <Link href="/" className="hover:text-white">{t("breadcrumbHome")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{c.h1}</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-500)]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-gold-300)]">
            <Trophy className="h-3.5 w-3.5 fill-current" /> {t("badge")}
          </span>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-manrope)] text-4xl font-bold text-white sm:text-6xl">
            {c.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--color-gold-200)] sm:text-lg">{c.tagline}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">{c.intro}</p>
        </Container>
      </section>

      <Container className="py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org", "@type": "SportsEvent",
              name: c.h1, description: c.metaDescription, url,
              startDate: "2026-06-11", endDate: "2026-07-19",
              eventStatus: "https://schema.org/EventScheduled",
              location: { "@type": "Place", name: c.facts.hosts },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org", "@type": "FAQPage",
              mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }),
          }}
        />

        {/* Facts */}
        <section className="mb-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label} className="rounded-[var(--radius-md)] border border-[var(--color-gold-300)] bg-[var(--color-gold-500)]/5 p-3.5">
                <f.icon className="mb-1.5 h-4 w-4 text-[var(--color-gold-600)]" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{f.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">{f.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Live schedule */}
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[var(--color-gold-600)]" />
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("scheduleHeading")}
            </h2>
          </div>
          {shown.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {shown.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3.5 text-sm">
                  <div className="w-28 shrink-0 text-xs font-semibold text-[var(--color-muted)]">{fmtKickoff(m.date, locale)}</div>
                  <div className="flex flex-1 items-center justify-end gap-2 text-right font-semibold text-[var(--color-foreground)]">
                    <span className="truncate">{m.home}</span>
                    {m.homeLogo && <img src={m.homeLogo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
                  </div>
                  <div className="shrink-0 rounded bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-bold text-[var(--color-muted-strong)] tabular-nums">
                    {m.status === "FT" ? `${m.homeGoals ?? 0}–${m.awayGoals ?? 0}` : "vs"}
                  </div>
                  <div className="flex flex-1 items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    {m.awayLogo && <img src={m.awayLogo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
                    <span className="truncate">{m.away}</span>
                  </div>
                  <div className="hidden w-40 shrink-0 truncate text-right text-xs text-[var(--color-muted)] sm:block">{m.city}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-strong)]">
              {t("scheduleEmpty")}
            </p>
          )}
        </section>

        {/* Why follow */}
        <section className="mb-12">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("whyHeading")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.whyFollow.map((w, i) => (
              <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="font-semibold text-[var(--color-foreground)]">{w.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-strong)]">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section className="mb-12">
          <h2 className="mb-4 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("aboutHeading")}
          </h2>
          <RichText html={c.historyHtml} className="text-[var(--color-muted-strong)]" />
        </section>

        {/* FAQ */}
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
          <p className="mt-4 text-xs text-[var(--color-muted)]">{t("dataCredit")}</p>
        </section>
      </Container>
    </>
  );
}
