import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { StadiumCard } from "@/components/cards/StadiumCard";
import { StadiumFilters } from "@/components/site/StadiumFilters";
import { countries } from "@/lib/mock-data";
import { getVenues, getStadiumsByCountry } from "@/lib/queries";
import { Search } from "lucide-react";

export default async function StadiumsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t       = await getTranslations("stadiums");
  const tCommon = await getTranslations("common");
  const tNav    = await getTranslations("nav");
  const tFilters = await getTranslations("filters");

  const q       = ((sp.q as string) ?? "").toLowerCase();
  const country = (sp.country as string) ?? "";
  const hasFilters = !!q || !!country;

  const venues = await getVenues();
  const filtered = venues.filter((v) => {
    if (q && !`${v.name} ${v.city}`.toLowerCase().includes(q)) return false;
    if (country && v.countryCode !== country) return false;
    return true;
  });

  const labels = {
    capacity: tCommon("capacity"),
    events:   tCommon("events"),
  };

  const filterLabels = {
    search: tCommon("search"),
    searchPlaceholder: t("searchPlaceholder"),
    filterByCountry: t("filterByCountry"),
    allCountries: t("allCountries"),
    reset: tFilters("reset"),
  };

  const groupedAll = await getStadiumsByCountry();
  const orderedCountries = countries.filter((c) => groupedAll[c.code]?.length);

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("pageTitle") }]}
      >
        <StadiumFilters labels={filterLabels} />
      </PageHeader>

      <Container className="py-10">
        {hasFilters ? (
          <>
            <p className="mb-5 text-sm text-[var(--color-muted-strong)]">
              <span className="font-semibold text-[var(--color-foreground)]">{filtered.length}</span>{" "}
              {filtered.length === 1 ? tCommon("result") : tCommon("results")}
            </p>
            {filtered.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-[var(--color-muted)]" />
                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{tCommon("noResults")}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{tCommon("tryDifferentFilters")}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((v) => (
                  <StadiumCard key={v.id} venue={v} labels={labels} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-12">
            {orderedCountries.map((c) => (
              <section key={c.code}>
                <header className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
                    <span className="mr-2 text-2xl">{c.flag}</span>
                    {c.name}
                  </h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    {groupedAll[c.code].length} {groupedAll[c.code].length === 1 ? tCommon("result") : tCommon("results")}
                  </span>
                </header>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedAll[c.code].map((v) => (
                    <StadiumCard key={v.id} venue={v} labels={labels} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
