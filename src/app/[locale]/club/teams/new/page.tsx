import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ClubTeamForm } from "@/components/club/ClubTeamForm";

export default async function NewClubTeamPage({
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

  const t = await getTranslations("club");

  return (
    <div className="space-y-6">
      <Link href="/club/teams" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-3 w-3" /> {t("backToTeams")}
      </Link>
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("teamCreateTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("teamCreateSubtitle")}</p>
      </header>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <ClubTeamForm
          mode="create"
          defaults={{
            name: "",
            ageGroup: "",
            gender: "MIXED",
            format: "",
            skillLevel: "ALL_LEVELS",
            birthYearFrom: "",
            birthYearTo: "",
            notes: "",
          }}
          labels={teamFormLabels(t)}
        />
      </div>
    </div>
  );
}

// Single source for the labels object — reused by the edit page to stay consistent.
export function teamFormLabels(t: (k: string) => string) {
  return {
    name: t("teamName"),
    nameHint: t("teamNameHint"),
    ageGroup: t("teamAgeGroup"),
    ageGroupHint: t("teamAgeGroupHint"),
    gender: t("teamGender"),
    format: t("teamFormat"),
    formatHint: t("teamFormatHint"),
    skillLevel: t("teamSkillLevel"),
    skillAmateur: t("skillAmateur"),
    skillSemi: t("skillSemi"),
    skillPro: t("skillPro"),
    skillAll: t("skillAll"),
    genderMale: t("genderMale"),
    genderFemale: t("genderFemale"),
    genderMixed: t("genderMixed"),
    birthYears: t("teamBirthYears"),
    birthYearsHint: t("teamBirthYearsHint"),
    birthYearFromPlaceholder: t("teamBirthYearFromPlaceholder"),
    birthYearToPlaceholder: t("teamBirthYearToPlaceholder"),
    notes: t("teamNotes"),
    notesHint: t("teamNotesHint"),
    submitCreate: t("teamSubmitCreate"),
    submitEdit: t("teamSubmitEdit"),
    loading: t("loading"),
    saved: t("settingsSaved"),
  };
}
