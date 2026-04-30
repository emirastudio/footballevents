import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OrganizerOnboardForm } from "@/components/organizer/OrganizerOnboardForm";
import { getCountries } from "@/lib/countries";

const VALID_PROMOS = ["launch100"];

export default async function OrganizerOnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const promo = VALID_PROMOS.includes(sp.promo ?? "") ? (sp.promo as string) : null;

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const existing = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/organizer/dashboard");

  const t = await getTranslations("organizer");
  const tCat = await getTranslations("categoryHeaders");

  const activityOptions = [
    { value: "TOURNAMENT",    label: tCat("tournaments.title") },
    { value: "CAMP",          label: tCat("camps.title") },
    { value: "FESTIVAL",      label: tCat("festivals.title") },
    { value: "MASTERCLASS",   label: tCat("masterclasses.title") },
    { value: "MATCH_TOUR",    label: tCat("match-tours.title") },
    { value: "SHOWCASE",      label: tCat("showcases.title") },
    { value: "TRAINING_CAMP", label: tCat("training-camps.title") },
    { value: "TRYOUT",        label: tCat("tryouts.title") },
  ];

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
          {t("onboardTitle")}
        </h1>
        <p className="mt-2 text-[var(--color-muted-strong)]">{t("onboardSubtitle")}</p>

        {promo && (
          <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-xl)] border border-amber-300 bg-amber-50 px-5 py-4">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-semibold text-amber-900">
                {locale === "ru" ? "Premium активируется бесплатно" :
                 locale === "de" ? "Premium wird kostenlos aktiviert" :
                 locale === "es" ? "Premium se activa gratis" :
                 "Premium activates for free"}
              </p>
              <p className="mt-0.5 text-sm text-amber-800">
                {locale === "ru" ? "Промокод «launch100» даёт 3 месяца Premium бесплатно. Тариф выбран автоматически — просто заполни профиль." :
                 locale === "de" ? "Promo-Code «launch100» schenkt dir 3 Monate Premium gratis. Der Tarif wurde automatisch gewählt — fülle einfach dein Profil aus." :
                 locale === "es" ? "El código «launch100» te da 3 meses de Premium gratis. El plan se ha seleccionado automáticamente — sólo rellena tu perfil." :
                 "Promo code «launch100» gives you 3 months of Premium free. The plan is pre-selected — just fill in your profile."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
          <OrganizerOnboardForm
            defaultName={session.user.name ?? ""}
            promoActive={!!promo}
            defaultSecondLocale={locale === "ru" || locale === "de" || locale === "es" ? locale : ""}
            countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
            activityOptions={activityOptions}
            labels={{
              name: t("name"),
              nameHint: t("nameHint"),
              slug: t("slug"),
              slugHint: t("slugHint"),
              country: t("country"),
              city: t("city"),
              englishSection: t("englishSection"),
              englishSectionHint: t("englishSectionHint"),
              secondSection: t("secondSection"),
              secondSectionHint: t("secondSectionHint"),
              secondLanguagePicker: t("secondLanguagePicker"),
              taglineEn: t("taglineEn"),
              aboutEn: t("aboutEn"),
              taglineSecond: t("taglineSecond"),
              aboutSecond: t("aboutSecond"),
              taglineHint: t("taglineHint"),
              aboutHint: t("aboutHint"),
              logoUrl: t("logoUrl"),
              coverUrl: t("coverUrl"),
              website: t("website"),
              phone: t("phone"),
              tier: t("tier"),
              tierFree: t("tierFree"),
              tierPro: t("tierPro"),
              tierPremium: t("tierPremium"),
              activityTypes: t("activityTypes"),
              activityTypesHint: t("activityTypesHint"),
              submit: t("submit"),
              loading: t("loading"),
              langRu: t("langRu"),
              langDe: t("langDe"),
              langEs: t("langEs"),
              langNone: t("langNone"),
            }}
          />
        </div>
      </div>
    </Container>
  );
}
