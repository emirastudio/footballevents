import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  Globe,
  ClipboardList,
  Zap,
  Star,
  Shield,
  CheckCircle2,
  Megaphone,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutOrganizers" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/for-organizers` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/for-organizers`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function ForOrganizersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutOrganizers");

  const features = [
    { icon: Globe, title: t("features.0.title"), desc: t("features.0.desc") },
    { icon: ClipboardList, title: t("features.1.title"), desc: t("features.1.desc") },
    { icon: Zap, title: t("features.2.title"), desc: t("features.2.desc") },
    { icon: BarChart3, title: t("features.3.title"), desc: t("features.3.desc") },
    { icon: Shield, title: t("features.4.title"), desc: t("features.4.desc") },
    { icon: Star, title: t("features.5.title"), desc: t("features.5.desc") },
  ];

  const tiers = [
    {
      name: t("tiers.0.name"),
      price: t("tiers.0.price"),
      desc: t("tiers.0.desc"),
      features: [
        t("tiers.0.features.0"),
        t("tiers.0.features.1"),
        t("tiers.0.features.2"),
        t("tiers.0.features.3"),
      ],
      cta: t("tiers.0.cta"),
      href: "/sign-up",
      highlight: false,
    },
    {
      name: t("tiers.1.name"),
      price: t("tiers.1.price"),
      desc: t("tiers.1.desc"),
      features: [
        t("tiers.1.features.0"),
        t("tiers.1.features.1"),
        t("tiers.1.features.2"),
        t("tiers.1.features.3"),
        t("tiers.1.features.4"),
        t("tiers.1.features.5"),
      ],
      cta: t("tiers.1.cta"),
      href: "/pricing",
      highlight: true,
    },
    {
      name: t("tiers.2.name"),
      price: t("tiers.2.price"),
      desc: t("tiers.2.desc"),
      features: [
        t("tiers.2.features.0"),
        t("tiers.2.features.1"),
        t("tiers.2.features.2"),
        t("tiers.2.features.3"),
        t("tiers.2.features.4"),
        t("tiers.2.features.5"),
      ],
      cta: t("tiers.2.cta"),
      href: "/pricing",
      highlight: false,
    },
    {
      name: t("tiers.3.name"),
      price: t("tiers.3.price"),
      desc: t("tiers.3.desc"),
      features: [
        t("tiers.3.features.0"),
        t("tiers.3.features.1"),
        t("tiers.3.features.2"),
        t("tiers.3.features.3"),
      ],
      cta: t("tiers.3.cta"),
      href: "/contact",
      highlight: false,
    },
  ];

  const steps = [
    { num: t("steps.0.num"), title: t("steps.0.title"), desc: t("steps.0.desc") },
    { num: t("steps.1.num"), title: t("steps.1.title"), desc: t("steps.1.desc") },
    { num: t("steps.2.num"), title: t("steps.2.title"), desc: t("steps.2.desc") },
    { num: t("steps.3.num"), title: t("steps.3.title"), desc: t("steps.3.desc") },
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
            <Link href="/onboarding">{t("ctaStart")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">{t("ctaPricing")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Problem/Solution */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("problemTitle")}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("problemBody1")}
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            {t("problemBody2")}
          </p>
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
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-pitch-50)]">
                  <f.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* How it works */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("stepsTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num}>
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

      {/* Tiers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("tiersTitle")}
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">
              {t("tiersSubtitle")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-[var(--radius-xl)] border p-7 ${
                  tier.highlight
                    ? "border-[var(--color-pitch-700)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              >
                {tier.highlight && (
                  <div className="mb-4 inline-flex w-fit items-center rounded-full bg-[var(--color-pitch-700)] px-3 py-1 text-xs font-semibold text-white">
                    {t("popularBadge")}
                  </div>
                )}
                <div className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                  {tier.name}
                </div>
                <div className="mt-1 font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                  {tier.price}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{tier.desc}</div>
                <ul className="mt-6 flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={tier.highlight ? "accent" : "outline"}
                  className="mt-8"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Testimonial */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <Megaphone className="mb-4 h-8 w-8 text-[var(--color-pitch-700)]" />
          <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
            &ldquo;{t("testimonialQuote")}&rdquo;
          </blockquote>
          <div className="mt-4 text-sm text-[var(--color-muted)]">{t("testimonialAuthor")}</div>
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
                <Link href="/onboarding">{t("ctaCreate")}</Link>
              </Button>
              <Button asChild variant="white" size="lg">
                <Link href="/pricing">{t("ctaPricing2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
