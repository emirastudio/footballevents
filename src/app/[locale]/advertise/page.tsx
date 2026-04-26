import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { LaunchPromo } from "@/components/site/LaunchPromo";
import { db } from "@/lib/db";
import {
  ArrowRight, Users, Globe2, TrendingUp, Clock, Sparkles, Star, Crown,
  Megaphone, Layers, Newspaper, MapPin, Search, BadgeCheck,
  Languages, MessageSquare, ShieldCheck, Rocket, Zap,
  Calendar, ChevronRight, Trophy, Smartphone, Building2, UserCircle2,
  Home, FileText, ListFilter,
} from "lucide-react";

const HIDE_DEMO = process.env.HIDE_DEMO === "1";
const eventWhere = HIDE_DEMO ? { status: "PUBLISHED" as const, isDemo: false } : { status: "PUBLISHED" as const };

export default async function CapabilitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t    = await getTranslations("advertise");
  const tNav = await getTranslations("nav");

  const [eventCount, organizerCount, venueCount, countryRows] = await Promise.all([
    db.event.count({ where: eventWhere }),
    db.organizer.count(),
    db.venue.count(),
    db.event.findMany({ where: eventWhere, distinct: ["countryCode"], select: { countryCode: true } }),
  ]);
  const countryCount = countryRows.length;

  type AudienceCard = { value: string; label: string; icon: typeof Users };
  const audience: AudienceCard[] = [];
  if (eventCount > 0)     audience.push({ value: String(eventCount),     label: tNav("events"),     icon: Calendar });
  if (organizerCount > 0) audience.push({ value: String(organizerCount), label: tNav("organizers"), icon: Users });
  if (venueCount > 0)     audience.push({ value: String(venueCount),     label: tNav("stadiums"),   icon: Building2 });
  if (countryCount > 0)   audience.push({ value: String(countryCount),   label: t("countriesLabel"), icon: Globe2 });

  const channels = [
    { key: "channel1", icon: BadgeCheck, tone: "neutral" as const },
    { key: "channel2", icon: Sparkles,    tone: "accent"  as const },
    { key: "channel3", icon: Crown,       tone: "premium" as const },
    { key: "channel4", icon: Megaphone,   tone: "info"    as const },
  ];

  const advantages = [
    { key: "advantage1", icon: Search        },
    { key: "advantage2", icon: Languages     },
    { key: "advantage3", icon: Star          },
    { key: "advantage4", icon: ShieldCheck   },
    { key: "advantage5", icon: MessageSquare },
    { key: "advantage6", icon: Rocket        },
  ];

  const placements = [
    { key: "placement1",  icon: Home,        w: 1280, h: 400 },
    { key: "placement2",  icon: Layers,      w: 1280, h: 200 },
    { key: "placement3",  icon: ListFilter,  w: 1200, h: 200 },
    { key: "placement4",  icon: Newspaper,   w: 970,  h: 250 },
    { key: "placement5",  icon: Search,      w: 1200, h: 120 },
    { key: "placement6",  icon: FileText,    w: 970,  h: 250 },
    { key: "placement7",  icon: Megaphone,   w: 300,  h: 600 },
    { key: "placement8",  icon: Trophy,      w: 728,  h: 250 },
    { key: "placement9",  icon: Building2,   w: 728,  h: 90  },
    { key: "placement10", icon: UserCircle2, w: 970,  h: 90  },
    { key: "placement11", icon: Smartphone,  w: 320,  h: 100 },
    { key: "placement12", icon: Globe2,      w: 1280, h: 120 },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-hero-stadium">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <Container className="relative py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Link href="/" className="hover:text-[var(--color-pitch-700)]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[var(--color-foreground)]">{tNav("advertise")}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
              {t("eyebrow")}
            </div>
            <h1 className="text-balance font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg text-[var(--color-muted-strong)]">
              {t("pageSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/auth/sign-up?role=organizer">
                  {t("ctaPrimary")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* LAUNCH PROMO */}
      <section className="-mt-8 sm:-mt-12">
        <Container>
          <LaunchPromo
            label={t("launchPromo.label")}
            title={t("launchPromo.title")}
            subtitle={t("launchPromo.subtitle")}
            remainingLabel={t("launchPromo.remaining")}
            cta={t("launchPromo.cta")}
          />
        </Container>
      </section>

      {/* AUDIENCE — real DB counts; section hidden until there's something to show */}
      {audience.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container>
            <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
              {t("audienceTitle")}
            </h2>
            <div className={`grid gap-4 ${audience.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}>
              {audience.map((a) => (
                <div key={a.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                  <a.icon className="mb-3 h-5 w-5 text-[var(--color-pitch-600)]" />
                  <div className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">{a.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">{a.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* VISION */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                {t("vision.eyebrow")}
              </span>
              <h2 className="mt-4 text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                {t("vision.title")}
              </h2>
              <p className="mt-5 text-pretty leading-relaxed text-[var(--color-muted-strong)]">{t("vision.p1")}</p>
              <p className="mt-4 text-pretty leading-relaxed text-[var(--color-muted-strong)]">{t("vision.p2")}</p>
            </div>

            {/* Mock catalog mini-frame */}
            <div className="relative">
              <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-xl)]">
                <div className="flex items-center gap-1.5 px-3 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 truncate rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-[10px] font-mono text-[var(--color-muted)]">
                    footballevents.eu/events
                  </span>
                </div>
                <div className="rounded-[var(--radius-lg)] bg-soft-cream p-5">
                  <div className="mb-3 flex gap-1.5">
                    {["Tournaments", "Camps", "Festivals", "Match Tours"].map((c, i) => (
                      <span key={c} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? "bg-[var(--color-pitch-500)] text-white" : "bg-white text-[var(--color-muted-strong)] ring-1 ring-[var(--color-border)]"}`}>{c}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { tone: "premium", title: "Iberia Cup U14", city: "Barcelona", price: "€480" },
                      { tone: "featured", title: "Alpine Camp", city: "Innsbruck", price: "€620" },
                      { tone: "regular", title: "London Open", city: "London", price: "€185" },
                    ].map((m, i) => (
                      <div key={i} className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-[var(--color-border)]">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--color-pitch-100)] via-[var(--color-pitch-50)] to-[var(--color-navy-50)]">
                          {m.tone === "premium" && (
                            <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-premium)] text-white ring-2 ring-white">
                              <Star className="h-2.5 w-2.5 fill-current" />
                            </span>
                          )}
                          {m.tone === "featured" && (
                            <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-pitch-500)] text-white ring-2 ring-white">
                              <Sparkles className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="truncate text-[11px] font-semibold text-[var(--color-foreground)]">{m.title}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--color-muted)]">
                            <MapPin className="h-2 w-2" />{m.city}
                          </div>
                          <div className="mt-1 text-[10px] font-bold text-[var(--color-foreground)]">{m.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating accent */}
              <div className="absolute -right-3 -top-3 hidden rounded-full bg-[var(--color-premium)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[var(--shadow-md)] sm:block">
                Live preview
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4 CHANNELS */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t("channelsTitle")}
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">{t("channelsSubtitle")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((c) => {
              const data = t.raw(c.key) as { tag: string; title: string; desc: string; bullets: string[] };
              const toneClass =
                c.tone === "premium" ? "bg-[var(--color-gold-300)]/30 text-[var(--color-gold-600)] ring-[var(--color-gold-400)]"
                : c.tone === "accent" ? "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-[var(--color-pitch-200)]"
                : c.tone === "info"   ? "bg-blue-50 text-blue-700 ring-blue-200"
                : "bg-[var(--color-surface-muted)] text-[var(--color-foreground)] ring-[var(--color-border)]";
              return (
                <div key={c.key} className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-xs)]">
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-[var(--radius-md)] ring-1 ${toneClass}`}>
                      <c.icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{data.tag}</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{data.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{data.desc}</p>
                  <ul className="mt-5 space-y-2">
                    {data.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--color-foreground)]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-pitch-500)]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* SHOWCASE — visibility comparison */}
      <section className="py-16 sm:py-20 bg-soft-cream border-y border-[var(--color-border)]">
        <Container>
          <div className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t("showcaseTitle")}
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">{t("showcaseSubtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { variant: "regular",  data: t.raw("showcaseRegular"),  Icon: null,      tone: "neutral" },
              { variant: "featured", data: t.raw("showcaseFeatured"), Icon: Sparkles,  tone: "accent"  },
              { variant: "premium",  data: t.raw("showcasePremium"),  Icon: Star,      tone: "premium" },
            ].map(({ variant, data, Icon, tone }) => {
              const d = data as { tag: string; title: string; desc: string };
              return (
                <div
                  key={variant}
                  className={`relative overflow-hidden rounded-[var(--radius-2xl)] border bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] ${
                    tone === "premium" ? "border-[var(--color-premium)] ring-2 ring-[var(--color-premium)]/20"
                    : tone === "accent" ? "border-[var(--color-pitch-400)] ring-2 ring-[var(--color-pitch-500)]/20"
                    : "border-[var(--color-border)]"
                  }`}
                >
                  <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    tone === "premium" ? "bg-[var(--color-premium)] text-white"
                    : tone === "accent" ? "bg-[var(--color-pitch-500)] text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-muted-strong)]"
                  }`}>
                    {Icon && <Icon className="h-3 w-3 fill-current" />}
                    {d.tag}
                  </span>

                  {/* Mock card preview */}
                  <div className="mb-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                    <div
                      className="relative aspect-[16/9] bg-cover bg-center"
                      style={{ backgroundImage: "url(https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80)" }}
                    >
                      {Icon && (
                        <span className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-white shadow-[var(--shadow-sm)] ring-2 ring-white/80 ${
                          tone === "premium" ? "bg-[var(--color-premium)]" : "bg-[var(--color-pitch-500)]"
                        }`}>
                          <Icon className="h-3.5 w-3.5 fill-current" />
                        </span>
                      )}
                    </div>
                    <div className="bg-white p-3">
                      <div className="text-sm font-semibold text-[var(--color-foreground)]">Mediterranean Cup U14</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <MapPin className="h-3 w-3" /> Barcelona, Spain
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[var(--color-premium)] text-[var(--color-premium)]" />
                          <span className="font-semibold">4.8</span>
                        </span>
                        <span className="font-bold text-[var(--color-foreground)]">€480</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">{d.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ADVANTAGES */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 max-w-2xl font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            {t("advantagesTitle")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((a) => {
              const d = t.raw(a.key) as { title: string; desc: string };
              return (
                <div key={a.key} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-[var(--color-foreground)]">{d.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-muted-strong)]">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* PLACEMENTS — banner formats */}
      <section className="py-16 sm:py-20 bg-soft-cream border-y border-[var(--color-border)]">
        <Container>
          <div className="mb-10 max-w-2xl">
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t("placementsTitle")}
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">{t("placementsSubtitle")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {placements.map((p) => {
              const d = t.raw(p.key) as { where: string; title: string; size: string; desc: string };
              const aspect = p.w / p.h;
              // Cap visual rectangle to fit nicely: max 220 wide, max 110 tall
              const maxW = 220, maxH = 110;
              let vw = maxW, vh = maxW / aspect;
              if (vh > maxH) { vh = maxH; vw = maxH * aspect; }
              return (
                <div key={p.key} className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
                        <p.icon className="h-4 w-4" />
                      </span>
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{d.where}</span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-semibold tracking-wider text-[var(--color-muted)]">{d.size}</span>
                  </div>

                  {/* Proportion preview */}
                  <div className="mb-4 flex h-[120px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2">
                    <div
                      className="grid place-items-center rounded-sm border border-dashed border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]"
                      style={{ width: `${vw}px`, height: `${vh}px` }}
                      aria-hidden
                    >
                      Ad
                    </div>
                  </div>

                  <h3 className="font-semibold text-[var(--color-foreground)]">{d.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 max-w-2xl font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
            {t("howItWorksTitle")}
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { key: "step1", icon: Zap     },
              { key: "step2", icon: Trophy  },
              { key: "step3", icon: Calendar},
            ].map((s, i) => {
              const d = t.raw(s.key) as { title: string; desc: string };
              return (
                <div key={s.key} className="relative rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                  <div className="absolute -top-3 right-5 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-pitch-500)] text-xs font-bold text-white shadow-[var(--shadow-sm)]">
                    {i + 1}
                  </div>
                  <s.icon className="h-6 w-6 text-[var(--color-pitch-600)]" />
                  <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">{d.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-muted-strong)]">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="bg-soft-cream overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] p-10 text-center shadow-[var(--shadow-md)] sm:p-16">
            <h2 className="text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted-strong)]">{t("finalCtaSubtitle")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/auth/sign-up?role=organizer">
                  {t("finalCta1")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">{t("finalCta2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
