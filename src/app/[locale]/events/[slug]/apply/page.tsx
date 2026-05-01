import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ApplyForm } from "@/components/booking/ApplyForm";
import { ChevronLeft } from "lucide-react";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?next=/events/${slug}/apply`);

  const event = await db.event.findUnique({
    where: { slug },
    include: { translations: true, organizer: true },
  });
  if (!event) notFound();

  const en = event.translations.find((tr) => tr.locale === locale) ?? event.translations.find((tr) => tr.locale === "en");
  const eventTitle = en?.title ?? slug;

  const t = await getTranslations("apply");

  // Block conditions
  const isOwn = event.organizer.userId === session.user.id;
  const existing = await db.booking.findFirst({ where: { eventId: event.id, userId: session.user.id } });

  return (
    <Container className="py-10">
      <Link href={`/events/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-4 w-4" /> {eventTitle}
      </Link>

      <div className="mx-auto max-w-2xl">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("title", { eventTitle })}
        </h1>
        <p className="mt-2 text-[var(--color-muted-strong)]">{t("subtitle")}</p>

        <div className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          {isOwn ? (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("ownEvent")}
            </p>
          ) : !event.acceptsBookings ? (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("notAccepted")}
            </p>
          ) : existing ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-2 text-sm text-[var(--color-pitch-700)]">
                {t("alreadyApplied")}
              </div>
              <Link href="/me/applications" className="text-sm font-semibold text-[var(--color-pitch-700)] hover:underline">
                {t("viewMine")} →
              </Link>
            </div>
          ) : (
            <ApplyForm
              eventId={event.id}
              defaultEmail={session.user.email ?? ""}
              defaultName={session.user.name ?? ""}
              labels={{
                participantName: t("participantName"),
                teamName: t("teamName"),
                partySize: t("partySize"),
                contactEmail: t("contactEmail"),
                contactPhone: t("contactPhone"),
                comment: t("comment"),
                commentHint: t("commentHint"),
                submit: t("submit"),
                submitting: t("submitting"),
                successTitle: t("successTitle"),
                successBody: t("successBody"),
                viewMine: t("viewMine"),
              }}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
