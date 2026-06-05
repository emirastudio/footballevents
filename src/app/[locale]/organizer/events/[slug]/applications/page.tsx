import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireEventAccessBySlug } from "@/lib/organizer-access";
import { ApplicationsTable, type ApplicationRow } from "@/components/organizer/applications/ApplicationsTable";
import { EventTeamAccess, type TeamMember } from "@/components/organizer/applications/EventTeamAccess";
import { ChevronLeft } from "lucide-react";

export default async function EventApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // requireEventAccessBySlug applies BOTH org-level perm AND per-event ACL.
  // STAFF without explicit grants still sees the page (back-compat); STAFF
  // with explicit grants gets a 302 to their landing page if the URL slug
  // wasn't on their list.
  const { access, eventId } = await requireEventAccessBySlug(session.user.id, slug, "bookings");

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true, slug: true,
      translations: { select: { locale: true, title: true } },
      startDate: true, endDate: true,
      _count: { select: { bookings: true } },
    },
  });
  if (!event) redirect("/organizer/events");

  const bookings = await db.booking.findMany({
    where: {
      eventId: event.id,
      visibleToOrganizer: true,
    },
    // priority desc keeps Pro-tier clubs at the top once monetization gating turns on.
    orderBy: [{ priority: "desc" }, { status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, status: true, createdAt: true,
      participantName: true, participantAge: true,
      teamName: true, partySize: true,
      contactEmail: true, contactPhone: true,
      comment: true, organizerNote: true,
      club: { select: { slug: true, name: true, logoUrl: true } },
    },
  });

  const rows: ApplicationRow[] = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    participantName: b.participantName,
    participantAge: b.participantAge,
    teamName: b.teamName,
    partySize: b.partySize,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    comment: b.comment,
    organizerNote: b.organizerNote,
    isClub: !!b.club,
    clubSlug: b.club?.slug ?? null,
    clubName: b.club?.name ?? null,
    clubLogo: b.club?.logoUrl ?? null,
  }));

  const t = await getTranslations("applicationsTable");
  const tBookings = await getTranslations("bookings");

  // Per-event team-access management — visible only to the OWNER. STAFF and
  // MANAGER don't have the "team" permission per the PERMS matrix.
  let teamMembers: TeamMember[] = [];
  if (access.role === "OWNER") {
    const rows = await db.organizerMember.findMany({
      where: { organizerId: access.organizer.id },
      include: {
        user: { select: { name: true, email: true } },
        events: { where: { eventId }, select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    teamMembers = rows.map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role as "OWNER" | "MANAGER" | "STAFF",
      hasAccess: m.events.length > 0,
    }));
  }
  const title =
    event.translations.find((tr) => tr.locale === locale)?.title ??
    event.translations.find((tr) => tr.locale === "en")?.title ??
    event.slug;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/organizer/events`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
        >
          <ChevronLeft className="h-3 w-3" /> {t("backToEvents")}
        </Link>
        <h1 className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("title", { event: title })}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">
          {t("subtitle", { n: event._count.bookings })}
        </p>
      </div>

      {access.role === "OWNER" && (
        <EventTeamAccess
          eventId={event.id}
          members={teamMembers}
          labels={{
            title: t("teamTitle"),
            subtitle: t("teamSubtitle"),
            emptyTitle: t("teamEmptyTitle"),
            emptyBody: t("teamEmptyBody"),
            everyoneNoteTitle: t("teamEveryoneNoteTitle"),
            everyoneNoteBody: t("teamEveryoneNoteBody"),
            roleLabels: {
              OWNER: t("teamRoleOwner"),
              MANAGER: t("teamRoleManager"),
              STAFF: t("teamRoleStaff"),
            },
            grant: t("teamGrant"),
            revoke: t("teamRevoke"),
          }}
        />
      )}

      <ApplicationsTable
        rows={rows}
        exportHrefBase={`/api/organizer/bookings/export?eventId=${event.id}`}
        labels={{
          searchPlaceholder: t("searchPlaceholder"),
          exportSelected: t("exportSelected"),
          exportAll: t("exportAll"),
          noResults: t("noResults"),
          colSelect: t("colSelect"),
          colApplicant: t("colApplicant"),
          colTeam: t("colTeam"),
          colContact: t("colContact"),
          colParty: t("colParty"),
          colStatus: t("colStatus"),
          colDate: t("colDate"),
          colActions: t("colActions"),
          accept: tBookings("accept"),
          decline: tBookings("decline"),
          message: t("message"),
          selectedCount: t("selectedCount"),
          bulkAccept: t("bulkAccept"),
          bulkDecline: t("bulkDecline"),
          bulkMessage: t("bulkMessage"),
          clear: t("clear"),
          modalTitle: t("modalTitle"),
          modalSubtitle: t("modalSubtitle"),
          modalSubject: t("modalSubject"),
          modalBody: t("modalBody"),
          modalCancel: t("modalCancel"),
          modalSend: t("modalSend"),
          modalSending: t("modalSending"),
          modalSuccess: t("modalSuccess"),
          modalDeliveredWith: t("modalDeliveredWith"),
          modalDeliveredEmailOnly: t("modalDeliveredEmailOnly"),
          statuses: {
            NEW: tBookings("applicantStatus.NEW"),
            ACCEPTED: tBookings("applicantStatus.ACCEPTED"),
            DECLINED: tBookings("applicantStatus.DECLINED"),
            CANCELLED: tBookings("applicantStatus.CANCELLED"),
            COMPLETED: tBookings("applicantStatus.COMPLETED"),
            WAITLIST: tBookings("applicantStatus.WAITLIST"),
          },
        }}
      />
    </div>
  );
}
