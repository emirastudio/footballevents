import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { findCountry } from "@/lib/countries";
import { MapPin, Plus, Pencil, Building2 } from "lucide-react";

export default async function OrganizerVenuesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer.venuesPage");

  // Venues this organizer created OR uses for at least one event.
  const venues = await db.venue.findMany({
    where: {
      OR: [
        { createdByOrganizerId: organizer.id },
        { events: { some: { organizerId: organizer.id } } },
      ],
    },
    include: { _count: { select: { events: { where: { organizerId: organizer.id } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("subtitle")}</p>
        </div>
        <Link
          href="/organizer/venues/new"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-pitch-700)]"
        >
          <Plus className="h-4 w-4" /> {t("addVenue")}
        </Link>
      </header>

      {venues.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-[var(--color-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t("emptyTitle")}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{t("emptyBody")}</p>
          <Link
            href="/organizer/venues/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-pitch-700)]"
          >
            <Plus className="h-4 w-4" /> {t("addVenue")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {venues.map((v) => {
            const country = findCountry(v.countryCode);
            return (
              <li
                key={v.id}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-pitch-300)] sm:flex-row sm:items-center sm:gap-4"
              >
                <div
                  className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] bg-cover bg-center"
                  style={v.coverUrl ? { backgroundImage: `url(${v.coverUrl})` } : undefined}
                  aria-hidden
                >
                  {!v.coverUrl && (
                    <div className="grid h-full w-full place-items-center text-[var(--color-muted)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--color-foreground)]">{v.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {country?.flag} {country?.name ?? v.countryCode}
                    </span>
                    {v.address && <span className="truncate">{v.address}</span>}
                    {v.capacity && <span>{v.capacity.toLocaleString()} {t("capacity")}</span>}
                    <span>{v._count.events} {t("eventsCount")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/stadiums/${v.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)] transition hover:bg-[var(--color-bg-muted)]"
                  >
                    {t("view")}
                  </Link>
                  <Link
                    href={`/organizer/venues/${v.id}`}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
                  >
                    <Pencil className="h-3 w-3" /> {t("edit")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
