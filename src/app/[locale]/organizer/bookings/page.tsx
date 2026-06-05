import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireOrgPage, allowedEventIdsForUser } from "@/lib/organizer-access";
import { Inbox, Calendar, MapPin, ChevronRight, Users } from "lucide-react";

// Per-event picker. Each event has its own applications table — we don't mix
// them across events on purpose. Click a card → /organizer/events/[id]/applications.
export default async function BookingsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await requireOrgPage(session.user.id, "bookings");
  const { organizer } = access;
  const eventScope = await allowedEventIdsForUser(access, session.user.id);

  // Pull every event in scope WITH its NEW + total booking counts and a
  // hint of recency. Single query covers everything the picker shows.
  const events = await db.event.findMany({
    where: {
      organizerId: organizer.id,
      ...(eventScope === "all" ? {} : { id: { in: eventScope } }),
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, slug: true,
      status: true,
      startDate: true, endDate: true,
      countryCode: true,
      coverUrl: true,
      logoUrl: true,
      translations: { select: { locale: true, title: true } },
      city: { select: { nameEn: true } },
      _count: { select: { bookings: true } },
    },
  });

  // NEW counts — one aggregate query, no N+1.
  const newCounts = await db.booking.groupBy({
    by: ["eventId"],
    where: {
      event: { organizerId: organizer.id, ...(eventScope === "all" ? {} : { id: { in: eventScope } }) },
      status: "NEW",
      visibleToOrganizer: true,
    },
    _count: { _all: true },
  });
  const newByEvent = new Map(newCounts.map((c) => [c.eventId, c._count._all]));

  const t = await getTranslations("bookingsHub");
  const tOrg = await getTranslations("organizer");

  const pickTitle = (trs: { locale: string; title: string }[], slug: string) =>
    trs.find((tr) => tr.locale === locale)?.title ??
    trs.find((tr) => tr.locale === "en")?.title ??
    slug;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {tOrg("applications")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("subtitle")}</p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => {
            const title = pickTitle(e.translations, e.slug);
            const newN = newByEvent.get(e.id) ?? 0;
            const totalN = e._count.bookings;
            const date = e.startDate ? new Date(e.startDate).toLocaleDateString(locale) : null;
            const city = e.city?.nameEn;
            return (
              <li key={e.id}>
                <Link
                  href={`/organizer/events/${e.id}/applications`}
                  className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-sm)]"
                >
                  <div
                    className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-bg-muted)]"
                    style={e.coverUrl ? { backgroundImage: `url(${e.coverUrl})` } : e.logoUrl ? { backgroundImage: `url(${e.logoUrl})` } : undefined}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{title}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                      {date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>}
                      {(city || e.countryCode) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[city, e.countryCode].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t("totalCount", { n: totalN })}
                      </span>
                    </p>
                  </div>
                  {newN > 0 && (
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">
                      {newN}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
