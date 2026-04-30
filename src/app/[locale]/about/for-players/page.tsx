import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  ClipboardList,
  Target,
  Globe,
  Heart,
  Star,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Tent,
  Filter,
  BellRing,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPlayers" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/for-players` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/for-players`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function ForPlayersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutPlayers");

  const features = [
    { icon: Search, title: t("features.0.title"), desc: t("features.0.desc") },
    { icon: Filter, title: t("features.1.title"), desc: t("features.1.desc") },
    { icon: ClipboardList, title: t("features.2.title"), desc: t("features.2.desc") },
    { icon: BellRing, title: t("features.3.title"), desc: t("features.3.desc") },
    { icon: Heart, title: t("features.4.title"), desc: t("features.4.desc") },
    { icon: Globe, title: t("features.5.title"), desc: t("features.5.desc") },
  ];

  const journeySteps = [
    { icon: Search, label: t("journey.0.label"), desc: t("journey.0.desc") },
    { icon: ClipboardList, label: t("journey.1.label"), desc: t("journey.1.desc") },
    { icon: BellRing, label: t("journey.2.label"), desc: t("journey.2.desc") },
    { icon: Trophy, label: t("journey.3.label"), desc: t("journey.3.desc") },
  ];

  const forParents = [
    t("parentsBenefits.0"),
    t("parentsBenefits.1"),
    t("parentsBenefits.2"),
    t("parentsBenefits.3"),
    t("parentsBenefits.4"),
    t("parentsBenefits.5"),
  ];

  const eventTypes = [
    { href: "/about/tournaments", icon: Trophy, label: t("eventTypes.0.label"), desc: t("eventTypes.0.desc") },
    { href: "/about/camps", icon: Tent, label: t("eventTypes.1.label"), desc: t("eventTypes.1.desc") },
    { href: "/about/academy-trials", icon: Target, label: t("eventTypes.2.label"), desc: t("eventTypes.2.desc") },
    { href: "/about/training-camps", icon: Users, label: t("eventTypes.3.label"), desc: t("eventTypes.3.desc") },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[
          { href: "/", label: t("breadcrumbHome") },
          { href: "/about", label: t("breadcrumbAbout") },
          { label: t("breadcrumbCurrent") },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/events">{t("ctaFind")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">{t("ctaSignUp")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* What types */}
      <Container className="py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("catalogTitle")}
          </h2>
          <p className="mt-3 text-[var(--color-muted-strong)]">
            {t("catalogSubtitle")}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-pitch-50)]">
                <e.icon className="h-6 w-6 text-[var(--color-pitch-700)]" />
              </div>
              <div>
                <div className="font-[family-name:var(--font-manrope)] font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
                  {e.label}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{e.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-pitch-700)]" />
            </Link>
          ))}
        </div>
      </Container>

      {/* Features */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-pitch-50)]">
                  <f.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Journey */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("journeyTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((s, i) => (
            <div key={s.label} className="relative">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-pitch-50)]">
                <s.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
              </div>
              <div className="mb-1 font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {t("journeyStep")} {i + 1}
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                {s.label}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* For parents */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {t("parentsTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                {t("parentsBody")}
              </p>
              <ul className="mt-6 space-y-2">
                {forParents.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <Star className="mb-4 h-8 w-8 text-amber-500" />
              <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
                &ldquo;{t("testimonialQuote")}&rdquo;
              </blockquote>
              <div className="mt-4 text-sm text-[var(--color-muted)]">{t("testimonialAuthor")}</div>
            </div>
          </div>
        </Container>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-3 text-white/70">{t("ctaSubtitle")}</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">{t("ctaFind2")}</Link>
              </Button>
              <Button asChild variant="white" size="lg">
                <Link href="/sign-up">{t("ctaAccount")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
