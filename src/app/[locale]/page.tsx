import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { LaunchPromo } from "@/components/site/LaunchPromo";
import {
  Search, Trophy, Tent, PartyPopper, GraduationCap, Plane, Sparkles,
  ArrowRight, MapPin, Calendar, Star, Users, Building2, Globe2, ShieldCheck, MessageSquare, TrendingUp,
} from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const categories = [
    { slug: "tournaments", label: tNav("tournaments"), icon: Trophy, count: 248 },
    { slug: "camps", label: tNav("camps"), icon: Tent, count: 132 },
    { slug: "festivals", label: tNav("festivals"), icon: PartyPopper, count: 64 },
    { slug: "masterclasses", label: tNav("masterclasses"), icon: GraduationCap, count: 89 },
    { slug: "match-tours", label: tNav("matchTours"), icon: Plane, count: 47 },
    { slug: "showcases", label: "Showcases", icon: Sparkles, count: 18 },
  ];

  const stats = [
    { value: "600+", label: t("stats.events"), icon: Calendar },
    { value: "180+", label: t("stats.organizers"), icon: Users },
    { value: "1,200+", label: t("stats.stadiums"), icon: Building2 },
    { value: "32", label: t("stats.countries"), icon: Globe2 },
  ];

  const featured = [
    { id: 1, title: "Mediterranean Cup U14", city: "Barcelona, Spain", date: "Jul 14–20, 2026", price: "€480", tag: tCommon("featured"), variant: "premium" as const, img: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80" },
    { id: 2, title: "Alpine Football Camp", city: "Innsbruck, Austria", date: "Aug 3–10, 2026", price: "€620", tag: tCommon("verified"), variant: "accent" as const, img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80" },
    { id: 3, title: "Wembley Match-Day Tour", city: "London, UK", date: "Sep 28, 2026", price: "€185", tag: tCommon("premium"), variant: "premium" as const, img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80" },
  ];

  // TOP 50 events — placeholder data, will come from DB ranked by views/rating/boost
  const topCities = ["Madrid","Barcelona","London","Munich","Milan","Paris","Lisbon","Rome","Amsterdam","Berlin","Manchester","Vienna","Prague","Warsaw","Athens"];
  const topCountries = ["ES","ES","UK","DE","IT","FR","PT","IT","NL","DE","UK","AT","CZ","PL","GR"];
  const topTitles = [
    "Iberia Cup", "Costa Brava Trophy", "London Youth Open", "Bavaria Junior Cup",
    "Milan Derby Camp", "Paris Football Festival", "Lisbon Sun Tour", "Roma Masterclass",
    "Amsterdam Showcase", "Berlin International", "Manchester Match Tour", "Wien Winter Cup",
    "Prague Spring Trophy", "Warsaw Junior Open", "Hellas Football Festival",
  ];
  const topImages = [
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
    "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?w=600&q=80",
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80",
  ];
  const top50 = Array.from({ length: 50 }, (_, i) => {
    const ci = i % topCities.length;
    const ti = i % topTitles.length;
    const isPremium = i < 5;
    const isFeatured = !isPremium && i % 7 === 0;
    return {
      id: i + 1,
      rank: i + 1,
      title: `${topTitles[ti]} ${["U10","U12","U14","U16","U18","Open"][i % 6]}`,
      city: topCities[ci],
      country: topCountries[ci],
      date: `${["May","Jun","Jul","Aug","Sep","Oct"][i % 6]} ${10 + (i % 18)}, 2026`,
      price: i % 9 === 0 ? "Free" : `€${120 + (i * 17) % 600}`,
      rating: (4.2 + (i % 8) / 10).toFixed(1),
      reviews: 8 + (i * 3) % 90,
      img: topImages[i % topImages.length],
      isPremium,
      isFeatured,
    };
  });

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
        </Container>
      </section>

      {/* LAUNCH PROMO */}
      <section className="py-6">
        <Container>
          <LaunchPromo
            label={t("launchPromo.label")}
            title={t("launchPromo.title")}
            subtitle={t("launchPromo.subtitle")}
            remainingLabel={t("launchPromo.remaining")}
            cta={t("launchPromo.cta")}
            spotsLeft={42}
            spotsTotal={50}
          />
        </Container>
      </section>

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
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="relative">
                  <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
                    <c.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{c.label}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <span>{c.count} {tNav("events").toLowerCase()}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURED */}
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
              <article
                key={e.id}
                className="group overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-muted)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${e.img})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    {e.variant === "premium" ? (
                      <span
                        className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-premium)] text-white shadow-[var(--shadow-md)] ring-2 ring-white/80"
                        title={e.tag}
                        aria-label={e.tag}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </span>
                    ) : (
                      <span
                        className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-pitch-500)] text-white shadow-[var(--shadow-md)] ring-2 ring-white/80"
                        title={e.tag}
                        aria-label={e.tag}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)] line-clamp-1 group-hover:text-[var(--color-pitch-700)]">
                    {e.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-sm text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.city}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{e.date}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                    <div className="text-sm">
                      <span className="text-[var(--color-muted)]">{tCommon("from")} </span>
                      <span className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">{e.price}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-muted)] transition-all group-hover:translate-x-1 group-hover:text-[var(--color-pitch-600)]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* TOP 50 — 5 per row */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-300)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-600)]">
                <TrendingUp className="h-3.5 w-3.5" /> Top 50
              </span>
              <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                Top 50 football events worldwide
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
            {top50.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)] bg-cover bg-center"
                  style={{ backgroundImage: `url(${e.img})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[11px] font-bold text-[var(--color-foreground)] shadow-[var(--shadow-sm)]">
                    {e.rank}
                  </span>
                  {e.isPremium && (
                    <span
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-premium)] text-white shadow-[var(--shadow-sm)] ring-2 ring-white/80"
                      title={tCommon("premium")}
                      aria-label={tCommon("premium")}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                  {e.isFeatured && (
                    <span
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-pitch-500)] text-white shadow-[var(--shadow-sm)] ring-2 ring-white/80"
                      title={tCommon("featured")}
                      aria-label={tCommon("featured")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
                    {e.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{e.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">{e.date}</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--color-border)] pt-2.5">
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-[var(--color-premium)] text-[var(--color-premium)]" />
                      <span className="font-semibold text-[var(--color-foreground)]">{e.rating}</span>
                      <span className="text-[var(--color-muted)]">({e.reviews})</span>
                    </div>
                    <div className="text-right">
                      {e.price === "Free" ? (
                        <span className="text-xs font-bold uppercase text-[var(--color-pitch-700)]">{tCommon("free")}</span>
                      ) : (
                        <>
                          <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{tCommon("from")}</div>
                          <div className="font-[family-name:var(--font-manrope)] text-sm font-bold text-[var(--color-foreground)]">{e.price}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

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
                    <Link href="/auth/sign-up?role=organizer">
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
