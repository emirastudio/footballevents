import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Inbox, Calendar, MapPin } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  NEW:       "bg-amber-100 text-amber-800",
  ACCEPTED:  "bg-emerald-100 text-emerald-800",
  DECLINED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-zinc-100 text-zinc-700",
  COMPLETED: "bg-sky-100 text-sky-800",
  WAITLIST:  "bg-violet-100 text-violet-800",
};

export default async function ClubApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!club) redirect("/onboarding/club");

  // All bookings the club has ever submitted, newest first. Pagination not
  // needed at MVP volume — when it crosses ~100, add cursor pagination here.
  const bookings = await db.booking.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      createdAt: true,
      partySize: true,
      teamName: true,
      respondedAt: true,
      event: {
        select: {
          slug: true,
          startDate: true,
          endDate: true,
          countryCode: true,
          city: { select: { nameEn: true } },
          translations: { select: { locale: true, title: true } },
        },
      },
      clubTeam: { select: { id: true, name: true, ageGroup: true } },
    },
  });

  const t = await getTranslations("club");
  const pickTitle = (trs: { locale: string; title: string }[], slug: string) =>
    trs.find((tr) => tr.locale === locale)?.title ??
    trs.find((tr) => tr.locale === "en")?.title ??
    slug;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("navApplications")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("applicationsSubtitle")}</p>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("applicationsEmptyTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("applicationsEmptyBody")}</p>
          <Link
            href="/events"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
          >
            {t("browseEvents")}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {bookings.map((b) => {
            const title = pickTitle(b.event.translations, b.event.slug);
            const city = b.event.city?.nameEn;
            return (
              <li key={b.id}>
                <Link
                  href={`/events/${b.event.slug}`}
                  className="block px-4 py-3 transition hover:bg-[var(--color-surface-muted)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted-strong)]">
                        {b.clubTeam?.name ?? "—"}
                        {b.clubTeam?.ageGroup && <> · {b.clubTeam.ageGroup}</>}
                        {" · "}
                        {t("applicationsPartySize", { n: b.partySize })}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                        {b.event.startDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(b.event.startDate).toLocaleDateString(locale)}
                          </span>
                        )}
                        {(city || b.event.countryCode) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[city, b.event.countryCode].filter(Boolean).join(", ")}
                          </span>
                        )}
                        <span>·</span>
                        <span>{t("applicationsSubmittedAt", { date: new Date(b.createdAt).toLocaleDateString(locale) })}</span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLE[b.status] ?? "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {t(`applicationStatus.${b.status}` as never)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
