import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { moderateArticleAction } from "@/app/actions/admin";
import { Check, X, ExternalLink, Trophy } from "lucide-react";

// Draft queue for the AI news pipeline. WC2026 articles auto-publish on
// ingest; GENERAL articles land here for a human read before they hit /blog.
// Layout mirrors /admin/reviews so the visual + action pattern is consistent.

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Sort so DRAFTs surface first; show recent decisions below for traceability.
  const articles = await db.article.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      source: { select: { publisher: true, url: true } },
      translations: {
        where: { locale: "en" },
        select: { title: true, lead: true, metaDescription: true },
      },
    },
  });
  const drafts    = articles.filter((a) => a.status === "DRAFT");
  const recent    = articles.filter((a) => a.status !== "DRAFT").slice(0, 20);

  return (
    <div>
      <h1 className="mb-2 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        News drafts
      </h1>
      <p className="mb-6 text-sm text-[var(--color-muted-strong)]">
        AI-rewritten football news awaiting review. WC2026 articles publish
        automatically — only general football pieces land here.
      </p>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        Pending ({drafts.length})
      </h2>
      {drafts.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          Inbox zero. Next batch lands at 06:00 UTC.
        </p>
      ) : (
        <ul className="space-y-3">
          {drafts.map((a) => {
            const tr = a.translations[0];
            return (
              <li
                key={a.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">
                        {a.category}
                      </span>
                      {a.category === "WC2026" && (
                        <Trophy className="h-3.5 w-3.5 text-[var(--color-gold-600)]" />
                      )}
                      <span className="text-xs text-[var(--color-muted)]">
                        {a.createdAt.toISOString().slice(0, 10)}
                      </span>
                      {a.source && (
                        <a
                          href={a.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--color-pitch-700)] hover:underline"
                        >
                          source: {a.source.publisher.replace(/^newsapi:/, "")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-semibold text-[var(--color-foreground)]">
                      {tr?.title ?? a.slug}
                    </h3>
                    {tr?.lead && (
                      <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{tr.lead}</p>
                    )}
                    {a.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {a.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] text-[var(--color-muted-strong)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/blog/${a.slug}`}
                      className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-[var(--color-border-strong)]"
                    >
                      Preview
                    </Link>
                    <form action={moderateArticleAction}>
                      <input type="hidden" name="articleId" value={a.id} />
                      <input type="hidden" name="decision"  value="approve" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-pitch-600)]"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve & publish
                      </button>
                    </form>
                    <form action={moderateArticleAction}>
                      <input type="hidden" name="articleId" value={a.id} />
                      <input type="hidden" name="decision"  value="reject" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Recent decisions
          </h2>
          <ul className="space-y-2">
            {recent.map((a) => {
              const tr = a.translations[0];
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        a.status === "PUBLISHED"
                          ? "bg-[var(--color-pitch-500)]/15 text-[var(--color-pitch-700)]"
                          : "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]",
                      ].join(" ")}
                    >
                      {a.status}
                    </span>
                    <span className="truncate text-[var(--color-foreground)]">{tr?.title ?? a.slug}</span>
                  </div>
                  {a.status === "PUBLISHED" && (
                    <Link href={`/blog/${a.slug}`} className="shrink-0 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline">
                      View →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
