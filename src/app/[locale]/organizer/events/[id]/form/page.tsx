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

  const ev = await db.event.findUnique({ where: { id }, select: { organizerId: true, registrationForm: true } });
  if (!ev || ev.organizerId !== organizer.id) notFound();

  const t = await getTranslations("formBuilder");
  const fields = parseForm(ev.registrationForm).fields;

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
    </Container>
  );
}
