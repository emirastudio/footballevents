import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { getCountries } from "@/lib/countries";
import { VenueForm } from "@/components/organizer/VenueForm";
import { buildVenueLabels } from "../_labels";

export default async function EditVenuePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const venue = await db.venue.findUnique({
    where: { id },
    include: { events: { where: { organizerId: organizer.id }, take: 1 } },
  });
  if (!venue || venue.events.length === 0) notFound();

  const t = await getTranslations("organizer.venuesPage");
  const tForm = await getTranslations("venueForm");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/organizer/venues" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted-strong)] hover:text-[var(--color-pitch-700)]">
        <ChevronLeft className="h-4 w-4" /> {t("backToList")}
      </Link>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{venue.name}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("editSubtitle")}</p>

      <div className="mt-6 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <VenueForm
          countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
          defaults={{
            id: venue.id,
            name: venue.name,
            countryCode: venue.countryCode,
            address: venue.address ?? undefined,
            capacity: venue.capacity ?? undefined,
            surfaceType: venue.surfaceType ?? undefined,
            website: venue.website ?? undefined,
            isStadium: venue.isStadium,
          }}
          labels={buildVenueLabels(tForm)}
        />
      </div>
    </div>
  );
}
