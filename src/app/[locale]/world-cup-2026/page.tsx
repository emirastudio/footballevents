import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { RichText } from "@/components/ui/RichText";
import { MerchPromoBanner } from "@/components/site/MerchPromoBanner";
import { getWorldCupFixtures, getWorldCupStandings, getWorldCupTeams, getWorldCupTopScorers } from "@/lib/api-football";
import { WC2026 } from "@/content/world-cup-2026";
import { locales, type Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { ArticleCard, type ArticleCardData } from "@/components/cards/ArticleCard";
import { Trophy, CalendarDays, MapPin, Users, ChevronRight, Globe2, ListOrdered, Flag, Goal, Newspaper } from "lucide-react";

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
  const [fixtures, groups, teams, scorers, newsRows] = await Promise.all([
    getWorldCupFixtures(), getWorldCupStandings(), getWorldCupTeams(), getWorldCupTopScorers(),
    db.article.findMany({
      where: { category: "WC2026", status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: {
        translations: {
          where: { locale: { in: [locale as Locale, "en"] } },
          select: { locale: true, title: true, lead: true },
        },
      },
    }),
  ]);
  const news: ArticleCardData[] = newsRows.map((a) => {
    const tr = a.translations.find((t) => t.locale === (locale as Locale)) ?? a.translations.find((t) => t.locale === "en");
    return {
      slug: a.slug,
      category: a.category,
      title: tr?.title ?? a.slug,
      lead: tr?.lead ?? "",
      publishedAt: a.publishedAt,
    };
  });
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
      <section className="relative overflow-hidden bg-[var(--color-navy-900)]">
        {/* gold top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold-400)] to-transparent" aria-hidden />
        {/* layered gold glows */}
        <div className="absolute inset-0" aria-hidden style={{ background: "radial-gradient(900px 360px at 15% -20%, rgba(212,175,55,0.40), transparent 60%), radial-gradient(900px 360px at 95% 120%, rgba(212,175,55,0.28), transparent 55%)" }} />
        {/* faint trophy watermark */}
        <Trophy className="pointer-events-none absolute -right-8 -top-6 h-64 w-64 text-[var(--color-gold-500)]/10" aria-hidden />
        <Container className="relative py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left — hero text */}
            <div>
              <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-white/70">
                <Link href="/" className="hover:text-white">{t("breadcrumbHome")}</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white">{c.h1}</span>
              </nav>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-400)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-navy-900)] shadow-[0_0_20px_rgba(212,175,55,0.45)]">
                <Trophy className="h-3.5 w-3.5 fill-current" /> {t("badge")}
              </span>
              <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-extrabold leading-[1.05] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] sm:text-6xl">
                {c.h1}
              </h1>
              <div className="mt-4 h-0.5 w-24 rounded-full bg-gradient-to-r from-[var(--color-gold-400)] to-transparent" aria-hidden />
              <p className="mt-4 max-w-xl text-base font-semibold text-[var(--color-gold-200)] sm:text-lg">{c.tagline}</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">{c.intro}</p>
            </div>
            {/* Right — cover image, edges faded smoothly into the dark hero */}
            <div className="relative hidden lg:block">
              <img
                src="/wc2026.webp" alt={c.h1} width={1280} height={854}
                className="w-full rounded-[var(--radius-xl)] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                style={{ WebkitMaskImage: "radial-gradient(120% 120% at 60% 50%, #000 55%, transparent 92%)", maskImage: "radial-gradient(120% 120% at 60% 50%, #000 55%, transparent 92%)" }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-xl)]" style={{ background: "linear-gradient(90deg, var(--color-navy-900) 0%, rgba(10,22,40,0.15) 28%, transparent 55%)" }} aria-hidden />
            </div>
          </div>
        </Container>
        {/* gold bottom divider */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-400)]/60 to-transparent" aria-hidden />
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

        {/* Group standings */}
        {groups.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-[var(--color-gold-600)]" />
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {t("groupsHeading")}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.name} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <div className="border-b border-[var(--color-border)] bg-[var(--color-gold-500)]/10 px-3 py-2 text-sm font-bold text-[var(--color-foreground)]">
                    {g.name}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[var(--color-muted)]">
                        <th className="px-2 py-1.5 text-left font-semibold">#</th>
                        <th className="px-1 py-1.5 text-left font-semibold">{t("colTeam")}</th>
                        <th className="px-1 py-1.5 text-center font-semibold">{t("colPlayed")}</th>
                        <th className="px-1 py-1.5 text-center font-semibold">{t("colGd")}</th>
                        <th className="px-2 py-1.5 text-center font-semibold">{t("colPts")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.team} className="border-t border-[var(--color-border)]">
                          <td className="px-2 py-1.5 tabular-nums text-[var(--color-muted)]">{r.rank}</td>
                          <td className="px-1 py-1.5">
                            <span className="flex items-center gap-1.5">
                              {r.logo && <img src={r.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />}
                              <span className="truncate font-medium text-[var(--color-foreground)]">{r.team}</span>
                            </span>
                          </td>
                          <td className="px-1 py-1.5 text-center tabular-nums text-[var(--color-muted-strong)]">{r.played}</td>
                          <td className="px-1 py-1.5 text-center tabular-nums text-[var(--color-muted-strong)]">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                          <td className="px-2 py-1.5 text-center font-bold tabular-nums text-[var(--color-foreground)]">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Teams */}
        {teams.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <Flag className="h-5 w-5 text-[var(--color-gold-600)]" />
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {t("teamsHeading", { count: teams.length })}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {teams.map((tm) => (
                <Link
                  key={tm.name}
                  href={`/world-cup-2026/teams/${tm.slug}`}
                  className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 transition hover:border-[var(--color-gold-400)] hover:bg-[var(--color-gold-500)]/5"
                >
                  {tm.logo && <img src={tm.logo} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" />}
                  <span className="truncate text-sm font-medium text-[var(--color-foreground)]">{tm.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top scorers — appears once the tournament is under way */}
        {scorers.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center gap-2">
              <Goal className="h-5 w-5 text-[var(--color-gold-600)]" />
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {t("scorersHeading")}
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {scorers.map((s) => (
                <div key={s.rank} className="flex items-center gap-3 p-3 text-sm">
                  <span className="w-6 shrink-0 text-center font-bold tabular-nums text-[var(--color-muted)]">{s.rank}</span>
                  {s.photo && <img src={s.photo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />}
                  <span className="flex-1 truncate font-semibold text-[var(--color-foreground)]">{s.name}</span>
                  <span className="hidden truncate text-xs text-[var(--color-muted)] sm:block">{s.team}</span>
                  <span className="shrink-0 rounded bg-[var(--color-gold-500)]/15 px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--color-gold-700)]">
                    {s.goals} {t("goalsAbbr")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest news — published WC2026 articles from the daily pipeline */}
        {news.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[var(--color-gold-600)]" />
                <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  Latest news
                </h2>
              </div>
              <Link href="/blog?cat=wc2026" className="text-sm font-semibold text-[var(--color-foreground)] hover:underline">
                All World Cup 2026 news →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((a) => (
                <ArticleCard key={a.slug} article={a} locale={locale} />
              ))}
            </div>
          </section>
        )}

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

        {/* Fan merch promo (Goalbazza) */}
        <section className="mb-12">
          <MerchPromoBanner />
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
