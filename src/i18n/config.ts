// Display order in language switchers. The runtime locale set still
// includes all four — only the order of presentation changes here.
export const locales = ["en", "de", "es", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  ru: "Русский",
};
