import all from "world-countries";

export type CountryEntry = {
  code: string;        // ISO 3166-1 alpha-2
  name: string;        // localized common name
  flag: string;        // emoji
  region?: string;
};

const TRANSLATION_KEY: Record<string, string> = {
  en: "eng", // not used (world-countries' name.common is English)
  ru: "rus",
  de: "deu",
  es: "spa",
};

export function getCountries(locale: string = "en"): CountryEntry[] {
  const key = TRANSLATION_KEY[locale];
  return all
    .filter((c) => c.independent || c.unMember || c.cca2 === "TW" || c.cca2 === "PS")
    .map((c) => ({
      code: c.cca2,
      name:
        locale === "en" || !key
          ? c.name.common
          : c.translations?.[key as keyof typeof c.translations]?.common ?? c.name.common,
      flag: c.flag,
      region: c.region,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function findCountry(code: string): CountryEntry | undefined {
  const c = all.find((x) => x.cca2 === code.toUpperCase());
  if (!c) return undefined;
  return { code: c.cca2, name: c.name.common, flag: c.flag, region: c.region };
}
