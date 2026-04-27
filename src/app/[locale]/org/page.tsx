import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { OrganizerCard } from "@/components/cards/OrganizerCard";
import { getOrganizers, getOrganizerCountryCodes, type OrganizerFilters } from "@/lib/queries";
import { getCountries, findCountry } from "@/lib/countries";
import { Search, Globe2, Sparkles, ShieldCheck, ChevronDown, X, Tag } from "lucide-react";

type SP = Record<string, string | string[] | undefined>;

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const TIERS = ["FREE", "PRO", "PREMIUM", "ENTERPRISE"] as const;
type Tier = (typeof TIERS)[number];
function isTier(v: string | undefined): v is Tier {
  return !!v && (TIERS as readonly string[]).includes(v);
}

const ACTIVITY_TYPES = [
  "TOURNAMENT","CAMP","FESTIVAL","MASTERCLASS","MATCH_TOUR","SHOWCASE","TRAINING_CAMP","TRYOUT",
] as const;
type ActivityType = (typeof ACTIVITY_TYPES)[number];
function isActivityType(v: string | undefined): v is ActivityType {
  return !!v && (ACTIVITY_TYPES as readonly string[]).includes(v);
}
const ACTIVITY_TO_CAT_KEY: Record<ActivityType, string> = {
  TOURNAMENT: "tournaments", CAMP: "camps", FESTIVAL: "festivals",
  MASTERCLASS: "masterclasses", MATCH_TOUR: "match-tours", SHOWCASE: "showcases",
  TRAINING_CAMP: "training-camps", TRYOUT: "tryouts",
};

export default async function OrganizersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const t       = await getTranslations("organizers");
  const tCommon = await getTranslations("common");
  const tNav    = await getTranslations("nav");
  const tCat    = await getTranslations("categoryHeaders");

  const country = pickStr(sp.country);
  const tierRaw = pickStr(sp.tier);
  const activityRaw = pickStr(sp.activity);
  const verified = pickStr(sp.verified) === "1";
  const q = pickStr(sp.q) ?? "";

  const activity: ActivityType | undefined = isActivityType(activityRaw) ? activityRaw : undefined;

  const filters: OrganizerFilters = {
    countryCode: country || undefined,
    tier: isTier(tierRaw) ? tierRaw : undefined,
    verified: verified || undefined,
    q: q || undefined,
    activityType: activity,
  };

  const activityOpts = ACTIVITY_TYPES.map((a) => ({ value: a, label: tCat(`${ACTIVITY_TO_CAT_KEY[a]}.title`) }));

  const [organizers, countryCodes] = await Promise.all([
    getOrganizers(filters),
    getOrganizerCountryCodes(),
  ]);

  // Build country options: only countries that have at least one organizer.
  const allCountries = getCountries(locale);
  const countryByCode = new Map(allCountries.map((c) => [c.code, c]));
  const countryOpts = countryCodes
    .map((code) => countryByCode.get(code) ?? findCountry(code))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const labels = {
    verified: tCommon("verified"),
    events:   tCommon("events"),
    reviews:  tCommon("reviews"),
  };

  const hasFilters = !!(country || filters.tier || verified || q || activity);

  const activeCountry = country ? countryByCode.get(country) ?? findCountry(country) : null;
  const activityLabel = activity ? tCat(`${ACTIVITY_TO_CAT_KEY[activity]}.title`) : null;
  const activeChips: { key: string; label: string; href: string }[] = [];
  const buildHref = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (country) next.set("country", country);
    if (filters.tier) next.set("tier", filters.tier);
    if (activity) next.set("activity", activity);
    if (verified) next.set("verified", "1");
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) next.delete(k); else next.set(k, v);
    }
    const s = next.toString();
    return s ? `?${s}` : "?";
  };
  if (q) activeChips.push({ key: "q", label: `"${q}"`, href: buildHref({ q: null }) });
  if (activeCountry) activeChips.push({ key: "country", label: `${activeCountry.flag} ${activeCountry.name}`, href: buildHref({ country: null }) });
  if (activityLabel) activeChips.push({ key: "activity", label: activityLabel, href: buildHref({ activity: null }) });
  if (filters.tier) activeChips.push({ key: "tier", label: filters.tier, href: buildHref({ tier: null }) });
  if (verified) activeChips.push({ key: "verified", label: t("filters.verifiedOnly"), href: buildHref({ verified: null }) });

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("pageTitle") }]}
      />
      <Container className="py-10">
        {/* Filter bar — pure GET form, no client JS */}
        <form
          method="GET"
          className="mb-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] sm:p-4"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("filters.searchPlaceholder")}
                className="h-11 w-full rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] pl-10 pr-9 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
                aria-label={t("filters.searchPlaceholder")}
              />
              {q && (
                <a
                  href={buildHref({ q: null })}
                  aria-label={t("filters.reset")}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Country */}
            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <select
                name="country"
                defaultValue={country ?? ""}
                className="h-11 w-full appearance-none rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] pl-10 pr-9 text-sm font-medium text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
                aria-label={t("filters.country")}
              >
                <option value="">{t("filters.allCountries")}</option>
                {countryOpts.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>

            {/* Activity */}
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <select
                name="activity"
                defaultValue={activity ?? ""}
                className="h-11 w-full appearance-none rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] pl-10 pr-9 text-sm font-medium text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
                aria-label={t("filters.activity")}
              >
                <option value="">{t("filters.allActivities")}</option>
                {activityOpts.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>

            {/* Tier */}
            <div className="relative">
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <select
                name="tier"
                defaultValue={filters.tier ?? ""}
                className="h-11 w-full appearance-none rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] pl-10 pr-9 text-sm font-medium text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
                aria-label={t("filters.tier")}
              >
                <option value="">{t("filters.allTiers")}</option>
                {TIERS.map((tr) => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:justify-end">
              {/* Verified pill toggle */}
              <label
                className={`inline-flex h-11 cursor-pointer select-none items-center gap-2 rounded-[var(--radius-full)] border px-3.5 text-sm font-medium transition ${
                  verified
                    ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-500)]/10 text-[var(--color-pitch-700)]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={verified}
                  className="sr-only"
                />
                <ShieldCheck className={`h-4 w-4 ${verified ? "text-[var(--color-pitch-600)]" : ""}`} />
                <span className="hidden sm:inline">{t("filters.verifiedOnly")}</span>
              </label>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-pitch-600)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-pitch-700)] active:translate-y-px"
              >
                {t("filters.apply")}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {organizers.length}
              </span>
              {activeChips.map((c) => (
                <a
                  key={c.key}
                  href={c.href}
                  className="group inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] py-1 pl-3 pr-2 text-xs font-medium text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:bg-[var(--color-pitch-500)]/5"
                >
                  <span>{c.label}</span>
                  <span className="grid h-4 w-4 place-items-center rounded-full text-[var(--color-muted)] transition group-hover:bg-[var(--color-pitch-500)]/10 group-hover:text-[var(--color-pitch-700)]">
                    <X className="h-3 w-3" />
                  </span>
                </a>
              ))}
              <a
                href="?"
                className="ml-auto text-xs font-medium text-[var(--color-muted-strong)] underline-offset-4 hover:text-[var(--color-pitch-700)] hover:underline"
              >
                {t("filters.reset")}
              </a>
            </div>
          )}
        </form>

        {organizers.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-muted)]">
            {t("filters.empty")}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {organizers.map((o) => (
              <OrganizerCard key={o.id} organizer={o} labels={labels} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
