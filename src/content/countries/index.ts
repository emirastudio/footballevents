import type { CountryContent } from "./types";
import { england } from "./england";

/** Registry of country SEO pages. Add a new country module + register it here. */
const COUNTRIES: Record<string, CountryContent> = {
  [england.slug]: england,
};

export function getCountryContent(slug: string): CountryContent | null {
  return COUNTRIES[slug] ?? null;
}

/** Slugs eligible for indexing + sitemap (index gate — see SEO_PAGES.md §2.5). */
export function getPublishedCountrySlugs(): string[] {
  return Object.values(COUNTRIES)
    .filter((c) => c.published)
    .map((c) => c.slug);
}

export type { CountryContent, CountryLocaleContent } from "./types";
