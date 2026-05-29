# SEO Pages — architecture & reference

Canonical reference for **programmatic catalog SEO pages** on footballevents.eu
(country, city, age, tournament-type, tournament, organizer, club, calendar).

Read this before building or changing any catalog/landing page. The country
page (§4) is the worked example; the principles (§1–3) apply to **all** page types.

---

## 1. Core idea

Build SEO as the **future structure of the catalog**, not as articles.

- Every page must be **meaningful even when it has zero tournaments**, and
  **automatically get stronger** as tournaments are added.
- One tournament auto-surfaces on many pages (country, city, age, type, …)
  with no manual editing. The data model — not hand-built pages — drives this.
- Pages are generated from the DB through **one template per page type**.

## 2. Non-negotiable rules (learned the hard way)

1. **Football-team lens, not tourism.** Audience = coach/club/parent planning a
   team trip to a tournament. Never compete with Lonely Planet / Wikipedia /
   Booking on generic travel — you lose and dilute intent. Write "bring your U12
   to Girona", not "things to do in Barcelona".
2. **One primary query per page; H1 + `<title>` anchored to it.** A country page
   targets `youth football tournaments in {country}`. Rich content is *support*,
   it must not pull the page off-query.
3. **Tournament cards / CTA stay high** (above the fold). The page is a
   tournaments page first; the guide is depth below it.
4. **Uniqueness lives in DATA, not prose.** Facts, cities, stadiums, real
   tournaments. Templated/AI-paraphrased paragraphs across N countries =
   near-duplicate → Google helpful-content / thin-content risk.
5. **Index gating by CONTENT readiness, not tournament count.** A rich guide with
   0 tournaments *should* be indexed. A stub with empty SEO fields must be
   `noindex` AND excluded from `sitemap.ts`. Quality > quantity, especially on a
   young domain.
6. **Affiliate complements, never dominates.** Too many partner links + thin
   editorial = "thin affiliate" classification. Cap links; value first.
7. **Empty state is a conversion asset, not a dead end** (see §3).

## 3. Empty state (0 tournaments) — required behavior

The tournament block is never blank. Dual CTA:

- **To users:** "Tournaments in {place} coming soon — leave your email, we'll
  notify you." → lead capture.
- **To organizers:** "Running a tournament in {place}? List it free, be first."
  → matches the outreach message (be first, grow with the catalog).

This makes the page useful, lead-generating, and indexable **before any
inventory exists**.

## 4. Country page — reference template

### URL & i18n
```
/{locale}/countries/{country_slug}        e.g. /en/countries/spain
```
- Single **English slug** across all locales (`spain`). No localized slugs (for now).
- `hreflang` across the 4 locales (en/ru/de/es) + `x-default` = EN.
- Canonical = self (per-locale).

### Section order (fixed)

| # | Section | Content type | Notes |
|---|---------|--------------|-------|
| 1 | H1 + intro | localized, 2–3 sentences | H1 strictly on-query ("Youth Football Tournaments in Spain"). |
| 2 | Tournament cards / empty-state | dynamic (Event) | **Above the fold.** See §3. |
| 3 | Football Facts | data cards | Capital, population, UEFA member, national team, top league, club count. |
| 4 | Why bring your team here | localized, short | Seasonal climate for matches, football culture, infrastructure. |
| 5 | Logistics / Plan the trip | affiliate slots | Accommodation, flights, transfer, facility rental, insurance. |
| 6 | Cities | dynamic (City) | Links to city pages (internal linking). |
| 7 | Football in {country}: facts & history | localized, depth | Facts/events, not Wikipedia. Dwell-time + uniqueness. |
| 8 | FAQ | localized + FAQ schema | Biggest tournaments, season timing, can foreign teams join. |

### Structured data
- `FAQPage` on the FAQ block.
- `BreadcrumbList`: Home → Countries → {Country}.
- `ItemList` on the tournament block (when populated).
- (Tournament pages later: `schema.org/Event`.)

## 5. Content & data model (as implemented)

Editorial SEO content (intro, facts, why-visit, history, FAQ, affiliate URLs)
lives in **typed content modules**, NOT in the DB. Dynamic data (tournaments)
is still queried live from Postgres and aggregated by `countryCode`.

**Why typed modules, not a `CountryTranslation` table:** for structured,
multi-locale editorial copy this is type-safe, reviewable in PRs, needs no
migration, and avoids runtime filesystem reads. (The `content/` dir is reserved
for legal markdown.) A DB-backed `CountryTranslation` remains a valid *future*
option if non-developers need to edit copy in an admin UI — but only adopt it
when that need is real.

