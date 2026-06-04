import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ApplyForm } from "@/components/booking/ApplyForm";
import { parseForm, localizeFields } from "@/lib/forms/types";
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
  // Allow multiple applications from one account (e.g. a parent registering two
  // children) — we only count prior ones to show a friendly note.
  const priorCount = await db.booking.count({ where: { eventId: event.id, userId: session.user.id } });
  const ANOTHER_NOTE: Record<string, string> = {
    en: "You already have applications for this event. You can submit another one below — for example, to register a second child.",
    ru: "У вас уже есть заявки на это мероприятие. Можно подать ещё одну ниже — например, записать второго ребёнка.",
    de: "Du hast bereits Bewerbungen für dieses Event. Du kannst unten eine weitere absenden — z. B. ein zweites Kind anmelden.",
    es: "Ya tienes solicitudes para este evento. Puedes enviar otra abajo — por ejemplo, para inscribir a un segundo niño.",
  };
  const ANOTHER_BTN: Record<string, string> = {
    en: "Register another", ru: "Записать ещё", de: "Weitere hinzufügen", es: "Inscribir a otro",
  };

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
          ) : (
            <div className="space-y-4">
              {priorCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-2 text-sm text-[var(--color-pitch-700)]">
                  <span>{ANOTHER_NOTE[locale] ?? ANOTHER_NOTE.en}</span>
                  <Link href="/me/applications" className="shrink-0 font-semibold hover:underline">
                    {t("viewMine")} →
                  </Link>
                </div>
              )}
              <ApplyForm
                eventId={event.id}
                defaultEmail={session.user.email ?? ""}
                defaultName={session.user.name ?? ""}
                fields={localizeFields(parseForm(event.registrationForm), locale)}
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
                  another: ANOTHER_BTN[locale] ?? ANOTHER_BTN.en,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
