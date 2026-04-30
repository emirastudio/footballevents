import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Plane,
  Ticket,
  Hotel,
  Users,
  Star,
  Camera,
  Mic,
  Trophy,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutMatchTours" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: `${SITE_URL}/${locale}/about/match-tours` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${locale}/about/match-tours`,
      title: t("metaTitle"),
      description: t("metaDesc"),
    },
  };
}

export default async function MatchToursAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("aboutMatchTours");

  const leagues = [
    { label: t("leagues.0.label"), flag: t("leagues.0.flag") },
    { label: t("leagues.1.label"), flag: t("leagues.1.flag") },
    { label: t("leagues.2.label"), flag: t("leagues.2.flag") },
    { label: t("leagues.3.label"), flag: t("leagues.3.flag") },
    { label: t("leagues.4.label"), flag: t("leagues.4.flag") },
    { label: t("leagues.5.label"), flag: t("leagues.5.flag") },
    { label: t("leagues.6.label"), flag: t("leagues.6.flag") },
    { label: t("leagues.7.label"), flag: t("leagues.7.flag") },
  ];

  const included = [
    { icon: Ticket, title: t("included.0.title"), desc: t("included.0.desc") },
    { icon: Hotel, title: t("included.1.title"), desc: t("included.1.desc") },
    { icon: Plane, title: t("included.2.title"), desc: t("included.2.desc") },
    { icon: Camera, title: t("included.3.title"), desc: t("included.3.desc") },
    { icon: Mic, title: t("included.4.title"), desc: t("included.4.desc") },
    { icon: Users, title: t("included.5.title"), desc: t("included.5.desc") },
  ];

  const forWhom = [
    { title: t("forWhom.0.title"), desc: t("forWhom.0.desc") },
    { title: t("forWhom.1.title"), desc: t("forWhom.1.desc") },
    { title: t("forWhom.2.title"), desc: t("forWhom.2.desc") },
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
            <Link href="/categories/match-tours">{t("ctaView")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">{t("ctaPost")}</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Why live */}
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

      {/* Leagues */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("leaguesTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {leagues.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="text-sm font-medium text-[var(--color-foreground)]">{l.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            {t("leaguesNote")}
          </p>
        </Container>
      </div>

      {/* What's included */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("includedTitle")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((it) => (
            <div
              key={it.title}
              className="flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-blue-50">
                <it.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-foreground)]">{it.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          {t("includedNote")}
        </p>
      </Container>

      {/* For whom */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            {t("forWhomTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {forWhom.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <Trophy className="mb-3 h-6 w-6 text-amber-500" />
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Testimonial */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="mb-2 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
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
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/match-tours">{t("ctaView2")}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
