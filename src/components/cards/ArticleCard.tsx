import { Link } from "@/i18n/navigation";
import { Trophy } from "lucide-react";

// Text-only card — by product decision the news feed carries NO images. The
// design leans on type and a category chip to establish hierarchy.

export type ArticleCardData = {
  slug: string;
  category: "WC2026" | "GENERAL";
  title: string;
  lead: string;
  publishedAt: Date | string | null;
};

export function ArticleCard({ article, locale }: { article: ArticleCardData; locale: string }) {
  const isWc = article.category === "WC2026";
  const dateLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <Link
      href={`/blog/${article.slug}`}
      className={[
        "group relative block overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 transition",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,22,40,0.08)]",
        isWc
          ? "border-[var(--color-gold-300)] hover:border-[var(--color-gold-500)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
      ].join(" ")}
    >
      {isWc && (
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold-400)] to-transparent"
          aria-hidden
        />
      )}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isWc
              ? "bg-[var(--color-gold-500)]/15 text-[var(--color-gold-700)]"
              : "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]",
          ].join(" ")}
        >
          {isWc && <Trophy className="h-3 w-3 fill-current" />}
          {isWc ? "World Cup 2026" : "Football"}
        </span>
        {dateLabel && (
          <span className="text-xs text-[var(--color-muted)]">{dateLabel}</span>
        )}
      </div>
      <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold leading-tight text-[var(--color-foreground)] group-hover:text-[var(--color-foreground)]">
        {article.title}
      </h3>
      {article.lead && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">
          {article.lead}
        </p>
      )}
    </Link>
  );
}
