import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ClubRfqForm } from "@/components/club/ClubRfqForm";
import { getCountries } from "@/lib/countries";

// Top football-active markets that get chip toggles. Anything outside this set
// can still be requested via the free-text "targetRegion" field below.
const TOP_COUNTRIES = ["DE", "ES", "IT", "FR", "GB", "NL", "PT", "PL", "CZ", "AT", "SE", "BE", "DK", "NO", "CH", "GR", "HR", "RS", "RO", "HU", "EE", "LV", "LT"];

export default async function NewClubRfqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!club) redirect("/onboarding/club");

  const teams = await db.clubTeam.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, ageGroup: true },
  });

  const t = await getTranslations("club");
  const tCat = await getTranslations("categoryHeaders");

  const all = getCountries(locale);
  const countries = TOP_COUNTRIES
    .map((code) => all.find((c) => c.code === code))
    .filter(Boolean)
    .map((c) => ({ code: c!.code, name: c!.name, flag: c!.flag }));

  return (
    <div className="space-y-6">
      <Link
        href="/club/rfqs"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
      >
        <ChevronLeft className="h-3 w-3" /> {t("rfqBackToList")}
      </Link>
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("rfqCreateTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("rfqCreateSubtitle")}</p>
      </header>

      <ClubRfqForm
        countries={countries}
        teams={teams}
        labels={{
          eventType: t("rfqEventType"),
          eventTypeHint: t("rfqEventTypeHint"),
          team: t("rfqTeam"),
          teamHint: t("rfqTeamHint"),
          teamNone: t("rfqTeamNone"),
          audience: t("rfqAudience"),
          ageGroup: t("teamAgeGroup"),
          format: t("teamFormat"),
          skillLevel: t("teamSkillLevel"),
          skillAmateur: t("skillAmateur"),
          skillSemi: t("skillSemi"),
          skillPro: t("skillPro"),
          skillAll: t("skillAll"),
          gender: t("teamGender"),
          genderAny: t("rfqGenderAny"),
          genderMale: t("genderMale"),
          genderFemale: t("genderFemale"),
          genderMixed: t("genderMixed"),
          whereWhen: t("rfqWhereWhen"),
          targetCountries: t("rfqTargetCountries"),
          targetCountriesHint: t("rfqTargetCountriesHint"),
          targetRegion: t("rfqTargetRegion"),
          targetRegionHint: t("rfqTargetRegionHint"),
          dateFrom: t("rfqDateFrom"),
          dateTo: t("rfqDateTo"),
          durationDays: t("rfqDurationDays"),
          durationDaysHint: t("rfqDurationDaysHint"),
          budget: t("rfqBudget"),
          budgetAmount: t("rfqBudgetAmount"),
          budgetAmountHint: t("rfqBudgetAmountHint"),
          currency: t("rfqCurrency"),
          details: t("rfqDetails"),
          comment: t("teamNotes"),
          commentHint: t("rfqCommentHint"),
          submit: t("rfqSubmit"),
          submitting: t("loading"),
          eventTypes: {
            TOURNAMENT: tCat("tournaments.title"),
            CAMP: tCat("camps.title"),
            FESTIVAL: tCat("festivals.title"),
            MASTERCLASS: tCat("masterclasses.title"),
            MATCH_TOUR: tCat("match-tours.title"),
            CLINIC: t("rfqTypeClinic"),
            SHOWCASE: tCat("showcases.title"),
            TRAINING_CAMP: tCat("training-camps.title"),
            TRYOUT: tCat("tryouts.title"),
          },
        }}
      />
    </div>
  );
}
