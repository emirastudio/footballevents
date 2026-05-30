import type { CountryContent } from "./types";
import { england } from "./england";
import { spain } from "./spain";
import { portugal } from "./portugal";
import { germany } from "./germany";
import { italy } from "./italy";
import { netherlands } from "./netherlands";
import { france } from "./france";

/** Registry of country SEO pages. Add a new country module + register it here. */
const COUNTRIES: Record<string, CountryContent> = {
  [england.slug]: england,
  [spain.slug]: spain,
  [portugal.slug]: portugal,
  [germany.slug]: germany,
  [italy.slug]: italy,
  [netherlands.slug]: netherlands,
  [france.slug]: france,
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
