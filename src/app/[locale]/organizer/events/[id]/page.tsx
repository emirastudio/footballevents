import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountries } from "@/lib/countries";
import { EventForm, type EventDefaults } from "@/components/organizer/EventForm";
import type { Tier } from "@/lib/tier";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Trash2, Archive, ExternalLink } from "lucide-react";
import { deleteEventAction, archiveEventAction } from "@/app/actions/event";
import { startBoostCheckout } from "@/app/actions/billing";
import { Rocket } from "lucide-react";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const ev = await db.event.findUnique({
    where: { id },
    include: { translations: true, category: true },
  });
  if (!ev || ev.organizerId !== organizer.id) notFound();

  const t = await getTranslations("eventForm");
  const tCommon = await getTranslations("common");
  const tOrg = await getTranslations("organizer");

  const categories = await db.category.findMany({ include: { translations: true }, orderBy: { order: "asc" } });
  const cats = categories.map((c) => {
    const tr = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "en");
    return { id: c.id, slug: c.slug, name: tr?.name ?? c.slug };
  });

  const en = ev.translations.find((tr) => tr.locale === "en") ?? ev.translations[0];

  const programmeText = (ev.program as { day: number; title: string; items: string[] }[] | null)
    ?.map((d) => [d.title, ...d.items].join("\n"))
    .join("\n\n") ?? "";
  const faqText = (ev.faq as { q: string; a: string }[] | null)
    ?.map((p) => `Q: ${p.q}\nA: ${p.a}`)
    .join("\n\n") ?? "";

  const defaults: EventDefaults = {
    id: ev.id,
    categoryId: ev.categoryId,
    titleEn: en?.title ?? "",
    shortDescEn: en?.shortDescription ?? "",
    descriptionEn: en?.description ?? "",
    startDate: ev.startDate.toISOString().slice(0, 10),
    endDate: ev.endDate.toISOString().slice(0, 10),
    registrationDeadline: ev.registrationDeadline?.toISOString().slice(0, 10),
    countryCode: ev.countryCode,
    customLocation: ev.customLocation ?? undefined,
    ageGroups: ev.ageGroups as unknown as string[],
    gender: ev.gender,
    skillLevel: ev.skillLevel,
    format: ev.format ?? undefined,
    maxParticipants: ev.maxParticipants ?? undefined,
    isFree: ev.isFree,
    priceFrom: ev.priceFrom ? Number(ev.priceFrom) : undefined,
    priceTo: ev.priceTo ? Number(ev.priceTo) : undefined,
    currency: ev.currency,
    externalUrl: ev.externalUrl ?? undefined,
    contactEmail: ev.contactEmail ?? undefined,
    contactPhone: ev.contactPhone ?? undefined,
    acceptsBookings: ev.acceptsBookings,
    videoUrl: ev.videoUrl ?? undefined,
    logoUrl: ev.logoUrl ?? undefined,
    coverUrl: ev.coverUrl ?? undefined,
    included: ev.included.join("\n"),
    notIncluded: ev.notIncluded.join("\n"),
    programme: programmeText,
    faq: faqText,
  };

  const labels = {
    newTitle: en?.title ?? t("newTitle"),
    newSubtitle: t("newSubtitle"),
    saveDraft: t("saveDraft"), submitReview: t("submitReview"), saving: t("saving"),
    draftHint: t("draftHint"),
    sections: {
      basics: t("sections.basics"), basicsHint: t("sections.basicsHint"),
      schedule: t("sections.schedule"), scheduleHint: t("sections.scheduleHint"),
      location: t("sections.location"), locationHint: t("sections.locationHint"),
      audience: t("sections.audience"), audienceHint: t("sections.audienceHint"),
      pricing: t("sections.pricing"), pricingHint: t("sections.pricingHint"),
      media: t("sections.media"), mediaHint: t("sections.mediaHint"),
      video: t("sections.video"), videoHint: t("sections.videoHint"),
      content: t("sections.content"), contentHint: t("sections.contentHint"),
      booking: t("sections.booking"), bookingHint: t("sections.bookingHint"),
    },
    category: t("category"), categoryHint: t("categoryHint"),
    titleEn: t("titleEn"), titleEnHint: t("titleEnHint"),
    shortDescEn: t("shortDescEn"), shortDescEnHint: t("shortDescEnHint"),
    descriptionEn: t("descriptionEn"), descriptionEnHint: t("descriptionEnHint"),
    startDate: t("startDate"), endDate: t("endDate"), registrationDeadline: t("registrationDeadline"), timezone: t("timezone"),
    country: t("country"), city: t("city"), venue: t("venue"), venueHint: t("venueHint"),
    customLocation: t("customLocation"), customLocationHint: t("customLocationHint"),
    ageGroups: t("ageGroups"), gender: t("gender"), skillLevel: t("skillLevel"),
    format: t("format"), formatHint: t("formatHint"), maxParticipants: t("maxParticipants"),
    isFree: t("isFree"), priceFrom: t("priceFrom"), priceTo: t("priceTo"), currency: t("currency"),
    externalUrl: t("externalUrl"), externalUrlHint: t("externalUrlHint"),
    contactEmail: t("contactEmail"), contactPhone: t("contactPhone"),
    acceptsBookings: t("acceptsBookings"),
    videoUrl: t("videoUrl"), videoUrlHint: t("videoUrlHint"),
    logo: t("logo"), cover: t("cover"),
    gallery: t("gallery"), galleryHint: t("galleryHint"),
    included: t("included"), includedHint: t("includedHint"),
    notIncluded: t("notIncluded"), notIncludedHint: t("notIncludedHint"),
    programme: t("programme"), programmeHint: t("programmeHint"),
    faq: t("faq"), faqHint: t("faqHint"),
    tierLockTitle: t("tierLockTitle"), tierLockBody: t("tierLockBody"), videoLockBody: t("videoLockBody"),
    errors: {
      titleRequired: t("errors.titleRequired"),
      descriptionRequired: t("errors.descriptionRequired"),
      categoryRequired: t("errors.categoryRequired"),
      datesInvalid: t("errors.datesInvalid"),
      countryRequired: t("errors.countryRequired"),
      videoNotAllowed: t("errors.videoNotAllowed"),
      priceRange: t("errors.priceRange"),
    },
  };

  return (
    <div>
      {/* Status & quick actions header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--color-muted)]">Status:</span>
          <span className="rounded-full bg-[var(--color-pitch-50)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
            {tOrg(`status.${ev.status}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ev.status === "PUBLISHED" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/events/${ev.slug}`}>
                <ExternalLink className="h-3.5 w-3.5" /> View public
              </Link>
            </Button>
          )}
          <form action={archiveEventAction}>
            <input type="hidden" name="id" value={ev.id} />
            <Button type="submit" variant="outline" size="sm">
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
          </form>
          <form action={deleteEventAction}>
            <input type="hidden" name="id" value={ev.id} />
            <Button type="submit" variant="outline" size="sm" className="text-red-700 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </form>
        </div>
      </div>

      {ev.status === "PUBLISHED" && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-pitch-50)] to-[var(--color-surface)] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[var(--color-pitch-600)]" />
            <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">Boost this event</h2>
          </div>
          <p className="mb-4 text-sm text-[var(--color-muted-strong)]">One-time visibility upgrade. Pays for itself if it brings even one applicant.</p>
          <div className="flex flex-wrap gap-2">
            {[
              { kind: "basic",    label: "Basic — €9 · 7d" },
              { kind: "featured", label: "Featured — €39 · 14d" },
              { kind: "premium",  label: "Premium — €119 · 7d homepage" },
            ].map((b) => (
              <form key={b.kind} action={startBoostCheckout}>
                <input type="hidden" name="eventId" value={ev.id} />
                <input type="hidden" name="kind" value={b.kind} />
                <button type="submit" className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]">
                  {b.label}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      <EventForm
        tier={organizer.subscriptionTier as Tier}
        categories={cats}
        countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
        labels={labels}
        defaults={defaults}
      />
    </div>
  );
}
