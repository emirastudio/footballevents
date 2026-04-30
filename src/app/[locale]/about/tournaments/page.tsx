import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Globe,
  Users,
  ClipboardList,
  Filter,
  Star,
  ArrowRight,
  CheckCircle2,
  MapPin,
  CalendarDays,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutTournaments" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/tournaments` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/tournaments`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function TournamentsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutTournaments");

  const types = [
    { icon: Users, title: t("types.0.title"), desc: t("types.0.desc") },
    { icon: Trophy, title: t("types.1.title"), desc: t("types.1.desc") },
    { icon: Globe, title: t("types.2.title"), desc: t("types.2.desc") },
    { icon: Star, title: t("types.3.title"), desc: t("types.3.desc") },
  ];

  const howItWorks = [
    { num: t("how.0.num"), title: t("how.0.title"), desc: t("how.0.desc") },
    { num: t("how.1.num"), title: t("how.1.title"), desc: t("how.1.desc") },
    { num: t("how.2.num"), title: t("how.2.title"), desc: t("how.2.desc") },
    { num: t("how.3.num"), title: t("how.3.title"), desc: t("how.3.desc") },
  ];

  const organizerBenefits = [
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
            <Link href="/categories/tournaments">{t("ctaView")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">{t("ctaPost")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Why tournaments */}
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

      {/* Types grid */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("typesTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {types.map((t2) => (
              <div
                key={t2.title}
                className="flex gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-amber-50">
                  <t2.icon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                    {t2.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{t2.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* How it works */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("howTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <div key={s.num} className="relative">
              <div className="mb-3 font-[family-name:var(--font-manrope)] text-4xl font-bold text-[var(--color-border)]">
                {s.num}
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* For organizers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
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
                {organizerBenefits.map((b) => (
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
                { icon: MapPin, label: t("orgFeatures.0.label"), val: t("orgFeatures.0.val") },
                { icon: Filter, label: t("orgFeatures.1.label"), val: t("orgFeatures.1.val") },
                { icon: ClipboardList, label: t("orgFeatures.2.label"), val: t("orgFeatures.2.val") },
                { icon: CalendarDays, label: t("orgFeatures.3.label"), val: t("orgFeatures.3.val") },
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
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/tournaments">{t("ctaView2")}</Link>
              </Button>
              <Button asChild variant="white" size="lg">
                <Link href="/organizer/events/new">{t("ctaPost2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
