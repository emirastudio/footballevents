import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountries } from "@/lib/countries";
import { EventForm } from "@/components/organizer/EventForm";
import type { Tier } from "@/lib/tier";

export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("eventForm");

  // Categories with localized name
  const categories = await db.category.findMany({
    include: { translations: true },
    orderBy: { order: "asc" },
  });
  const cats = categories.map((c) => {
    const tr = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "en");
    return { id: c.id, slug: c.slug, name: tr?.name ?? c.slug };
  });

  const labels = {
    newTitle: t("newTitle"), newSubtitle: t("newSubtitle"),
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
    englishSection: t("englishSection"), englishSectionHint: t("englishSectionHint"),
    secondSection: t("secondSection"), secondSectionHint: t("secondSectionHint"),
    secondLanguagePicker: t("secondLanguagePicker"),
    langRu: t("langRu"), langDe: t("langDe"), langEs: t("langEs"), langNone: t("langNone"),
    titleEn: t("titleEn"), titleEnHint: t("titleEnHint"),
    shortDescEn: t("shortDescEn"), shortDescEnHint: t("shortDescEnHint"),
    descriptionEn: t("descriptionEn"), descriptionEnHint: t("descriptionEnHint"),
    titleSecond: t("titleSecond"), shortDescSecond: t("shortDescSecond"), descriptionSecond: t("descriptionSecond"),
    startDate: t("startDate"), endDate: t("endDate"), registrationDeadline: t("registrationDeadline"), timezone: t("timezone"),
    country: t("country"), city: t("city"),
    venueName: t("venueName"), venueNameHint: t("venueNameHint"),
    venueAddress: t("venueAddress"), venueAddressHint: t("venueAddressHint"),
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
      venueNameRequired: t("errors.venueNameRequired"),
    },
  };

  const defaultSecondLocale = locale === "ru" || locale === "de" || locale === "es" ? locale : "";

  return (
    <EventForm
      tier={organizer.subscriptionTier as Tier}
      categories={cats}
      countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
      labels={labels}
      defaults={{ secondLocale: defaultSecondLocale }}
    />
  );
}
