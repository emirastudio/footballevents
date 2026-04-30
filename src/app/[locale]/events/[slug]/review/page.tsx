import { redirect, notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Star } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { RatingStars } from "@/components/reviews/RatingStars";
import { createReviewAction } from "@/app/actions/review";
import { Container } from "@/components/ui/Container";

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/${locale}/events/${slug}/review`)}`);
  }

  const event = await db.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      startDate: true,
      endDate: true,
      coverUrl: true,
      logoUrl: true,
      organizer: { select: { name: true, logoUrl: true } },
      translations: { select: { locale: true, title: true } },
    },
  });
  if (!event) notFound();

  const title =
    event.translations.find((t) => t.locale === locale)?.title ??
    event.translations.find((t) => t.locale === "en")?.title ??
    event.slug;

  const refDate = event.endDate ?? event.startDate;
  const eventEnded = refDate && refDate.getTime() < Date.now();

  const booking = await db.booking.findFirst({
    where: {
      eventId: event.id,
      userId: session.user.id,
      status: { in: ["ACCEPTED", "COMPLETED"] },
    },
    select: { id: true },
  });

  const existing = await db.review.findUnique({
    where: { eventId_authorId: { eventId: event.id, authorId: session.user.id } },
  });

  const t = await getTranslations("reviews");

  // Header
  const header = (
    <div className="mb-8 flex items-center gap-4">
      {event.coverUrl ? (
        <div
          className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center"
          style={{ backgroundImage: `url(${event.coverUrl})` }}
        />
      ) : (
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] text-2xl">
          ⚽
        </div>
      )}
      <div className="min-w-0">
        <Link
          href={`/events/${event.slug}`}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)] hover:underline"
        >
          ← {title}
        </Link>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          {t("submitTitle")}
        </h1>
        <p className="text-sm text-[var(--color-muted-strong)]">{event.organizer.name}</p>
      </div>
    </div>
  );

  // Already submitted — show their review with status
  if (existing) {
    const statusKey = existing.status as "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
    const statusBadge = {
      PENDING:  "bg-amber-100 text-amber-800",
      APPROVED: "bg-emerald-100 text-emerald-800",
      REJECTED: "bg-red-100 text-red-700",
      FLAGGED:  "bg-orange-100 text-orange-800",
    }[statusKey];

    return (
      <Container className="max-w-2xl py-10">
        {header}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[var(--color-foreground)]">{t("yourReview")}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${statusBadge}`}>
              {t(`status${statusKey}` as never)}
            </span>
          </div>
          <RatingStars value={existing.rating} readOnly size="md" />
          {existing.title && (
            <h3 className="mt-3 text-base font-semibold text-[var(--color-foreground)]">{existing.title}</h3>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted-strong)]">
            {existing.body}
          </p>
          {existing.status === "REJECTED" && existing.rejectedReason && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong>Reason:</strong> {existing.rejectedReason}
            </div>
          )}
          {existing.organizerReply && (
            <div className="mt-4 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                {event.organizer.name}
              </div>
              <p className="text-sm text-[var(--color-foreground)]">{existing.organizerReply}</p>
            </div>
          )}
        </div>
      </Container>
    );
  }

  // Event hasn't ended
  if (!eventEnded) {
    return (
      <Container className="max-w-2xl py-10">
        {header}
        <p className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {t("ineligibleEventFuture")}
        </p>
      </Container>
    );
  }

  // No booking
  if (!booking) {
    return (
      <Container className="max-w-2xl py-10">
        {header}
        <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-strong)]">
          {t("ineligibleNotAttended")}
        </p>
      </Container>
    );
  }

  // Show the form
  const labels = {
    ratingLabel: t("ratingLabel"),
    titleLabel: t("titleLabel"),
    titlePlaceholder: t("titlePlaceholder"),
    bodyLabel: t("bodyLabel"),
    bodyPlaceholder: t("bodyPlaceholder"),
    bodyMin: t("bodyMin"),
    submit: t("submit"),
    submitting: t("submitting"),
    guidelines: t("guidelines"),
    errors: {
      ratingRequired: t("errors.ratingRequired"),
      bodyTooShort: t("errors.bodyTooShort"),
      bodyTooLong: t("errors.bodyTooLong"),
    },
  };

  return (
    <Container className="max-w-2xl py-10">
      {header}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="mb-6 text-sm text-[var(--color-muted-strong)]">{t("submitSubtitle")}</p>
        <ReviewForm
          eventId={event.id}
          eventSlug={event.slug}
          locale={locale}
          action={createReviewAction}
          labels={labels}
        />
      </div>
    </Container>
  );
}
