export const locales = ["en", "ru", "de", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
  de: "🇩🇪",
  es: "🇪🇸",
};
