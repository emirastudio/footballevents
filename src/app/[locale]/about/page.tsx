import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Tent,
  Star,
  Plane,
  Dumbbell,
  Target,
  Globe,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutPage");

  const categories = [
    {
      href: "/about/tournaments",
      icon: Trophy,
      label: t("categories.0.label"),
      desc: t("categories.0.desc"),
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      href: "/about/camps",
      icon: Tent,
      label: t("categories.1.label"),
      desc: t("categories.1.desc"),
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      href: "/about/festivals",
      icon: Star,
      label: t("categories.2.label"),
      desc: t("categories.2.desc"),
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      href: "/about/match-tours",
      icon: Plane,
      label: t("categories.3.label"),
      desc: t("categories.3.desc"),
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/about/training-camps",
      icon: Dumbbell,
      label: t("categories.4.label"),
      desc: t("categories.4.desc"),
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      href: "/about/academy-trials",
      icon: Target,
      label: t("categories.5.label"),
      desc: t("categories.5.desc"),
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
  ];

  const forWhom = [
    {
      href: "/about/for-organizers",
      icon: BarChart3,
      title: t("forWhom.0.title"),
      desc: t("forWhom.0.desc"),
      cta: t("forWhom.0.cta"),
    },
    {
      href: "/about/for-clubs",
      icon: Building2,
      title: t("forWhom.1.title"),
      desc: t("forWhom.1.desc"),
      cta: t("forWhom.1.cta"),
    },
    {
      href: "/about/for-players",
      icon: Users,
      title: t("forWhom.2.title"),
      desc: t("forWhom.2.desc"),
      cta: t("forWhom.2.cta"),
    },
  ];

  const benefits = [
    { icon: Globe, title: t("benefits.0.title"), desc: t("benefits.0.desc") },
    { icon: Zap, title: t("benefits.1.title"), desc: t("benefits.1.desc") },
    { icon: Shield, title: t("benefits.2.title"), desc: t("benefits.2.desc") },
    { icon: CheckCircle2, title: t("benefits.3.title"), desc: t("benefits.3.desc") },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[{ href: "/", label: t("breadcrumbHome") }, { label: t("breadcrumbAbout") }]}
      />

      {/* Stats strip */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Container>
          <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] py-8 sm:grid-cols-4">
            {[
              { num: "50+", label: t("statCountries") },
              { num: "1 000+", label: t("statEvents") },
              { num: "200+", label: t("statOrganizers") },
              { num: "6", label: t("statFormats") },
            ].map((s) => (
              <div key={s.label} className="px-6 text-center first:pl-0 last:pr-0">
                <div className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                  {s.num}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Mission */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("missionTitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-strong)] sm:text-lg">
            {t("missionBody1")}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-strong)] sm:text-lg">
            {t("missionBody2")}
          </p>
        </div>
      </Container>

      {/* 6 formats */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("formatsTitle")}
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">
              {t("formatsSubtitle")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
                    {c.label}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{c.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </div>

      {/* For whom */}
      <Container className="py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("forWhomTitle")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {forWhom.map((f) => (
            <div
              key={f.href}
              className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
            >
              <f.icon className="mb-4 h-8 w-8 text-[var(--color-pitch-700)]" />
              <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                {f.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted-strong)]">{f.desc}</p>
              <Link
                href={f.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-pitch-700)] hover:underline"
              >
                {f.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </Container>

      {/* Benefits */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("benefitsTitle")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 text-center">
                <b.icon className="mx-auto mb-3 h-8 w-8 text-[var(--color-pitch-700)]" />
                <div className="font-[family-name:var(--font-manrope)] font-bold text-[var(--color-foreground)]">
                  {b.title}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{b.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* About company */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("companyTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("companyBody1")}
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("companyBody2")}{" "}
            <a href="mailto:support@footballevents.eu" className="font-medium text-[var(--color-pitch-700)] hover:underline">support@footballevents.eu</a>.
          </p>
        </div>
      </Container>

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
                <Link href="/events">{t("ctaFind")}</Link>
              </Button>
              <Button asChild variant="white" size="lg">
                <Link href="/organizer/events/new">{t("ctaPost")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
