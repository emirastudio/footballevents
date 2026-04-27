import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar as CalIcon, Inbox, Bell, MessageSquare } from "lucide-react";

export default async function OrganizerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { followers: true, events: true } } },
  });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer");
  const tCommon = await getTranslations("common");

  const [
    publishedCount,
    draftCount,
    bookingsTotal,
    bookingsNew,
    recentEvents,
    recentBookings,
  ] = await Promise.all([
    db.event.count({ where: { organizerId: organizer.id, status: "PUBLISHED" } }),
    db.event.count({ where: { organizerId: organizer.id, status: "DRAFT" } }),
    db.booking.count({ where: { event: { organizerId: organizer.id } } }),
    db.booking.count({ where: { event: { organizerId: organizer.id }, status: "NEW" } }),
    db.event.findMany({
      where: { organizerId: organizer.id },
      include: { translations: true, _count: { select: { bookings: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.booking.findMany({
      where: { event: { organizerId: organizer.id } },
      include: { event: { include: { translations: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { icon: CalIcon, label: t("stats.events"),         value: organizer._count.events,     hint: `${publishedCount} ${t("stats.published").toLowerCase()} · ${draftCount} ${t("stats.drafts").toLowerCase()}` },
    { icon: Inbox,   label: t("stats.applications"),   value: bookingsTotal,                hint: bookingsNew > 0 ? `${bookingsNew} ${t("stats.newApplications").toLowerCase()}` : undefined },
    { icon: MessageSquare, label: t("stats.messages"), value: 0,                            hint: undefined },
    { icon: Bell,    label: t("stats.followers"),      value: organizer._count.followers,   hint: undefined },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("dashboard")}</h1>
        <Button variant="accent" asChild>
          <Link href="/organizer/events/new">
            <Plus className="h-4 w-4" /> {t("newEvent")}
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <s.icon className="mb-2 h-5 w-5 text-[var(--color-pitch-600)]" />
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</div>
            <div className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold tabular-nums text-[var(--color-foreground)]">
              {s.value}
            </div>
            {s.hint && <div className="mt-1 text-xs text-[var(--color-muted)]">{s.hint}</div>}
          </div>
        ))}
      </div>

      {/* Two-column: recent events + recent applications */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{t("recentEvents")}</h2>
            <Link href="/organizer/events" className="text-xs font-semibold text-[var(--color-pitch-700)] hover:underline">{t("myEvents")}</Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
              {t("noEventsYet")}
              <div className="mt-3">
                <Button variant="accent" size="sm" asChild>
                  <Link href="/organizer/events/new">{t("createFirstEvent")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {recentEvents.map((e) => {
                const en = e.translations.find((tr) => tr.locale === "en") ?? e.translations[0];
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link href={`/organizer/events/${e.id}`} className="block truncate text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                        {en?.title ?? e.slug}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <StatusBadge status={e.status} t={t} />
                        <span>·</span>
                        <span>{e.startDate?.toISOString().slice(0, 10) ?? "—"}</span>
                        <span>·</span>
                        <span>{e._count.bookings} {tCommon("results")}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{t("recentApplications")}</h2>
            <Link href="/organizer/bookings" className="text-xs font-semibold text-[var(--color-pitch-700)] hover:underline">{t("applications")}</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
              {t("noApplicationsYet")}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {recentBookings.map((b) => {
                const en = b.event.translations.find((tr) => tr.locale === "en") ?? b.event.translations[0];
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{b.participantName}</div>
                      <div className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                        {en?.title ?? b.event.slug} · {b.createdAt.toISOString().slice(0, 10)}
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">
                      {b.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]",
    PENDING_REVIEW: "bg-amber-50 text-amber-700",
    PUBLISHED: "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]",
    ARCHIVED: "bg-[var(--color-bg-muted)] text-[var(--color-muted)]",
    REJECTED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[status] ?? colors.DRAFT}`}>
      {t(`status.${status}`)}
    </span>
  );
}
