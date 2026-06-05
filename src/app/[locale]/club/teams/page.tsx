import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Plus, Users, Pencil } from "lucide-react";
import { ClubTeamArchiveButton } from "@/components/club/ClubTeamArchiveButton";

export default async function ClubTeamsPage({
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

  const teams = await db.clubTeam.findMany({
    where: { clubId: club.id },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, ageGroup: true, gender: true, format: true,
      skillLevel: true, birthYearFrom: true, birthYearTo: true, isActive: true,
      _count: { select: { bookings: true } },
    },
  });

  const t = await getTranslations("club");

  // Localized enum labels — lookup map so we read once per render.
  const GENDER_L: Record<string, string> = {
    MALE: t("genderMale"), FEMALE: t("genderFemale"), MIXED: t("genderMixed"),
  };
  const LEVEL_L: Record<string, string> = {
    AMATEUR: t("skillAmateur"), SEMI_PRO: t("skillSemi"),
    PROFESSIONAL: t("skillPro"), ALL_LEVELS: t("skillAll"),
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            {t("teamsTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("teamsSubtitle")}</p>
        </div>
        <Link
          href="/club/teams/new"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
        >
          <Plus className="h-4 w-4" /> {t("teamsCreate")}
        </Link>
      </header>

      {teams.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("emptyTeamsTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("emptyTeamsBody")}</p>
          <Link
            href="/club/teams/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
          >
            <Plus className="h-4 w-4" /> {t("emptyTeamsCta")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => (
            <article
              key={team.id}
              className={`rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition ${
                team.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-[var(--color-foreground)]">{team.name}</h2>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-strong)]">
                    {team.ageGroup}
                    {team.format && <> · {team.format}</>}
                    {" · "}
                    {GENDER_L[team.gender] ?? team.gender}
                  </p>
                  {(team.birthYearFrom || team.birthYearTo) && (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {team.birthYearFrom ?? "?"}–{team.birthYearTo ?? "?"}
                    </p>
                  )}
                </div>
                {!team.isActive && (
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                    {t("teamArchived")}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {LEVEL_L[team.skillLevel] ?? team.skillLevel}
                {" · "}
                {t("teamApplicationsCount", { count: team._count.bookings })}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                <Link
                  href={`/club/teams/${team.id}/edit`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline"
                >
                  <Pencil className="h-3 w-3" /> {t("teamEdit")}
                </Link>
                <ClubTeamArchiveButton
                  teamId={team.id}
                  active={team.isActive}
                  archiveLabel={t("teamArchive")}
                  restoreLabel={t("teamRestore")}
                  confirmText={t("teamArchiveConfirm")}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
