import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { updateBugReportAction } from "@/app/actions/adminBugReport";
import { ChevronLeft, AlertCircle, Camera, Globe, User, ExternalLink } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  OPEN:       "bg-amber-100 text-amber-800",
  IN_REVIEW:  "bg-sky-100 text-sky-800",
  RESOLVED:   "bg-emerald-100 text-emerald-800",
  WONT_FIX:   "bg-zinc-100 text-zinc-700",
};

export default async function AdminBugReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const report = await db.bugReport.findUnique({
    where: { id },
    include: { reporter: { select: { name: true, email: true, image: true } } },
  });
  if (!report) notFound();

  const consoleErrors = Array.isArray(report.consoleErrors)
    ? (report.consoleErrors as { ts: number; level: string; message: string }[])
    : [];

  return (
    <div className="space-y-4">
      <Link
        href="/admin/bug-reports"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
      >
        <ChevronLeft className="h-3 w-3" /> Back to list
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            {report.category.replace("_", " ")} — {report.id.slice(-8)}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Filed {report.createdAt.toISOString().slice(0, 16).replace("T", " ")}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_STYLE[report.status]}`}>
          {report.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        {/* Left column — content */}
        <div className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Message
            </p>
            <p className="whitespace-pre-wrap text-sm text-[var(--color-foreground)]">{report.message}</p>
          </section>

          {report.screenshotData && (
            <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <Camera className="h-3 w-3" /> Screenshot
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.screenshotData}
                alt="Reporter screenshot"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)]"
              />
            </section>
          )}

          {consoleErrors.length > 0 && (
            <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                <AlertCircle className="h-3 w-3" /> Console errors ({consoleErrors.length})
              </p>
              <ul className="space-y-1 text-xs font-mono text-amber-900">
                {consoleErrors.map((e, i) => (
                  <li key={i} className="rounded bg-white/60 px-2 py-1">
                    <span className="mr-2 font-bold uppercase">[{e.level}]</span>
                    {e.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right column — metadata + actions */}
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Reporter
            </p>
            {report.reporter ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center bg-[var(--color-bg-muted)]"
                  style={report.reporter.image ? { backgroundImage: `url(${report.reporter.image})` } : undefined}
                />
                <div className="min-w-0 text-sm">
                  <div className="truncate font-semibold text-[var(--color-foreground)]">
                    {report.reporter.name ?? "—"}
                  </div>
                  <a
                    href={`mailto:${report.reporter.email}`}
                    className="truncate text-xs text-[var(--color-muted-strong)] hover:underline"
                  >
                    {report.reporter.email}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-strong)]">
                <User className="h-4 w-4 text-[var(--color-muted)]" />
                {report.reporterEmail ? (
                  <a href={`mailto:${report.reporterEmail}`} className="hover:underline">
                    {report.reporterEmail}
                  </a>
                ) : (
                  "Anonymous"
                )}
              </div>
            )}
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Context
            </p>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-[var(--color-muted)]">Page</dt>
                <dd>
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all text-[var(--color-pitch-700)] hover:underline"
                  >
                    {report.url}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-muted)]">Locale</dt>
                <dd className="inline-flex items-center gap-1 text-[var(--color-foreground)]">
                  <Globe className="h-3 w-3 text-[var(--color-muted)]" /> {report.locale}
                </dd>
              </div>
              {report.userAgent && (
                <div>
                  <dt className="text-[var(--color-muted)]">User-Agent</dt>
                  <dd className="break-all font-mono text-[10px] text-[var(--color-muted-strong)]">{report.userAgent}</dd>
                </div>
              )}
              {report.sentryEventId && (
                <div>
                  <dt className="text-[var(--color-muted)]">Sentry event</dt>
                  <dd className="font-mono text-[10px] text-[var(--color-foreground)]">{report.sentryEventId}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Triage
            </p>
            <form action={updateBugReportAction} className="space-y-2">
              <input type="hidden" name="id" value={report.id} />
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={report.status}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)]"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="WONT_FIX">Won&apos;t fix</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Admin note
                </span>
                <textarea
                  name="adminNote"
                  rows={3}
                  defaultValue={report.adminNote ?? ""}
                  placeholder="Internal — what's the plan?"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)]"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-pitch-700)]"
              >
                Save
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
