import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EmbedForm } from "@/components/booking/EmbedForm";
import { parseForm } from "@/lib/forms/types";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function EmbedRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const event = await db.event.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!event) notFound();

  const t = await getTranslations("apply");
  const en = event.translations.find((tr) => tr.locale === locale) ?? event.translations.find((tr) => tr.locale === "en");
  const title = en?.title ?? slug;
  const open = event.status === "PUBLISHED" && event.acceptsBookings;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{title}</h1>
      <p className="mb-5 text-sm text-[var(--color-muted)]">{t("title")}</p>

      {open ? (
        <EmbedForm
          eventId={event.id}
          fields={parseForm(event.registrationForm).fields}
          labels={{
            participantName: t("participantName"),
            teamName: t("teamName"),
            partySize: t("partySize"),
            contactEmail: t("contactEmail"),
            contactPhone: t("contactPhone"),
            comment: t("comment"),
            submit: t("submit"),
            submitting: t("submitting"),
            successTitle: t("successTitle"),
            successBody: t("successBody"),
          }}
        />
      ) : (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted-strong)]">
          {t("notAccepted")}
        </p>
      )}

      <a
        href={`/${locale}/events/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        footballevents.eu
      </a>
    </div>
  );
}