**Implemented layout** (reference: England):
```
src/content/countries/types.ts      # CountryContent / CountryLocaleContent
src/content/countries/england.ts     # one module per country (4 locales inline)
src/content/countries/index.ts        # registry: getCountryContent(slug),
                                       #           getPublishedCountrySlugs()
src/app/[locale]/countries/[slug]/page.tsx   # the one template
src/lib/queries.ts → getEventsByCountry(countryCode, locale)
messages/{en,de,es,ru}.json → "countries" namespace (reusable UI labels)
```

`CountryContent` carries: `slug`, `countryCode` (ISO, for tournament queries),
`flagEmoji`, `published` (index gate), `logistics` (affiliate URLs), and
`locales: Record<Locale, {...}>` with `seoTitle`, `metaDescription`, `h1`,
`intro`, `whyVisit[]`, `facts{}`, `historyHtml`, `faq[]`. Fact **values** are
localized inside each locale block; fact **labels** come from the `countries`
messages namespace.

**Adding a country:** create `src/content/countries/{slug}.ts` and register it
in `index.ts`. Nothing else.

### Indexability rule (implemented)
`indexable == CountryContent.published` →
- if false: `generateMetadata` sets `robots: { index: false, follow: true }`
  AND the slug is omitted from `sitemap.ts` (`getPublishedCountrySlugs()`).
- tournament count is irrelevant to indexability.

### Country vs ISO modeling
Football nations ≠ ISO countries. England has no ISO code; the `Country` table
only has `GB` (United Kingdom). The country **page** is keyed by its own `slug`
("england") in the content module, decoupled from the ISO table; tournaments
aggregate by `countryCode` (`GB`). Apply the same pattern for Scotland/Wales/NI.

## 6. Affiliate slots (monetization)

Store as **config**, not hardcoded markup:
`{ type, partner, urlTemplate }` with `{country}/{city}` substitution.
Types: `accommodation` (Booking), `flights`, `transfer`, `facility_rental`,
`insurance`. Enforce a max link count per block (§2.6).

## 7. Internal linking & sitemap
- Link Country → Cities → Tournaments → Organizer, bidirectionally.
- Extend existing `src/app/sitemap.ts`: include only `getPublishedCountrySlugs()`
  (done for countries; same pattern for future page types).
- Breadcrumbs on every catalog page.

## 8. Known gotchas / open decisions
- **Age taxonomy is inconsistent in the codebase**: `Event.ageGroups` is
  documented as birth years ("2013","ADULT") but filtered as U-notation
  ("U10","U12") in `saved-search.ts` / `mock-data.ts`. **Fix this single
  canonical age axis (with a birth-year ↔ U-category season mapping) BEFORE
  building `/age` and country+age pages.**
- **Faceted explosion**: country × age × type × city is tens of thousands of
  URLs. Only generate/index combos with **both demand and content**;
  canonicalize empties to the parent; protect crawl budget.
- **Locales — DECIDED**: fill all 4 locales per country (en/de/es/ru), as done
  for England.
- **Empty-state lead capture — interim**: dual CTA links to existing routes
  (`/organizer/events/new` to list, `/events` to explore). A dedicated
  "notify me" capture is still open for later.
- App routes are `/[locale]/...` (next-intl). This Next.js is non-standard
  (v16). The local `node_modules/next/dist/docs/` may be empty — the most
  reliable reference is existing working pages (e.g. `events/[slug]/page.tsx`):
  `params` is a `Promise`, call `setRequestLocale`, `dynamic = "force-dynamic"`,
  `generateStaticParams` returns `[]`.

## 9. Build phases
1. ✅ **DONE** — country template + typed content module + `countries` messages
   + sitemap. Reference country live: **England** (`/{locale}/countries/england`,
   all 4 locales).
2. Fill the other top football countries deeply (4 locales each): Spain,
   Portugal, Germany, Italy, Netherlands. Just add a content module + register.
   Then submit to GSC.
3. Affiliate slots (Booking) in logistics.
4. City pages (`CityTranslation`).
5. Age axis (fix the taxonomy first) → `/age` and country+age pages.

## 10. Pre-publish checklist (per page)
- [ ] H1 + `<title>` on the primary query
- [ ] Tournament block above the fold; empty-state dual CTA wired
- [ ] Unique data present (facts/cities/stadiums), not just prose
- [ ] `isPublished` reflects real content; `noindex` + sitemap-excluded otherwise
- [ ] hreflang + canonical correct for all locales
- [ ] Structured data (FAQ, BreadcrumbList, ItemList)
- [ ] Internal links in/out; breadcrumbs
- [ ] Affiliate links within cap; value-first
