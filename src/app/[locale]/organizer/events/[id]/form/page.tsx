import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { FormBuilder } from "@/components/organizer/FormBuilder";
import { parseForm } from "@/lib/forms/types";

export default async function EventFormBuilderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const ev = await db.event.findUnique({ where: { id }, select: { organizerId: true, registrationForm: true, slug: true } });
  if (!ev || ev.organizerId !== organizer.id) notFound();

  const t = await getTranslations("formBuilder");
  const fields = parseForm(ev.registrationForm).fields;

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";
  const embedSnippet = `<iframe src="${SITE}/${locale}/embed/${ev.slug}" width="100%" height="760" style="border:1px solid #e5e9f0;border-radius:12px" loading="lazy" title="Registration"></iframe>`;

  return (
    <Container className="py-8">
      <Link href={`/organizer/events/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-4 w-4" /> {t("back")}
      </Link>
      <FormBuilder
        eventId={id}
        initialFields={fields}
        labels={{
          title: t("title"), subtitle: t("subtitle"), addField: t("addField"),
          fieldLabel: t("fieldLabel"), required: t("required"), help: t("help"),
          options: t("options"), optionsHint: t("optionsHint"),
          sizeChart: t("sizeChart"), sizeChartHint: t("sizeChartHint"),
          save: t("save"), saving: t("saving"), saved: t("saved"), empty: t("empty"),
        }}
      />

      {/* Embed snippet — paste on any third-party site */}
      <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">{t("embedTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("embedHint")}</p>
        <textarea
          readOnly
          rows={3}
          defaultValue={embedSnippet}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] p-3 font-[family-name:var(--font-mono,monospace)] text-xs text-[var(--color-foreground)]"
        />
      </section>
    </Container>
  );
}
