import type { WizardLabels } from "@/components/organizer/EventWizard";

type T = (k: string) => string;

export function buildWizardLabels(t: T, tw: T): WizardLabels {
  return {
    steps: {
      1: tw("steps.1"), 2: tw("steps.2"), 3: tw("steps.3"), 4: tw("steps.4"), 5: tw("steps.5"),
    },
    stepHints: {
      1: tw("stepHints.1"), 2: tw("stepHints.2"), 3: tw("stepHints.3"), 4: tw("stepHints.4"), 5: tw("stepHints.5"),
    },
    prev: tw("prev"), next: tw("next"), publish: tw("publish"),
    saveDraft: tw("saveDraft"), saving: tw("saving"),
    publishingDisabled: tw("publishingDisabled"),
    upgradeForPublish: tw("upgradeForPublish"),
    upgradeCta: tw("upgradeCta"),

    category: t("category"), categoryHint: t("categoryHint"),
    englishSection: t("englishSection"), englishSectionHint: t("englishSectionHint"),
    secondSection: t("secondSection"), secondSectionHint: t("secondSectionHint"),
    secondLanguagePicker: t("secondLanguagePicker"),
    langRu: t("langRu"), langDe: t("langDe"), langEs: t("langEs"), langNone: t("langNone"),
    titleEn: t("titleEn"), titleEnHint: t("titleEnHint"),
    shortDescEn: t("shortDescEn"), shortDescEnHint: t("shortDescEnHint"),
    descriptionEn: t("descriptionEn"), descriptionEnHint: t("descriptionEnHint"),
    titleSecond: t("titleSecond"), shortDescSecond: t("shortDescSecond"), descriptionSecond: t("descriptionSecond"),

    startDate: t("startDate"), endDate: t("endDate"), registrationDeadline: t("registrationDeadline"),
    country: t("country"), city: t("city"),
    venueName: t("venueName"), venueNameHint: t("venueNameHint"),
    venueAddress: t("venueAddress"), venueAddressHint: t("venueAddressHint"),

    ageGroups: t("ageGroups"),
    gender: t("gender"),
    genderMale: tw("genderMale"), genderFemale: tw("genderFemale"), genderMixed: tw("genderMixed"),
    skillLevel: t("skillLevel"),
    skillAll: tw("skillAll"), skillAm: tw("skillAm"), skillSemiPro: tw("skillSemiPro"), skillPro: tw("skillPro"),
    format: t("format"), formatHint: t("formatHint"), maxParticipants: t("maxParticipants"),

    isFree: t("isFree"), priceFrom: t("priceFrom"), priceTo: t("priceTo"), currency: t("currency"),
    externalUrl: t("externalUrl"), externalUrlHint: t("externalUrlHint"),
    contactEmail: t("contactEmail"), contactPhone: t("contactPhone"),
    acceptsBookings: t("acceptsBookings"),

    logo: t("logo"), cover: t("cover"),
    videoUrl: t("videoUrl"), videoUrlHint: t("videoUrlHint"),
    included: t("included"), includedHint: t("includedHint"),
    notIncluded: t("notIncluded"), notIncludedHint: t("notIncludedHint"),
    programme: t("programme"), programmeHint: tw("programmeHint"),
    programmeAddDay: tw("programmeAddDay"),
    programmeRemoveDay: tw("programmeRemoveDay"),
    programmeDayTitle: tw("programmeDayTitle"),
    programmeDayItems: tw("programmeDayItems"),
    programmeAddItem: tw("programmeAddItem"),
    faq: t("faq"), faqHint: tw("faqHint"),
    faqAddQuestion: tw("faqAddQuestion"),
    faqRemoveQuestion: tw("faqRemoveQuestion"),
    faqQuestion: tw("faqQuestion"),
    faqAnswer: tw("faqAnswer"),
    tierLockTitle: t("tierLockTitle"), tierLockBody: t("tierLockBody"), videoLockBody: t("videoLockBody"),

    errors: {
      titleRequired: t("errors.titleRequired"),
      descriptionRequired: t("errors.descriptionRequired"),
      categoryRequired: t("errors.categoryRequired"),
      datesInvalid: t("errors.datesInvalid"),
      datesRequired: tw("errors.datesRequired"),
      countryRequired: t("errors.countryRequired"),
      videoNotAllowed: t("errors.videoNotAllowed"),
      priceRange: t("errors.priceRange"),
      venueNameRequired: t("errors.venueNameRequired"),
    },
  };
}
