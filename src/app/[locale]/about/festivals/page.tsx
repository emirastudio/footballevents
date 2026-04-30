import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Star,
  Music,
  Users,
  Sun,
  Globe,
  Heart,
  Trophy,
  Zap,
  Camera,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutFestivals" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/festivals` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/festivals`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function FestivalsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutFestivals");

  const festivalTypes = [
    { icon: Globe, title: t("types.0.title"), desc: t("types.0.desc") },
    { icon: Sun, title: t("types.1.title"), desc: t("types.1.desc") },
    { icon: Users, title: t("types.2.title"), desc: t("types.2.desc") },
    { icon: Music, title: t("types.3.title"), desc: t("types.3.desc") },
    { icon: Trophy, title: t("types.4.title"), desc: t("types.4.desc") },
    { icon: Camera, title: t("types.5.title"), desc: t("types.5.desc") },
  ];

  const whyFestival = [
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
            <Link href="/categories/festivals">{t("ctaView")}</Link>
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

      {/* Types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("typesTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {festivalTypes.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-purple-50">
                  <f.icon className="h-5 w-5 text-purple-600" />
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

      {/* Why festival */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-gradient-to-br from-purple-50 to-pink-50 p-8">
            <Zap className="mb-4 h-8 w-8 text-purple-600" />
            <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
              &ldquo;{t("testimonialQuote")}&rdquo;
            </blockquote>
            <div className="mt-4 text-sm text-[var(--color-muted)]">{t("testimonialAuthor")}</div>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              {t("whyTitle")}
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              {t("whyBody")}
            </p>
            <ul className="mt-6 space-y-2">
              {whyFestival.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  {b}
                </li>
              ))}
            </ul>
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
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/festivals">{t("ctaView")}</Link>
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
