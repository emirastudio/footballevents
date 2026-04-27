import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountries } from "@/lib/countries";
import { EventWizard } from "@/components/organizer/EventWizard";
import type { Tier } from "@/lib/tier";
import { Container } from "@/components/ui/Container";
import { buildWizardLabels } from "./_labels";

export default async function NewEventWizardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("eventForm");
  const tWizard = await getTranslations("eventWizard");

  const categories = await db.category.findMany({ include: { translations: true }, orderBy: { order: "asc" } });
  const cats = categories.map((c) => {
    const tr = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "en");
    return { id: c.id, slug: c.slug, name: tr?.name ?? c.slug };
  });

  const labels = buildWizardLabels(t, tWizard);
  const defaultSecondLocale = locale === "ru" || locale === "de" || locale === "es" ? locale : "";

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <EventWizard
          step={1}
          highestStep={1}
          tier={organizer.subscriptionTier as Tier}
          categories={cats}
          countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
          defaults={{ secondLocale: defaultSecondLocale, countryCode: organizer.countryCode ?? undefined }}
          labels={labels}
        />
      </div>
    </Container>
  );
}
