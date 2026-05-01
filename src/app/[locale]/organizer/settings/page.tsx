import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountries } from "@/lib/countries";
import { OrganizerSettingsForm } from "@/components/organizer/OrganizerSettingsForm";

export default async function OrganizerSettingsPage({
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
    include: { translations: true },
  });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer");
  const tCat = await getTranslations("categoryHeaders");

  const activityOptions = [
    { value: "TOURNAMENT",    label: tCat("tournaments.title") },
    { value: "CAMP",          label: tCat("camps.title") },
    { value: "FESTIVAL",      label: tCat("festivals.title") },
    { value: "MASTERCLASS",   label: tCat("masterclasses.title") },
    { value: "MATCH_TOUR",    label: tCat("match-tours.title") },
    { value: "SHOWCASE",      label: tCat("showcases.title") },
    { value: "TRAINING_CAMP", label: tCat("training-camps.title") },
    { value: "TRYOUT",        label: tCat("tryouts.title") },
  ];

  const organizerData = {
    name:             organizer.name,
    legalName:        organizer.legalName,
    email:            organizer.email,
    phone:            organizer.phone,
    website:          organizer.website,
    countryCode:      organizer.countryCode,
    city:             organizer.city,
    activityTypes:    organizer.activityTypes as string[],
    logoUrl:          organizer.logoUrl,
    coverUrl:         organizer.coverUrl,
    instagramUrl:     organizer.instagramUrl,
    facebookUrl:      organizer.facebookUrl,
    xUrl:             organizer.xUrl,
    tiktokUrl:        organizer.tiktokUrl,
    youtubeUrl:       organizer.youtubeUrl,
    whatsappUrl:      organizer.whatsappUrl,
    subscriptionTier: organizer.subscriptionTier,
    subscriptionEndsAt: organizer.subscriptionEndsAt?.toISOString() ?? null,
    stripeCustomerId: organizer.stripeCustomerId,
    translations: organizer.translations.map((tr) => ({
      locale:  tr.locale,
      tagline: tr.tagline,
      about:   tr.about,
    })),
  };

  return (
    <div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        {t("settings")}
      </h1>
      <div className="mt-6">
        <OrganizerSettingsForm
          organizer={organizerData}
          countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
          activityOptions={activityOptions}
          locale={locale}
          labels={{
            settingsProfile:    t("settingsProfile"),
            settingsContent:    t("settingsContent"),
            settingsImages:     t("settingsImages"),
            settingsSocial:     t("settingsSocial"),
            settingsBilling:    t("settingsBilling"),
            settingsSaved:      t("settingsSaved"),
            settingsSaveError:  t("settingsSaveError"),
            settingsSave:       t("settingsSave"),
            settingsSaving:     t("settingsSaving"),
            name:               t("name"),
            nameHint:           t("nameHint"),
            legalName:          t("legalName"),
            legalNameHint:      t("legalNameHint"),
            email:              t("email"),
            phone:              t("phone"),
            website:            t("website"),
            country:            t("country"),
            city:               t("city"),
            activityTypes:      t("activityTypes"),
            activityTypesHint:  t("activityTypesHint"),
            englishSection:     t("englishSection"),
            englishSectionHint: t("englishSectionHint"),
            secondSection:      t("secondSection"),
            secondSectionHint:  t("secondSectionHint"),
            secondLanguagePicker: t("secondLanguagePicker"),
            taglineEn:          t("taglineEn"),
            aboutEn:            t("aboutEn"),
            taglineSecond:      t("taglineSecond"),
            aboutSecond:        t("aboutSecond"),
            taglineHint:        t("taglineHint"),
            aboutHint:          t("aboutHint"),
            langNone:           t("langNone"),
            langRu:             t("langRu"),
            langDe:             t("langDe"),
            langEs:             t("langEs"),
            logoUrl:            t("logoUrl"),
            coverUrl:           t("coverUrl"),
            socialInstagram:    t("socialInstagram"),
            socialFacebook:     t("socialFacebook"),
            socialX:            t("socialX"),
            socialTikTok:       t("socialTikTok"),
            socialYouTube:      t("socialYouTube"),
            socialWhatsApp:     t("socialWhatsApp"),
            socialUrlPlaceholder: t("socialUrlPlaceholder"),
            tier:               t("tier"),
            currentPlan:        t("currentPlan"),
            planRenews:         t("planRenews"),
            planExpired:        t("planExpired"),
            manageBilling:      t("manageBilling"),
            upgradePlan:        t("upgradePlan"),
          }}
        />
      </div>
    </div>
  );
}
