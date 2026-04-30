import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Tent,
  GraduationCap,
  Heart,
  Globe,
  Sun,
  Users,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  Star,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutCamps" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/camps` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/camps`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function CampsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutCamps");

  const campTypes = [
    { icon: Sun, title: t("types.0.title"), desc: t("types.0.desc") },
    { icon: Dumbbell, title: t("types.1.title"), desc: t("types.1.desc") },
    { icon: Globe, title: t("types.2.title"), desc: t("types.2.desc") },
    { icon: GraduationCap, title: t("types.3.title"), desc: t("types.3.desc") },
    { icon: Users, title: t("types.4.title"), desc: t("types.4.desc") },
    { icon: Heart, title: t("types.5.title"), desc: t("types.5.desc") },
  ];

  const whyBenefits = [
    t("whyBenefits.0"),
    t("whyBenefits.1"),
    t("whyBenefits.2"),
    t("whyBenefits.3"),
    t("whyBenefits.4"),
    t("whyBenefits.5"),
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
            <Link href="/categories/camps">{t("ctaView")}</Link>
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
            {t("openingTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("openingBody1")}
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("openingBody2")}
          </p>
        </div>
      </Container>

      {/* Camp types */}
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
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-emerald-50">
                  <c.icon className="h-5 w-5 text-emerald-600" />
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

      {/* Why camp */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("whyTitle")}
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              {t("whyBody")}
            </p>
            <ul className="mt-6 space-y-2">
              {whyBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted,#F4F6FA)] p-8">
            <Star className="mb-4 h-8 w-8 text-amber-500" />
            <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
              &ldquo;{t("testimonialQuote")}&rdquo;
            </blockquote>
            <div className="mt-4 text-sm text-[var(--color-muted)]">{t("testimonialAuthor")}</div>
          </div>
        </div>
      </Container>

      {/* For organizers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
              {t("forOrgTitle")}
            </div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("forOrgHeadline")}
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              {t("forOrgBody")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent">
                <Link href="/about/for-organizers">{t("forOrgCta")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">{t("ctaPricing")}</Link>
              </Button>
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
                <Link href="/categories/camps">{t("ctaView2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
