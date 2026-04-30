import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { parseSearchFilters, filtersToSearchParams, summarizeFilters, filtersToPrismaWhere } from "@/lib/saved-search";
import { getCountries } from "@/lib/countries";
import { categories } from "@/lib/mock-data";
import { SavedSearchRow } from "@/components/site/SavedSearchRow";

export default async function MyAlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/me/alerts");

  const searches = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const t = await getTranslations("alerts");

  // Lookup helpers for human labels
  const countryList = getCountries(locale);
  const countryName = (code: string) =>
    countryList.find((c) => c.code === code)?.name ?? code;
  const categoryName = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? slug : slug;
  };

  // For each search, count how many new events match since lastRun (light query)
  const enriched = await Promise.all(
    searches.map(async (s) => {
      const filters = parseSearchFilters(s.filters as never);
      const summary = summarizeFilters(filters, { countryName, categoryName });
      const sp = filtersToSearchParams(filters);
      const filtersUrl = sp.toString() ? `/events?${sp.toString()}` : "/events";

      let matchedSinceLastRun = 0;
      if (s.lastRun) {
        matchedSinceLastRun = await db.event.count({
          where: filtersToPrismaWhere(filters, {
            status: "PUBLISHED",
            createdAt: { gt: s.lastRun },
          }),
        });
      }

      return {
        id: s.id,
        name: s.name,
        summary,
        filtersUrl,
        isActive: s.isActive,
        lastRunAt: s.lastRun ? s.lastRun.toLocaleDateString(locale) : null,
        matchedSinceLastRun,
      };
    }),
  );

  const labels = {
    pause: t("pause"),
    resume: t("resume"),
    delete: t("delete"),
    deleteConfirm: t("deleteConfirm"),
    open: t("open"),
    paused: t("paused"),
    matchesSinceLastRun: t("matchesSinceLastRun"),
    lastRun: t("lastRun"),
    never: t("never"),
  };

  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-8 flex items-center gap-3">
        <Bell className="h-6 w-6 text-[var(--color-pitch-600)]" />
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--color-muted-strong)]">{t("subtitle")}</p>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <p className="mb-4 text-sm text-[var(--color-muted-strong)]">{t("emptyBody")}</p>
          <Link
            href="/events"
            className="inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]"
          >
            {t("emptyCta")} →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {enriched.map((s) => (
            <SavedSearchRow key={s.id} search={s} labels={labels} />
          ))}
        </ul>
      )}
    </Container>
  );
}
