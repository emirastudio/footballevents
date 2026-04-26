import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { moderateEventAction, grantBoostAction } from "@/app/actions/admin";
import { Check, X, ExternalLink, Rocket } from "lucide-react";

const STATUSES = ["PENDING_REVIEW", "ALL", "PUBLISHED", "DRAFT", "REJECTED", "ARCHIVED"] as const;

export default async function AdminEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("organizer");

  const activeStatus = (sp.status?.toUpperCase() ?? "PENDING_REVIEW") as (typeof STATUSES)[number];

  const events = await db.event.findMany({
    where: activeStatus === "ALL" ? {} : { status: activeStatus as never },
    include: { translations: true, organizer: true, _count: { select: { bookings: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">Events queue</h1>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const isActive = activeStatus === s;
          const count = s === "ALL" ? null : null;
          return (
            <Link
              key={s}
              href={`/admin/events?status=${s.toLowerCase()}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
              }`}
            >
              {s === "ALL" ? "All" : t(`status.${s}`)}{count !== null && ` (${count})`}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          Nothing to review.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const en = e.translations.find((tr) => tr.locale === "en") ?? e.translations[0];
            return (
              <li key={e.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{en?.title ?? e.slug}</span>
                      <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">
                        {t(`status.${e.status}`)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-foreground)]">{e.organizer.name}</span> · {e.organizer.subscriptionTier} · {e.startDate.toISOString().slice(0, 10)} → {e.endDate.toISOString().slice(0, 10)} · {e.countryCode} · {e._count.bookings} bookings
                    </div>
                    {en?.shortDescription && <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{en.shortDescription}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/events/${e.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-300)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Preview
                    </Link>
                    {e.status === "PUBLISHED" && (
                      <form action={grantBoostAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="eventId" value={e.id} />
                        <select
                          name="kind"
                          defaultValue="featured"
                          className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                        >
                          <option value="basic">Basic (7d)</option>
                          <option value="featured">Featured (14d)</option>
                          <option value="premium">Premium (7d)</option>
                          <option value="bundle31">Bundle 3+1 (7d)</option>
                          <option value="bundle52">Bundle 5+2 (7d)</option>
                        </select>
                        <input
                          type="number"
                          name="days"
                          min={1}
                          placeholder="days"
                          className="w-16 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                        >
                          <Rocket className="h-3.5 w-3.5" /> Boost
                        </button>
                      </form>
                    )}
                    {e.status === "PENDING_REVIEW" && (
                      <>
                        <form action={moderateEventAction}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-pitch-600)]">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                        </form>
                        <form action={moderateEventAction}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
