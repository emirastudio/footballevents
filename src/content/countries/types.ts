import type { Locale } from "@/i18n/config";

/** Localized editorial + facts for one country SEO page. */
export type CountryLocaleContent = {
  /** <title> — on the primary query, e.g. "Youth Football Tournaments in England". */
  seoTitle: string;
  metaDescription: string;
  /** On-query H1. */
  h1: string;
  /** 2–3 sentence intro. */
  intro: string;
  /** "Why bring your team here" cards. */
  whyVisit: { title: string; text: string }[];
  /** Fact card VALUES (localized proper nouns). Labels come from messages. */
  facts: {
    capital: string;
    population: string;
    uefaMember: string;
    nationalTeam: string;
    topLeague: string;
    proClubs: string;
    faFounded: string;
  };
  /** "Football in {country}" depth section — HTML for <RichText>. */
  historyHtml: string;
  faq: { q: string; a: string }[];
};

export type CountryContent = {
  slug: string;
  /** ISO code used to aggregate tournaments from the DB. */
  countryCode: string;
  flagEmoji: string;
  /** Index gate (§2.5 of SEO_PAGES.md): only published countries are indexed + in sitemap. */
  published: boolean;
  /** Affiliate logistics slots. Plain partner search URLs for now; real affiliate IDs later. */
  logistics: {
    bookingUrl: string;
    flightsUrl?: string;
  };
  locales: Record<Locale, CountryLocaleContent>;
};
