import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ClubApplyForm } from "@/components/club/ClubApplyForm";
import { ChevronLeft } from "lucide-react";

export default async function ClubApplyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?next=/events/${slug}/apply/club`);

  // Caller must be a club. No club → onboarding (with a return-here hint).
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true, name: true },
  });
  if (!club) redirect(`/onboarding/club`);

  const event = await db.event.findUnique({
    where: { slug },
    include: { translations: true, organizer: true },
  });
  if (!event) notFound();

  // Only active teams can apply. Archived teams keep history but are hidden here.
  const teams = await db.clubTeam.findMany({
    where: { clubId: club.id, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, ageGroup: true, format: true },
  });

  const isOwn = event.organizer.userId === session.user.id;
  const en =
    event.translations.find((tr) => tr.locale === locale) ??
    event.translations.find((tr) => tr.locale === "en");
  const eventTitle = en?.title ?? slug;

  const tApply = await getTranslations("apply");
  const tClub = await getTranslations("club");

  return (
    <Container className="py-10">
      <Link
        href={`/events/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
      >
        <ChevronLeft className="h-4 w-4" /> {eventTitle}
      </Link>

      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
          {tClub("clubApplyEyebrow")}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {tApply("title", { eventTitle })}
        </h1>
        <p className="mt-2 text-[var(--color-muted-strong)]">{tClub("clubApplySubtitle", { clubName: club.name })}</p>

        <div className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          {isOwn ? (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tApply("ownEvent")}
            </p>
          ) : !event.acceptsBookings ? (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {tApply("notAccepted")}
            </p>
          ) : (
            <ClubApplyForm
              eventId={event.id}
              eventSlug={event.slug}
              teams={teams}
              defaultEmail={session.user.email ?? ""}
              labels={{
                pickTeam: tClub("clubApplyPickTeam"),
                pickTeamHint: tClub("clubApplyPickTeamHint"),
                partySize: tClub("clubApplyPartySize"),
                partySizeHint: tClub("clubApplyPartySizeHint"),
                contactEmail: tApply("contactEmail"),
                contactPhone: tApply("contactPhone"),
                comment: tApply("comment"),
                commentHint: tClub("clubApplyCommentHint"),
                submit: tClub("clubApplySubmit"),
                submitting: tApply("submitting"),
                successTitle: tClub("clubApplySuccessTitle"),
                successBody: tClub("clubApplySuccessBody"),
                goDashboard: tClub("clubApplyGoApplications"),
                goEvent: tClub("clubApplyGoEvent"),
                noActiveTeams: tClub("clubApplyNoTeams"),
                createTeamCta: tClub("emptyTeamsCta"),
              }}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
