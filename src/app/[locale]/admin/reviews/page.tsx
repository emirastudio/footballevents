import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { moderateReviewAction } from "@/app/actions/admin";
import { Check, X, ExternalLink, Star } from "lucide-react";

const STATUS_ORDER = { PENDING: 0, APPROVED: 1, REJECTED: 2, FLAGGED: 0 } as const;

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reviews = await db.review.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: {
      author: { select: { name: true, email: true } },
      event: {
        select: {
          slug: true,
          translations: { select: { locale: true, title: true } },
        },
      },
    },
  });

  reviews.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        Reviews
      </h1>

      {reviews.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          No reviews.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const en =
              r.event.translations.find((t) => t.locale === "en") ??
              r.event.translations[0];
            return (
              <li
                key={r.id}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">
                        {r.status}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {r.rating}/5
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        by {r.author.name ?? r.author.email}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        · {r.createdAt.toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      <Link
                        href={`/events/${r.event.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--color-pitch-700)] hover:underline"
                      >
                        {en?.title ?? r.event.slug} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    {r.title && (
                      <div className="mt-2 font-semibold text-[var(--color-foreground)]">
                        {r.title}
                      </div>
                    )}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-muted-strong)]">
                      {r.body}
                    </p>
                  </div>
                  {(r.status === "PENDING" || r.status === "FLAGGED" || r.status === "REJECTED") && (
                    <div className="flex flex-wrap gap-2">
                      <form action={moderateReviewAction}>
                        <input type="hidden" name="reviewId" value={r.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-pitch-600)]"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      </form>
                      {r.status !== "REJECTED" && (
                        <form action={moderateReviewAction}>
                          <input type="hidden" name="reviewId" value={r.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                  {r.status === "APPROVED" && (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="reviewId" value={r.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
