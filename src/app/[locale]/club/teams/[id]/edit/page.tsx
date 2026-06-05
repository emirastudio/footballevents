import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ClubTeamForm } from "@/components/club/ClubTeamForm";
import { teamFormLabels } from "../../new/page";

export default async function EditClubTeamPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!club) redirect("/onboarding/club");

  // Ownership check — never trust the URL :id alone.
  const team = await db.clubTeam.findFirst({
    where: { id, clubId: club.id },
    select: {
      id: true, name: true, ageGroup: true, gender: true, format: true,
      skillLevel: true, birthYearFrom: true, birthYearTo: true, notes: true,
    },
  });
  if (!team) notFound();

  const t = await getTranslations("club");

  return (
    <div className="space-y-6">
      <Link href="/club/teams" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-3 w-3" /> {t("backToTeams")}
      </Link>
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {team.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("teamEditSubtitle")}</p>
      </header>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <ClubTeamForm
          mode="edit"
          teamId={team.id}
          defaults={{
            name: team.name,
            ageGroup: team.ageGroup,
            gender: team.gender,
            format: team.format ?? "",
            skillLevel: team.skillLevel,
            birthYearFrom: team.birthYearFrom ? String(team.birthYearFrom) : "",
            birthYearTo: team.birthYearTo ? String(team.birthYearTo) : "",
            notes: team.notes ?? "",
          }}
          labels={teamFormLabels(t)}
        />
      </div>
    </div>
  );
}
