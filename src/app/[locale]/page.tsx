import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { LaunchPromo } from "@/components/site/LaunchPromo";
import { EventCard } from "@/components/cards/EventCard";
import { db } from "@/lib/db";
import { getEvents } from "@/lib/queries";
import { PremiumHero } from "@/components/site/PremiumHero";
import {
  Search, Trophy, Tent, PartyPopper, GraduationCap, Plane, Sparkles, Dumbbell, UserSearch,
  ArrowRight, Calendar, Users, Building2, Globe2, MessageSquare, TrendingUp,
} from "lucide-react";

const HIDE_DEMO = process.env.HIDE_DEMO === "1";
const eventWhere = HIDE_DEMO ? { status: "PUBLISHED" as const, isDemo: false } : { status: "PUBLISHED" as const };

const ICONS: Record<string, typeof Trophy> = {
  tournaments: Trophy, camps: Tent, festivals: PartyPopper,
  masterclasses: GraduationCap, "match-tours": Plane, showcases: Sparkles,
  "training-camps": Dumbbell, tryouts: UserSearch,
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const [eventCount, organizerCount, venueCount, countryRows, categoryRows, allEvents] = await Promise.all([
    db.event.count({ where: eventWhere }),
    db.organizer.count(),
    db.venue.count(),
    db.event.findMany({ where: eventWhere, distinct: ["countryCode"], select: { countryCode: true } }),
    db.category.findMany({
      orderBy: { order: "asc" },
      include: {
        translations: true,
        _count: { select: { events: { where: eventWhere } } },
      },
    }),
    getEvents(),
  ]);
  const countryCount = countryRows.length;
  const premiumEvents = allEvents.filter((e) => e.isPremium).slice(0, 5);
  const featured = allEvents.filter((e) => e.isFeatured || e.isPremium).slice(0, 6);
  const top = allEvents.slice(0, 50);
  const launchSpotsLeft = Math.max(0, 50 - organizerCount);

  const cardLabels = {
    from: tCommon("from"),
    free: tCommon("free"),
    premium: tCommon("premium"),
    featured: tCommon("featured"),
  };

  const stats = eventCount > 0 ? [
    { value: String(eventCount), label: t("stats.events"), icon: Calendar },
    { value: String(organizerCount), label: t("stats.organizers"), icon: Users },
    { value: String(venueCount), label: t("stats.stadiums"), icon: Building2 },
    { value: String(countryCount), label: t("stats.countries"), icon: Globe2 },
  ] : [];

  const orgFeatures = [
    { icon: Globe2,        label: t("forOrganizers.feature1") },
    { icon: MessageSquare, label: t("forOrganizers.feature2") },
    { icon: TrendingUp,    label: t("forOrganizers.feature3") },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-stadium">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-radial-spotlight" aria-hidden />

        <Container className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-muted-strong)] shadow-[var(--shadow-xs)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-pitch-500)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-pitch-500)]" />
              </span>
              {t("hero.eyebrow")}
            </div>

            <h1 className="text-balance font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-[var(--color-muted-strong)]">
              {t("hero.subtitle")}
            </p>

            <form
              action={`/${locale}/events`}
              className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-lg)]"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden />
              <input
                name="q"
                placeholder={t("hero.searchPlaceholder")}
                className="flex-1 bg-transparent px-2 py-3 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
                aria-label={t("hero.searchPlaceholder")}
              />
              <Button type="submit" variant="accent" size="lg" className="rounded-[var(--radius-lg)]">
                {tCommon("search")}
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <Button asChild variant="outline" size="sm">
                <Link href="/events"><Trophy className="h-4 w-4" /> {tNav("tournaments")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/events"><Tent className="h-4 w-4" /> {tNav("camps")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/events"><Plane className="h-4 w-4" /> {tNav("matchTours")}</Link>
              </Button>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left shadow-[var(--shadow-xs)]"
                >
                  <s.icon className="mb-2 h-5 w-5 text-[var(--color-pitch-600)]" aria-hidden />
                  <div className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{s.value}</div>
                  <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* PREMIUM HERO — auto-rotating spotlight on premium-boosted events */}
      {premiumEvents.length > 0 && (
        <PremiumHero
          events={premiumEvents}
          locale={locale}
          labels={{
            badge: t("premiumHero.badge"),
            cta: t("premiumHero.cta"),
            prev: t("premiumHero.prev"),
            next: t("premiumHero.next"),
          }}
        />
      )}

      {/* LAUNCH PROMO — first 50 organizers get Premium free for 3 months */}
      {launchSpotsLeft > 0 && (
        <section className="py-6">
          <Container>
            <LaunchPromo
              label={t("launchPromo.label")}
              title={t("launchPromo.title")}
              subtitle={t("launchPromo.subtitle")}
              remainingLabel={t("launchPromo.remaining")}
              cta={t("launchPromo.cta")}
              spotsLeft={launchSpotsLeft}
              spotsTotal={50}
            />
          </Container>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                {t("categories.title")}
              </h2>
              <p className="mt-2 max-w-xl text-[var(--color-muted-strong)]">{t("categories.subtitle")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryRows.map((c) => {
              const tr = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "en");
              const Icon = ICONS[c.slug] ?? Trophy;
              const count = c._count.events;
              return (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
                >
                  <div className="relative">
                    <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{tr?.name ?? c.slug}</h3>
                    {count > 0 && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                        <span>{count} {tNav("events").toLowerCase()}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="py-20 sm:py-24">
          <Container>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                  {t("featured.title")}
                </h2>
                <p className="mt-2 max-w-xl text-[var(--color-muted-strong)]">{t("featured.subtitle")}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/events">{t("featured.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((e) => (
                <EventCard key={e.id} event={e} locale={locale} labels={cardLabels} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* TOP — only if there are real events */}
      {top.length >= 5 && (
        <section className="py-20 sm:py-24">
          <Container>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-300)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-600)]">
                  <TrendingUp className="h-3.5 w-3.5" /> Top {top.length}
                </span>
                <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                  Top football events worldwide
                </h2>
                <p className="mt-2 max-w-xl text-[var(--color-muted-strong)]">
                  Ranked by reviews, bookings and editor picks from around the globe.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/events?sort=top">{t("featured.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {top.map((e, i) => (
                <EventCard key={e.id} event={e} locale={locale} rank={i + 1} size="sm" labels={cardLabels} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FOR ORGANIZERS */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="bg-soft-cream overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div className="grid gap-10 p-10 sm:p-14 lg:grid-cols-2 lg:gap-16 lg:p-20">
              <div>
                <span className="inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                  {t("forOrganizers.eyebrow")}
                </span>
                <h2 className="mt-5 text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                  {t("forOrganizers.title")}
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-[var(--color-muted-strong)]">
                  {t("forOrganizers.subtitle")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild variant="accent" size="lg">
                    <Link href="/sign-up?role=organizer">
                      {t("forOrganizers.cta")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/pricing">Pricing</Link>
                  </Button>
                </div>
              </div>

              <ul className="space-y-3">
                {orgFeatures.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white/70 p-5 backdrop-blur-sm"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
                      <f.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="pt-1.5 text-sm leading-relaxed text-[var(--color-foreground)]">{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
