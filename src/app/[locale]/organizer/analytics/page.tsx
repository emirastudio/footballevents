import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BarChart3, Eye, Users, Star, TrendingUp, MailCheck } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: Date | null;
  views: number;
  applications: number;
  accepted: number;
  declined: number;
  waitlist: number;
  reviewsApproved: number;
  ratingAvg: number;
};

function pct(num: number, denom: number): string {
  if (denom === 0) return "—";
  return `${Math.round((num / denom) * 100)}%`;
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!organizer) redirect("/onboarding/organizer");

  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    select: {
      id: true,
      slug: true,
      status: true,
      startDate: true,
      viewsCount: true,
      ratingAvg: true,
      ratingCount: true,
      translations: { select: { locale: true, title: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    take: 200,
  });

  const eventIds = events.map((e) => e.id);
  const bookingsByStatus = eventIds.length === 0
    ? []
    : await db.booking.groupBy({
        by: ["eventId", "status"],
        where: { eventId: { in: eventIds } },
        _count: { _all: true },
      });

  const reviewsByEvent = eventIds.length === 0
    ? []
    : await db.review.groupBy({
        by: ["eventId"],
        where: { eventId: { in: eventIds }, status: "APPROVED" },
        _count: { _all: true },
      });

  const bookingMap = new Map<string, Record<string, number>>();
  for (const b of bookingsByStatus) {
    const m = bookingMap.get(b.eventId) ?? {};
    m[b.status] = b._count._all;
    bookingMap.set(b.eventId, m);
  }
  const reviewsApprovedMap = new Map<string, number>();
  for (const r of reviewsByEvent) reviewsApprovedMap.set(r.eventId, r._count._all);

  const rows: Row[] = events.map((e) => {
    const b = bookingMap.get(e.id) ?? {};
    const tr =
      e.translations.find((x) => x.locale === locale) ??
      e.translations.find((x) => x.locale === "en") ??
      e.translations[0];
    const accepted = b.ACCEPTED ?? 0;
    const declined = b.DECLINED ?? 0;
    const newCount = b.NEW ?? 0;
    const cancelled = b.CANCELLED ?? 0;
    const completed = b.COMPLETED ?? 0;
    const waitlist = b.WAITLIST ?? 0;
    return {
      id: e.id,
      slug: e.slug,
      title: tr?.title ?? e.slug,
      status: e.status,
      startDate: e.startDate,
      views: e.viewsCount,
      applications: accepted + declined + newCount + cancelled + completed + waitlist,
      accepted: accepted + completed,
      declined,
      waitlist,
      reviewsApproved: reviewsApprovedMap.get(e.id) ?? 0,
      ratingAvg: e.ratingAvg,
    };
  });

  // Aggregates
  const totals = rows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      applications: acc.applications + r.applications,
      accepted: acc.accepted + r.accepted,
      reviews: acc.reviews + r.reviewsApproved,
    }),
    { views: 0, applications: 0, accepted: 0, reviews: 0 },
  );

  const t = await getTranslations("organizer.analytics");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-[var(--color-pitch-600)]" />
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--color-muted-strong)]">{t("subtitle")}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI icon={<Eye className="h-4 w-4" />}        label={t("kpi.views")}        value={totals.views} />
        <KPI icon={<Users className="h-4 w-4" />}      label={t("kpi.applications")} value={totals.applications} />
        <KPI icon={<MailCheck className="h-4 w-4" />}  label={t("kpi.accepted")}     value={totals.accepted} sub={pct(totals.accepted, totals.applications) + " " + t("kpi.acceptanceRate")} />
        <KPI icon={<Star className="h-4 w-4" />}       label={t("kpi.reviews")}      value={totals.reviews} />
      </div>

      {/* Per-event table */}
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-muted)]">
          {t("emptyBody")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <Th>{t("col.event")}</Th>
                <Th right>{t("col.views")}</Th>
                <Th right>{t("col.applications")}</Th>
                <Th right>{t("col.acceptance")}</Th>
                <Th right>{t("col.conversion")}</Th>
                <Th right>{t("col.waitlist")}</Th>
                <Th right>{t("col.reviews")}</Th>
                <Th right>{t("col.rating")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-muted)]">
                  <Td>
                    <Link
                      href={`/organizer/events/${r.id}`}
                      className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]"
                    >
                      {r.title}
                    </Link>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      {r.status}
                      {r.startDate ? ` · ${new Date(r.startDate).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </div>
                  </Td>
                  <Td right>{r.views.toLocaleString()}</Td>
                  <Td right>{r.applications}</Td>
                  <Td right>
                    <span className="font-medium">{r.accepted}</span>
                    <span className="text-xs text-[var(--color-muted)]"> · {pct(r.accepted, r.applications)}</span>
                  </Td>
                  <Td right>
                    <span className={r.views > 0 && r.accepted / r.views > 0.05 ? "font-semibold text-[var(--color-pitch-700)]" : ""}>
                      {pct(r.accepted, r.views)}
                    </span>
                  </Td>
                  <Td right>{r.waitlist > 0 ? r.waitlist : "—"}</Td>
                  <Td right>{r.reviewsApproved > 0 ? r.reviewsApproved : "—"}</Td>
                  <Td right>{r.reviewsApproved > 0 ? r.ratingAvg.toFixed(1) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <TrendingUp className="h-3.5 w-3.5" />
        {t("conversionHint")}
      </p>
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        {value.toLocaleString()}
      </div>
      {sub && <div className="text-xs text-[var(--color-muted)]">{sub}</div>}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 ${right ? "text-right" : ""}`}>{children}</th>;
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={`px-4 py-3 ${right ? "text-right" : ""}`}>{children}</td>;
}
