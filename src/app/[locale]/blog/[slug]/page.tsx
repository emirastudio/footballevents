import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getOrCreateTranslation } from "@/lib/news/get-or-create-translation";
import { ChevronRight, Trophy } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";
export async function generateStaticParams() { return []; }

async function loadArticle(slug: string, locale: Locale) {
  const article = await db.article.findUnique({
    where: { slug },
    include: { source: { select: { publisher: true, url: true } } },
  });
  if (!article || article.status !== "PUBLISHED") return null;

  // Lazy translation: first non-EN visitor pays a couple of seconds. Returns
  // EN fallback on AI failure so the page never crashes.
  const translation = await getOrCreateTranslation(article.id, locale);
  if (!translation) return null;
  return { article, translation };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loaded = await loadArticle(slug, locale as Locale);
  if (!loaded) return {};
  const { article, translation } = loaded;
  const url = `${SITE_URL}/${locale}/blog/${article.slug}`;
  return {
    title: `${translation.title} | footballevents.eu`,
    description: translation.metaDescription,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/blog/${article.slug}`]),
      ),
    },
    openGraph: {
      type: "article",
      url,
      title: translation.title,
      description: translation.metaDescription,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: translation.title,
      description: translation.metaDescription,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const loaded = await loadArticle(slug, locale as Locale);
  if (!loaded) notFound();
  const { article, translation } = loaded;

  const isWc = article.category === "WC2026";
  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // marked is synchronous when no async extensions are registered. The cast
  // is safe; the body is markdown produced by our own pipeline.
  const bodyHtml = marked.parse(translation.body, { async: false }) as string;

  const url = `${SITE_URL}/${locale}/blog/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: translation.title,
    description: translation.metaDescription,
    articleBody: translation.body,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: locale,
    keywords: article.tags.join(", "),
    url,
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: "footballevents.eu",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "footballevents.eu",
      url: SITE_URL,
    },
  };

  return (
    <>
      {/* Typographic hero — no image, by product decision. The gold accent
          differentiates WC2026 articles in the feed and on social cards. */}
      <section
        className={[
          "relative overflow-hidden",
          isWc ? "bg-[var(--color-navy-900)]" : "bg-[var(--color-bg-muted)]",
        ].join(" ")}
      >
        {isWc && (
          <>
            <div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold-400)] to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(900px 360px at 15% -20%, rgba(212,175,55,0.40), transparent 60%), radial-gradient(900px 360px at 95% 120%, rgba(212,175,55,0.28), transparent 55%)",
              }}
            />
            <Trophy
              className="pointer-events-none absolute -right-8 -top-6 h-64 w-64 text-[var(--color-gold-500)]/10"
              aria-hidden
            />
          </>
        )}
        <Container className="relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className={["mb-4 flex items-center gap-1 text-xs", isWc ? "text-white/70" : "text-[var(--color-muted)]"].join(" ")}>
            <Link href="/" className={isWc ? "hover:text-white" : "hover:text-[var(--color-foreground)]"}>Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className={isWc ? "hover:text-white" : "hover:text-[var(--color-foreground)]"}>Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className={isWc ? "text-white" : "text-[var(--color-foreground)]"}>{translation.title}</span>
          </nav>

          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
              isWc
                ? "bg-gradient-to-r from-[var(--color-gold-500)] to-[var(--color-gold-400)] text-[var(--color-navy-900)] shadow-[0_0_20px_rgba(212,175,55,0.45)]"
                : "bg-[var(--color-surface)] text-[var(--color-muted-strong)] border border-[var(--color-border)]",
            ].join(" ")}
          >
            {isWc && <Trophy className="h-3 w-3 fill-current" />}
            {isWc ? "World Cup 2026" : "Football"}
          </span>

          <h1
            className={[
              "mt-4 font-[family-name:var(--font-manrope)] text-3xl font-extrabold leading-[1.1] sm:text-5xl",
              isWc
                ? "text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                : "text-[var(--color-foreground)]",
            ].join(" ")}
          >
            {translation.title}
          </h1>

          {dateLabel && (
            <p className={["mt-3 text-sm", isWc ? "text-white/70" : "text-[var(--color-muted)]"].join(" ")}>{dateLabel}</p>
          )}

          {translation.lead && (
            <p
              className={[
                "mt-5 max-w-3xl text-lg leading-relaxed",
                isWc ? "text-[var(--color-gold-200)]" : "text-[var(--color-muted-strong)]",
              ].join(" ")}
            >
              {translation.lead}
            </p>
          )}
        </Container>
      </section>

      <Container className="py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article
          className="prose prose-neutral mx-auto max-w-3xl text-[var(--color-foreground)] prose-headings:font-[family-name:var(--font-manrope)] prose-a:text-[var(--color-gold-700)]"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        {article.source && (
          <p className="mx-auto mt-8 max-w-3xl text-xs text-[var(--color-muted)]">
            Reported via {article.source.publisher.replace(/^newsapi:/, "")}.
          </p>
        )}
        {article.tags.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap gap-2">
            {article.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-xs text-[var(--color-muted-strong)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mx-auto mt-10 max-w-3xl border-t border-[var(--color-border)] pt-6">
          <Link href="/blog" className="text-sm font-semibold text-[var(--color-foreground)] hover:underline">
            ← Back to all news
          </Link>
        </div>
      </Container>
    </>
  );
}
