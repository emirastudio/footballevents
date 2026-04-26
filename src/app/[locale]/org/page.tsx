import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { OrganizerCard } from "@/components/cards/OrganizerCard";
import { getOrganizers, getOrganizerCountryCodes, type OrganizerFilters } from "@/lib/queries";
import { getCountries, findCountry } from "@/lib/countries";

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

  const country = pickStr(sp.country);
  const tierRaw = pickStr(sp.tier);
  const verified = pickStr(sp.verified) === "1";
  const q = pickStr(sp.q) ?? "";

  const filters: OrganizerFilters = {
    countryCode: country || undefined,
    tier: isTier(tierRaw) ? tierRaw : undefined,
    verified: verified || undefined,
    q: q || undefined,
  };

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

  const hasFilters = !!(country || filters.tier || verified || q);

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
          className="mb-6 flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-xs)]"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t("filters.searchPlaceholder")}
            className="min-w-[180px] flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
            aria-label={t("filters.searchPlaceholder")}
          />

          <select
            name="country"
            defaultValue={country ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
            aria-label={t("filters.country")}
          >
            <option value="">{t("filters.allCountries")}</option>
            {countryOpts.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          <select
            name="tier"
            defaultValue={filters.tier ?? ""}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
            aria-label={t("filters.tier")}
          >
            <option value="">{t("filters.allTiers")}</option>
            {TIERS.map((tr) => (
              <option key={tr} value={tr}>{tr}</option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={verified}
              className="h-4 w-4 accent-[var(--color-pitch-500)]"
            />
            {t("filters.verifiedOnly")}
          </label>

          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-pitch-700)]"
          >
            {t("filters.apply")}
          </button>
          {hasFilters && (
            <a
              href="?"
              className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition hover:bg-[var(--color-bg-muted)]"
            >
              {t("filters.reset")}
            </a>
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
