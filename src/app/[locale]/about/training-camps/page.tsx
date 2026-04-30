import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Dumbbell,
  Target,
  Users,
  MapPin,
  CalendarDays,
  Shield,
  CheckCircle2,
  BarChart3,
  Zap,
  ArrowRight,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutTrainingCamps" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/training-camps` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/training-camps`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function TrainingCampsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutTrainingCamps");

  const campTypes = [
    { icon: Zap, title: t("types.0.title"), desc: t("types.0.desc") },
    { icon: Target, title: t("types.1.title"), desc: t("types.1.desc") },
    { icon: Dumbbell, title: t("types.2.title"), desc: t("types.2.desc") },
    { icon: Users, title: t("types.3.title"), desc: t("types.3.desc") },
    { icon: BarChart3, title: t("types.4.title"), desc: t("types.4.desc") },
    { icon: Shield, title: t("types.5.title"), desc: t("types.5.desc") },
  ];

  const destinations = [
    { flag: t("destinations.0.flag"), country: t("destinations.0.country"), note: t("destinations.0.note") },
    { flag: t("destinations.1.flag"), country: t("destinations.1.country"), note: t("destinations.1.note") },
    { flag: t("destinations.2.flag"), country: t("destinations.2.country"), note: t("destinations.2.note") },
    { flag: t("destinations.3.flag"), country: t("destinations.3.country"), note: t("destinations.3.note") },
    { flag: t("destinations.4.flag"), country: t("destinations.4.country"), note: t("destinations.4.note") },
    { flag: t("destinations.5.flag"), country: t("destinations.5.country"), note: t("destinations.5.note") },
    { flag: t("destinations.6.flag"), country: t("destinations.6.country"), note: t("destinations.6.note") },
    { flag: t("destinations.7.flag"), country: t("destinations.7.country"), note: t("destinations.7.note") },
  ];

  const benefitsForOrg = [
    t("orgBenefits.0"),
    t("orgBenefits.1"),
    t("orgBenefits.2"),
    t("orgBenefits.3"),
    t("orgBenefits.4"),
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

      {/* Why */}
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
            {campTypes.map((c) => (
              <div
                key={c.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-rose-50">
                  <c.icon className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{c.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Destinations */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("destinationsTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <div
              key={d.country}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">{d.flag}</span>
                <span className="font-semibold text-[var(--color-foreground)]">{d.country}</span>
              </div>
              <div className="text-xs text-[var(--color-muted)]">{d.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <MapPin className="h-4 w-4" />
          {t("destinationsNote")}
        </p>
      </Container>

      {/* For providers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                {t("forOrgTitle")}
              </div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {t("forOrgHeadline")}
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                {t("forOrgBody")}
              </p>
              <ul className="mt-6 space-y-2">
                {benefitsForOrg.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="accent">
                  <Link href="/about/for-organizers">{t("forOrgCta")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: CalendarDays, label: t("orgFeatures.0.label"), val: t("orgFeatures.0.val") },
                { icon: Users, label: t("orgFeatures.1.label"), val: t("orgFeatures.1.val") },
                { icon: MapPin, label: t("orgFeatures.2.label"), val: t("orgFeatures.2.val") },
                { icon: BarChart3, label: t("orgFeatures.3.label"), val: t("orgFeatures.3.val") },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                >
                  <f.icon className="h-5 w-5 shrink-0 text-[var(--color-pitch-700)]" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">{f.label}</div>
                    <div className="text-xs text-[var(--color-muted)]">{f.val}</div>
                  </div>
                </div>
              ))}
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
