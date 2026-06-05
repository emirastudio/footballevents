import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ClubSettingsForm } from "@/components/club/ClubSettingsForm";
import { getCountries } from "@/lib/countries";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    include: {
      translations: true,
      city: { select: { nameEn: true } },
    },
  });
  if (!club) redirect("/onboarding/club");

  const t = await getTranslations("club");

  const en = club.translations.find((tr) => tr.locale === "en");
  const second = club.translations.find((tr) => tr.locale !== "en");
  const defaultSecondLocale: "" | "ru" | "de" | "es" =
    second && (second.locale === "ru" || second.locale === "de" || second.locale === "es")
      ? second.locale
      : "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("navSettings")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("settingsSubtitle")}</p>
      </header>

      <ClubSettingsForm
        countries={getCountries(locale).map((c) => ({ code: c.code, name: c.name, flag: c.flag }))}
        defaults={{
          name: club.name,
          legalName: club.legalName ?? "",
          email: club.email ?? "",
          phone: club.phone ?? "",
          website: club.website ?? "",
          countryCode: club.countryCode,
          city: club.city?.nameEn ?? "",
          foundedYear: club.foundedYear ? String(club.foundedYear) : "",
          logoUrl: club.logoUrl ?? "",
          coverUrl: club.coverUrl ?? "",
          taglineEn: en?.tagline ?? "",
          aboutEn: en?.about ?? "",
          secondLocale: defaultSecondLocale,
          taglineSecond: second?.tagline ?? "",
          aboutSecond: second?.about ?? "",
          instagramUrl: club.instagramUrl ?? "",
          facebookUrl: club.facebookUrl ?? "",
          xUrl: club.xUrl ?? "",
          tiktokUrl: club.tiktokUrl ?? "",
          youtubeUrl: club.youtubeUrl ?? "",
          whatsappUrl: club.whatsappUrl ?? "",
        }}
        labels={{
          saved: t("settingsSaved"),
          basicsSection: t("settingsBasics"),
          name: t("name"),
          legalName: t("legalName"),
          email: t("settingsEmail"),
          phone: t("phone"),
          website: t("website"),
          country: t("country"),
          city: t("city"),
          foundedYear: t("foundedYear"),
          englishSection: t("englishSection"),
          secondSection: t("secondSection"),
          secondLanguagePicker: t("secondLanguagePicker"),
          taglineEn: t("taglineEn"),
          aboutEn: t("aboutEn"),
          taglineSecond: t("taglineSecond"),
          aboutSecond: t("aboutSecond"),
          taglineHint: t("taglineHint"),
          aboutHint: t("aboutHint"),
          logoUrl: t("logoUrl"),
          coverUrl: t("coverUrl"),
          socialsSection: t("settingsSocials"),
          instagram: "Instagram",
          facebook: "Facebook",
          xTwitter: "X / Twitter",
          tiktok: "TikTok",
          youtube: "YouTube",
          whatsapp: "WhatsApp",
          submit: t("settingsSubmit"),
          loading: t("loading"),
          langRu: t("langRu"),
          langDe: t("langDe"),
          langEs: t("langEs"),
          langNone: t("langNone"),
        }}
      />
    </div>
  );
}
