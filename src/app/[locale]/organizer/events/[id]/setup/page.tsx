import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountries } from "@/lib/countries";
import { EventWizard } from "@/components/organizer/EventWizard";
import type { Tier } from "@/lib/tier";
import { Container } from "@/components/ui/Container";
import { buildWizardLabels } from "../../new/_labels";

type SP = Record<string, string | string[] | undefined>;

export default async function SetupEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const ev = await db.event.findUnique({
    where: { id },
    include: { translations: true, category: true, venue: true },
  });
  if (!ev || ev.organizerId !== organizer.id) notFound();

  const stepRaw = Number(Array.isArray(sp.step) ? sp.step[0] : sp.step);
  const step = (stepRaw >= 1 && stepRaw <= 5 ? stepRaw : Math.min(ev.wizardStep, 5)) as 1 | 2 | 3 | 4 | 5;

  const t = await getTranslations("eventForm");
  const tWizard = await getTranslations("eventWizard");

  const categories = await db.category.findMany({ include: { translations: true }, orderBy: { order: "asc" } });
  const cats = categories.map((c) => {
    const tr = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "en");
    return { id: c.id, slug: c.slug, name: tr?.name ?? c.slug };
  });

  const en = ev.translations.find((tr) => tr.locale === "en") ?? ev.translations[0];
  const second = ev.translations.find((tr) => tr.locale !== "en");
  const secondLocale: "" | "ru" | "de" | "es" =
    second?.locale === "ru" || second?.locale === "de" || second?.locale === "es" ? second.locale : "";

  // Localized rich content. New shape is { en: [...], ru: [...] }; old shape is plain array (legacy EN).
  const programLocalized = ev.program ? JSON.stringify(ev.program) : "";
  const faqLocalized     = ev.faq     ? JSON.stringify(ev.faq)     : "";
  const includedLocalized    = ev.includedI18n
    ? JSON.stringify(ev.includedI18n)
    : (ev.included.length ? JSON.stringify({ en: ev.included.join("\n") }) : "");
  const notIncludedLocalized = ev.notIncludedI18n
    ? JSON.stringify(ev.notIncludedI18n)
    : (ev.notIncluded.length ? JSON.stringify({ en: ev.notIncluded.join("\n") }) : "");

  const labels = buildWizardLabels(t, tWizard);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <EventWizard
          step={step}
          highestStep={ev.wizardStep}
          tier={organizer.subscriptionTier as Tier}
          categories={cats}
          countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
          defaults={{
            eventId: ev.id,
            categoryId: ev.categoryId,
            titleEn: en?.title ?? "",
            shortDescEn: en?.shortDescription ?? "",
            descriptionEn: en?.description ?? "",
            secondLocale,
            titleSecond: second?.title ?? "",
            shortDescSecond: second?.shortDescription ?? "",
            descriptionSecond: second?.description ?? "",
            startDate: ev.startDate?.toISOString().slice(0, 10),
            endDate: ev.endDate?.toISOString().slice(0, 10),
            registrationDeadline: ev.registrationDeadline?.toISOString().slice(0, 10),
            countryCode: ev.countryCode ?? undefined,
            venueName: ev.venue?.name ?? "",
            venueAddress: ev.customLocation ?? ev.venue?.address ?? undefined,
            ageGroups: ev.ageGroups as unknown as string[],
            gender: ev.gender,
            skillLevel: ev.skillLevel,
            format: ev.format ?? undefined,
            maxParticipants: ev.maxParticipants ?? undefined,
            isFree: ev.isFree,
            priceFrom: ev.priceFrom ? Number(ev.priceFrom) : undefined,
            priceTo: ev.priceTo ? Number(ev.priceTo) : undefined,
            currency: ev.currency,
            externalUrl: ev.externalUrl ?? undefined,
            contactEmail: ev.contactEmail ?? undefined,
            contactPhone: ev.contactPhone ?? undefined,
            acceptsBookings: ev.acceptsBookings,
            logoUrl: ev.logoUrl ?? undefined,
            coverUrl: ev.coverUrl ?? undefined,
            videoUrl: ev.videoUrl ?? undefined,
            included: includedLocalized,
            notIncluded: notIncludedLocalized,
            programme: programLocalized,
            faq: faqLocalized,
          }}
          labels={labels}
        />
      </div>
    </Container>
  );
}
