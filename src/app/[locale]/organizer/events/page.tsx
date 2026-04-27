import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, ExternalLink } from "lucide-react";

export default async function OrganizerEventsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer");
  const tCommon = await getTranslations("common");

  const STATUSES = ["ALL", "DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
  const activeStatus = (sp.status?.toUpperCase() ?? "ALL") as (typeof STATUSES)[number];

  const events = await db.event.findMany({
    where: {
      organizerId: organizer.id,
      ...(activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
    },
    include: {
      translations: true,
      _count: { select: { bookings: true, divisions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("myEvents")}</h1>
        <Button variant="accent" asChild>
          <Link href="/organizer/events/new">
            <Plus className="h-4 w-4" /> {t("newEvent")}
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const isActive = activeStatus === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/organizer/events" : `/organizer/events?status=${s.toLowerCase()}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
              }`}
            >
              {s === "ALL" ? "All" : t(`status.${s}`)}
            </Link>
          );
        })}
      </div>

      {events.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">{t("noEventsYet")}</p>
          <div className="mt-4">
            <Button variant="accent" asChild>
              <Link href="/organizer/events/new">{t("createFirstEvent")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <ul className="divide-y divide-[var(--color-border)]">
            {events.map((e) => {
              const en = e.translations.find((tr) => tr.locale === "en") ?? e.translations[0];
              return (
                <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">{en?.title ?? e.slug}</span>
                      <StatusBadge status={e.status} t={t} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                      <span>{e.startDate?.toISOString().slice(0, 10) ?? "—"} → {e.endDate?.toISOString().slice(0, 10) ?? "—"}</span>
                      {e._count.divisions > 0 && <span>{e._count.divisions} divisions</span>}
                      <span>{e._count.bookings} {tCommon("results")}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {e.status === "PUBLISHED" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/events/${e.slug}`}>
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/organizer/events/${e.id}`}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
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
