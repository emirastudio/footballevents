import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ClubOnboardForm } from "@/components/club/ClubOnboardForm";
import { getCountries } from "@/lib/countries";

export default async function ClubOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Idempotent landing: if the user already has a Club, send them to the
  // dashboard instead of letting them create a second one. Dual-hat
  // ORGANIZER + CLUB is allowed (a Club here is independent of any
  // Organizer they may also own).
  const existing = await db.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) redirect("/club/dashboard");

  const t = await getTranslations("club");

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
          {t("onboardTitle")}
        </h1>
        <p className="mt-2 text-[var(--color-muted-strong)]">{t("onboardSubtitle")}</p>

        <div className="mt-8 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
          <ClubOnboardForm
            defaultName={session.user.name ?? ""}
            defaultSecondLocale={locale === "ru" || locale === "de" || locale === "es" ? locale : ""}
            countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
            labels={{
              name: t("name"),
              nameHint: t("nameHint"),
              slug: t("slug"),
              slugHint: t("slugHint"),
              country: t("country"),
              city: t("city"),
              foundedYear: t("foundedYear"),
              foundedYearHint: t("foundedYearHint"),
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
