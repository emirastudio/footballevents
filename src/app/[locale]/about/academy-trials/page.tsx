import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Target,
  Star,
  Users,
  GraduationCap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Zap,
  ClipboardList,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutAcademyTrials" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/academy-trials` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/academy-trials`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function AcademyTrialsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutAcademyTrials");

  const trialTypes = [
    { icon: Globe, title: t("types.0.title"), desc: t("types.0.desc") },
    { icon: GraduationCap, title: t("types.1.title"), desc: t("types.1.desc") },
    { icon: Users, title: t("types.2.title"), desc: t("types.2.desc") },
    { icon: Trophy, title: t("types.3.title"), desc: t("types.3.desc") },
    { icon: Zap, title: t("types.4.title"), desc: t("types.4.desc") },
    { icon: ClipboardList, title: t("types.5.title"), desc: t("types.5.desc") },
  ];

  const ageGroups = [
    { label: t("ageGroups.0.label"), note: t("ageGroups.0.note") },
    { label: t("ageGroups.1.label"), note: t("ageGroups.1.note") },
    { label: t("ageGroups.2.label"), note: t("ageGroups.2.note") },
    { label: t("ageGroups.3.label"), note: t("ageGroups.3.note") },
    { label: t("ageGroups.4.label"), note: t("ageGroups.4.note") },
    { label: t("ageGroups.5.label"), note: t("ageGroups.5.note") },
  ];

  const howPrepare = [
    t("prepareTips.0"),
    t("prepareTips.1"),
    t("prepareTips.2"),
    t("prepareTips.3"),
    t("prepareTips.4"),
    t("prepareTips.5"),
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
            <Link href="/organizer/events/new">{t("ctaPost")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Opening */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("whyTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("whyBody1")}
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("whyBody2")}
          </p>
        </div>
      </Container>

      {/* Types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("typesTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trialTypes.map((t2) => (
              <div
                key={t2.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-cyan-50">
                  <t2.icon className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {t2.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{t2.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Age groups */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("ageGroupsTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ageGroups.map((a) => (
            <div
              key={a.label}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="mb-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-pitch-700)]">
                {a.label}
              </div>
              <div className="text-sm text-[var(--color-muted)]">{a.note}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* How to prepare */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {t("prepareTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                {t("prepareBody")}
              </p>
              <ul className="mt-6 space-y-3">
                {howPrepare.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
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

      {/* For academies */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
            {t("forAcademiesTitle")}
          </div>
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("forAcademiesHeadline")}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("forAcademiesBody")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="accent">
              <Link href="/about/for-organizers">{t("forAcademiesCta")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">{t("ctaPricing")}</Link>
            </Button>
          </div>
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
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">{t("ctaView2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
