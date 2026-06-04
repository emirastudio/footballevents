import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ArticleCard, type ArticleCardData } from "@/components/cards/ArticleCard";
import { locales, type Locale } from "@/i18n/config";
import type { ArticleCategory } from "@prisma/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const url = `${SITE_URL}/${locale}/blog`;
  return {
    title: "Football news — World Cup 2026 and beyond | footballevents.eu",
    description:
      "Daily World Cup 2026 coverage and the football stories that matter — qualifiers, competitions, transfers. Written by the footballevents.eu editorial team.",
    alternates: {
      canonical: url,
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}/blog`])),
    },
  };
}

type Filter = "all" | "wc2026" | "general";

function filterFromSearch(value: unknown): Filter {
  if (value === "wc2026") return "wc2026";
  if (value === "general") return "general";
  return "all";
}

function categoryFilter(f: Filter): ArticleCategory | undefined {
  if (f === "wc2026") return "WC2026";
  if (f === "general") return "GENERAL";
  return undefined;
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const filter = filterFromSearch(search.cat);
  const category = categoryFilter(filter);

  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 30,
    include: {
      translations: {
        where: { locale: { in: [locale as Locale, "en"] } },
        select: { locale: true, title: true, lead: true },
      },
    },
  });

  // Pick the requested-locale row if present, otherwise EN. Lazy translation
  // happens on individual article pages — the listing prefers what's cached.
  const cards: ArticleCardData[] = articles.map((a) => {
    const tr = a.translations.find((t) => t.locale === (locale as Locale)) ?? a.translations.find((t) => t.locale === "en");
    return {
      slug: a.slug,
      category: a.category,
      title: tr?.title ?? a.slug,
      lead: tr?.lead ?? "",
      publishedAt: a.publishedAt,
    };
  });

  const chip = (id: Filter, label: string) => (
    <Link
      key={id}
      href={id === "all" ? "/blog" : `/blog?cat=${id}`}
      className={[
        "rounded-full border px-3.5 py-1 text-sm transition",
        filter === id
          ? "border-[var(--color-gold-400)] bg-[var(--color-gold-500)]/15 text-[var(--color-foreground)] font-semibold"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-border-strong)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  return (
    <Container className="py-10">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          Football news
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted-strong)]">
          World Cup 2026 coverage and the football stories shaping the global game —
          curated daily by our editorial team.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {chip("all", "All")}
        {chip("wc2026", "World Cup 2026")}
        {chip("general", "Football")}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted-strong)]">
          Nothing here yet — the next news drop lands in the morning.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((a) => (
            <ArticleCard key={a.slug} article={a} locale={locale} />
          ))}
        </div>
      )}
    </Container>
  );
}
