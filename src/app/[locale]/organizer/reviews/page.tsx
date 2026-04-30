import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { ReviewModerationCard } from "@/components/reviews/ReviewModerationCard";
import {
  approveReviewAction,
  rejectReviewAction,
  replyToReviewAction,
  flagReviewAction,
} from "@/app/actions/review";

const AUTO_APPROVE_HOURS = 72;

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

export default async function OrganizerReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const organizer = await db.organizer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!organizer) redirect("/onboarding/organizer");

  // Counts per status, for the filter tabs
  const grouped = await db.review.groupBy({
    by: ["status"],
    where: { event: { organizerId: organizer.id } },
    _count: { _all: true },
  });
  const counts: Record<StatusFilter, number> = {
    PENDING: 0, APPROVED: 0, REJECTED: 0, FLAGGED: 0,
  };
  for (const g of grouped) counts[g.status as StatusFilter] = g._count._all;

  // Default tab: pending if any, else approved
  const activeStatus: StatusFilter =
    (["PENDING", "APPROVED", "REJECTED", "FLAGGED"] as StatusFilter[]).includes(status as StatusFilter)
      ? (status as StatusFilter)
      : counts.PENDING > 0
      ? "PENDING"
      : "APPROVED";

  const reviews = await db.review.findMany({
    where: { status: activeStatus, event: { organizerId: organizer.id } },
    include: {
      author: { select: { name: true, email: true } },
      event: {
        select: {
          slug: true,
          translations: { select: { locale: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const t = await getTranslations("organizer");
  const tm = await getTranslations("organizer.reviewsModeration");

  const labels = {
    approveCta: tm("approveCta"),
    rejectCta: tm("rejectCta"),
    rejectReasonLabel: tm("rejectReasonLabel"),
    rejectReasonPlaceholder: tm("rejectReasonPlaceholder"),
    rejectConfirm: tm("rejectConfirm"),
    flagCta: tm("flagCta"),
    flagReasonLabel: tm("flagReasonLabel"),
    flagReasonPlaceholder: tm("flagReasonPlaceholder"),
    replyLabel: tm("replyLabel"),
    replyPlaceholder: tm("replyPlaceholder"),
    replyCta: tm("replyCta"),
    replyEditCta: tm("replyEditCta"),
    openOnEvent: tm("openOnEvent"),
    submittedBy: tm("submittedBy"),
    autoApproveIn: tm("autoApproveIn"),
    rejectedReasonLabel: tm("rejectedReasonLabel"),
    yourReply: tm("yourReply"),
  };

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "PENDING",  label: tm("filterPending",  { count: counts.PENDING  }) },
    { key: "APPROVED", label: tm("filterApproved", { count: counts.APPROVED }) },
    { key: "REJECTED", label: tm("filterRejected", { count: counts.REJECTED }) },
    { key: "FLAGGED",  label: tm("filterFlagged",  { count: counts.FLAGGED  }) },
  ];

  const emptyKey: Record<StatusFilter, string> = {
    PENDING: "noPending",
    APPROVED: "noApproved",
    REJECTED: "noRejected",
    FLAGGED: "noFlagged",
  };

  const now = Date.now();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Star className="h-6 w-6 text-[var(--color-pitch-600)]" />
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            {t("reviewsMod")}
          </h1>
          <p className="text-sm text-[var(--color-muted-strong)]">{tm("subtitle")}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        {tabs.map((tab) => {
          const active = activeStatus === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/organizer/reviews?status=${tab.key}`}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition",
                active
                  ? "bg-[var(--color-pitch-600)] text-white"
                  : "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-muted)]">
          {tm(emptyKey[activeStatus] as never)}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const tr =
              r.event.translations.find((x) => x.locale === locale) ??
              r.event.translations.find((x) => x.locale === "en") ??
              r.event.translations[0];
            const eventTitle = tr?.title ?? r.event.slug;

            // Hours until auto-approve (only for PENDING)
            let hoursLeft: number | null = null;
            if (r.status === "PENDING") {
              const elapsedMs = now - r.createdAt.getTime();
              const remainingMs = AUTO_APPROVE_HOURS * 3600_000 - elapsedMs;
              hoursLeft = Math.max(0, Math.ceil(remainingMs / 3600_000));
            }

            return (
              <ReviewModerationCard
                key={r.id}
                review={{
                  id: r.id,
                  rating: r.rating,
                  title: r.title,
                  body: r.body,
                  status: r.status as StatusFilter,
                  rejectedReason: r.rejectedReason,
                  organizerReply: r.organizerReply,
                  organizerRepliedAt: r.organizerRepliedAt,
                  createdAt: r.createdAt,
                  authorName: r.author.name ?? r.author.email ?? "Participant",
                  eventSlug: r.event.slug,
                  eventTitle,
                  hoursUntilAutoApprove: hoursLeft,
                }}
                approveAction={approveReviewAction}
                rejectAction={rejectReviewAction}
                replyAction={replyToReviewAction}
                flagAction={flagReviewAction}
                labels={labels}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
