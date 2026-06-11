import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { Bug, AlertCircle, Camera } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  OPEN:       "bg-amber-100 text-amber-800",
  IN_REVIEW:  "bg-sky-100 text-sky-800",
  RESOLVED:   "bg-emerald-100 text-emerald-800",
  WONT_FIX:   "bg-zinc-100 text-zinc-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  BUG: "Bug",
  TRANSLATION: "Translation",
  WRONG_INFO: "Wrong info",
  FORM: "Form / button",
  OTHER: "Other",
};

export default async function AdminBugReportsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const status = (sp.status as "OPEN" | "IN_REVIEW" | "RESOLVED" | "WONT_FIX" | "ALL" | undefined) ?? "OPEN";

  const where = status === "ALL" ? {} : { status };

  const [reports, counts] = await Promise.all([
    db.bugReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { reporter: { select: { name: true, email: true } } },
    }),
    db.bugReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);
  const countByStatus: Record<string, number> = {};
  for (const c of counts) countByStatus[c.status] = c._count._all;

  const tabs: { key: string; label: string }[] = [
    { key: "OPEN", label: `Open (${countByStatus.OPEN ?? 0})` },
    { key: "IN_REVIEW", label: `In review (${countByStatus.IN_REVIEW ?? 0})` },
    { key: "RESOLVED", label: `Resolved (${countByStatus.RESOLVED ?? 0})` },
    { key: "WONT_FIX", label: `Won't fix (${countByStatus.WONT_FIX ?? 0})` },
    { key: "ALL", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          <Bug className="h-5 w-5 text-[var(--color-pitch-600)]" />
          Bug reports
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">
          Reports filed through the floating button. Triage open ones first.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/bug-reports?status=${t.key}`}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              status === t.key
                ? "bg-[var(--color-pitch-600)] text-white"
                : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-left">Category</th>
              <th className="px-3 py-2.5 text-left">Reporter</th>
              <th className="px-3 py-2.5 text-left">Message</th>
              <th className="px-3 py-2.5 text-left">Signals</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-sm text-[var(--color-muted)]">
                  Nothing here.
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const consoleErrCount = Array.isArray(r.consoleErrors)
                  ? (r.consoleErrors as unknown[]).length
                  : 0;
                const reporter =
                  r.reporter?.name ?? r.reporter?.email ?? r.reporterEmail ?? "anonymous";
                return (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-3 text-xs text-[var(--color-muted)] whitespace-nowrap">
                      {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[r.status]}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[var(--color-foreground)] whitespace-nowrap">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--color-muted-strong)] whitespace-nowrap">
                      {reporter}
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--color-foreground)]">
                      <span className="line-clamp-2">{r.message}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        {consoleErrCount > 0 && (
                          <span className="inline-flex items-center gap-1" title={`${consoleErrCount} console errors`}>
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            {consoleErrCount}
                          </span>
                        )}
                        {r.screenshotData && (
                          <Camera className="h-3 w-3 text-[var(--color-pitch-600)]" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/bug-reports/${r.id}`}
                        className="text-xs font-bold text-[var(--color-pitch-700)] hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
