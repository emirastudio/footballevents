import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { quotasFor } from "@/lib/permissions/club";
import { Users, Inbox, Heart, Send, ArrowRight, Plus, Calendar } from "lucide-react";

export default async function ClubDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Layout already gated on club existence — but a direct request to this URL
  // would hit the page before the layout, so re-check here too.
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, slug: true, name: true,
      subscriptionTier: true,
      quotaApplicationsPerMonth: true,
      quotaRfqPerMonth: true,
      quotaFavoritesMax: true,
      quotaTeamsMax: true,
      usage: { select: { applicationsThisMonth: true, rfqThisMonth: true } },
    },
  });
  if (!club) redirect("/onboarding/club");

  const [teamsCount, applicationsCount, favouritesCount, openRfqsCount, recentApplications] =
    await Promise.all([
      db.clubTeam.count({ where: { clubId: club.id, isActive: true } }),
      db.booking.count({ where: { clubId: club.id } }),
      db.eventSave.count({ where: { userId: session.user.id } }),
      db.rfq.count({ where: { clubId: club.id, status: "OPEN" } }),
      db.booking.findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, status: true, createdAt: true,
          event: {
            select: {
              slug: true,
              startDate: true,
              translations: { where: { locale: "en" }, select: { title: true } },
            },
          },
          clubTeam: { select: { name: true } },
        },
      }),
    ]);

  const t = await getTranslations("club");
  const quotas = quotasFor(club, club.usage);

  // Status → badge color. Booking statuses are domain-stable; keep mapping inline.
  const STATUS_STYLE: Record<string, string> = {
    NEW:        "bg-amber-100 text-amber-800",
    ACCEPTED:   "bg-emerald-100 text-emerald-800",
    DECLINED:   "bg-red-100 text-red-700",
    CANCELLED:  "bg-zinc-100 text-zinc-700",
    COMPLETED:  "bg-sky-100 text-sky-800",
    WAITLIST:   "bg-violet-100 text-violet-800",
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          {t("dashboardHello", { name: club.name })}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("dashboardSubtitle")}</p>
      </header>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t("statTeams")} value={teamsCount} href="/club/teams" />
        <StatCard icon={Inbox} label={t("statApplications")} value={applicationsCount} href="/club/applications" />
        <StatCard icon={Send} label={t("statRfqs")} value={openRfqsCount} href="/club/rfqs" />
        <StatCard icon={Heart} label={t("statFavorites")} value={favouritesCount} href="/club/favorites" />
      </div>

      {/* Quotas — only render if at least one limit is set (= we ever expose
          usage progress). Right now all are null so the strip stays hidden. */}
      {(quotas.applications.limit !== null || quotas.rfq.limit !== null) && (
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t("quotaTitle")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {quotas.applications.limit !== null && (
              <QuotaRow
                label={t("quotaApplications")}
                used={quotas.applications.used}
                limit={quotas.applications.limit}
              />
            )}
            {quotas.rfq.limit !== null && (
              <QuotaRow label={t("quotaRfq")} used={quotas.rfq.used} limit={quotas.rfq.limit} />
            )}
          </div>
        </section>
      )}

      {/* Empty state when no teams yet — the prerequisite for applying. */}
      {teamsCount === 0 ? (
        <section className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("emptyTeamsTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("emptyTeamsBody")}</p>
          <Link
            href="/club/teams/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
          >
            <Plus className="h-4 w-4" /> {t("emptyTeamsCta")}
          </Link>
        </section>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("recentApplicationsTitle")}
            </h2>
            <Link
              href="/club/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline"
            >
              {t("seeAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-[var(--color-muted)]" />
              {t("noApplicationsYet")}{" "}
              <Link href="/events" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
                {t("browseEvents")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {recentApplications.map((b) => {
                const title = b.event.translations[0]?.title ?? b.event.slug;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/events/${b.event.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--color-surface-muted)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {b.clubTeam?.name ?? "—"}
                          {b.event.startDate && (
                            <>
                              {" · "}
                              {new Date(b.event.startDate).toLocaleDateString(locale)}
                            </>
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_STYLE[b.status] ?? "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {t(`applicationStatus.${b.status}` as never)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-pitch-300)]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
        <p className="text-xs text-[var(--color-muted-strong)]">{label}</p>
      </div>
    </Link>
  );
}

function QuotaRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--color-foreground)]">{label}</span>
        <span className="text-[var(--color-muted)]">
          {used} / {limit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
        <div
          className="h-full bg-[var(--color-pitch-500)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
