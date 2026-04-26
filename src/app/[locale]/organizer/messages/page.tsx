import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function MessagesStub({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("organizer");
  return (
    <div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("messages")}</h1>
      <p className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-sm text-[var(--color-muted)]">
        Coming next — переписка с заявителями. Сначала на polling, потом на Supabase Realtime.
      </p>
    </div>
  );
}
