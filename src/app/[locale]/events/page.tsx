import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { EventCard } from "@/components/cards/EventCard";
import { EventFilters } from "@/components/site/EventFilters";
import { EventsViewToggle, type MapEventSummary } from "@/components/site/EventsViewToggle";
import { getEvents } from "@/lib/queries";
import { Search } from "lucide-react";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t        = await getTranslations("events");
  const tFilters = await getTranslations("filters");
  const tCommon  = await getTranslations("common");
  const tNav     = await getTranslations("nav");

  const q        = (sp.q as string)?.toLowerCase() ?? "";
  const country  = sp.country as string | undefined;
  const category = sp.category as string | undefined;
  const age      = sp.age as string | undefined;
  const format   = sp.format as string | undefined;
  const gender   = sp.gender as string | undefined;
  const free     = sp.free === "1";
  const priceMax = sp.priceMax ? parseFloat(sp.priceMax as string) : undefined;

  const allEvents = await getEvents(locale);
  const filtered = allEvents.filter((e) => {
    if (q && !`${e.title} ${e.city} ${e.shortDescription}`.toLowerCase().includes(q)) return false;
    if (country  && e.countryCode !== country) return false;
    if (category && e.categorySlug !== category) return false;
    if (age      && !e.ageGroups.includes(age)) return false;
    if (format   && e.format !== format) return false;
    if (gender   && e.gender !== gender) return false;
    if (free     && !e.isFree) return false;
    if (priceMax && e.priceFrom > priceMax) return false;
    return true;
  });

  const categoryNames: Record<string, string> = {
    tournaments: tNav("tournaments"),
    camps: tNav("camps"),
    festivals: tNav("festivals"),
    masterclasses: tNav("masterclasses"),
    "match-tours": tNav("matchTours"),
    showcases: "Showcases",
  };

  const cardLabels = {
    from:     tCommon("from"),
    free:     tCommon("free"),
    premium:  tCommon("premium"),
    featured: tCommon("featured"),
  };

  const filterLabels = {
    filters:  tFilters("title"),
    reset:    tFilters("reset"),
    apply:    tFilters("apply"),
    search:   tCommon("search"),
    country:  tFilters("country"),
    category: tFilters("category"),
    ageGroup: tFilters("ageGroup"),
    format:   tFilters("format"),
    gender:   tFilters("gender"),
    price:    tFilters("price"),
    freeOnly: tFilters("freeOnly"),
    any:      tFilters("any"),
    male:     tFilters("male"),
    female:   tFilters("female"),
    mixed:    tFilters("mixed"),
    from:     tCommon("from"),
    to:       tFilters("to"),
    categoryNames,
  };

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("pageTitle") }]}
      />

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <EventFilters labels={filterLabels} />

          <div>
            <EventsViewToggle
              locale={locale}
              events={filtered.map((e): MapEventSummary => ({
                id:           e.id,
                slug:         e.slug,
                title:        e.title,
                startDate:    e.startDate,
                endDate:      e.endDate ?? "",
                countryCode:  e.countryCode,
                logoUrl:      e.logoUrl,
                categorySlug: e.categorySlug,
                isFeatured:   e.isFeatured,
              }))}
              resultsLabel={
                <p className="text-sm text-[var(--color-muted-strong)]">
                  <span className="font-semibold text-[var(--color-foreground)]">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? tCommon("result") : tCommon("results")}
                </p>
              }
            >
              {filtered.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
                  <Search className="mx-auto mb-4 h-10 w-10 text-[var(--color-muted)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{tCommon("noResults")}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{tCommon("tryDifferentFilters")}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((e) => (
                    <EventCard key={e.id} event={e} locale={locale} labels={cardLabels} />
                  ))}
                </div>
              )}
            </EventsViewToggle>
          </div>
        </div>
      </Container>
    </>
  );
}
