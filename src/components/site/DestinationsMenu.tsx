// Header dropdown that exposes pSEO city/country hubs as internal links.
// Pure server component, CSS-hover only — no client JS, no JS bundle cost.
//
// Why it matters for SEO:
// - Surfaces hub URLs from EVERY page (huge crawl reach)
// - Anchor text is the localized country/city name = relevance signal
// - Linking from the global header concentrates link equity onto hubs

import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { ChevronDown, Globe2, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { findCountry, getCountries } from "@/lib/countries";

type Hub = { href: string; label: string; count: number; flag?: string };

const TOP_COUNTRIES = 12;
const TOP_CITIES = 12;

async function loadHubs(locale: string): Promise<{ countries: Hub[]; cities: Hub[] }> {
  const where = process.env.HIDE_DEMO === "1"
    ? { status: "PUBLISHED" as const, isDemo: false }
    : { status: "PUBLISHED" as const };

  try {
    const [countryRows, cityRows] = await Promise.all([
      db.event.groupBy({
        by: ["countryCode"],
        where: { ...where, countryCode: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: TOP_COUNTRIES,
      }),
      db.city.findMany({
        where: { events: { some: where } },
        select: {
          slug: true,
          nameEn: true,
          countryCode: true,
          _count: { select: { events: { where } } },
        },
        orderBy: { events: { _count: "desc" } },
        take: TOP_CITIES,
      }),
    ]);

    const countryNames = new Map(getCountries(locale).map((c) => [c.code, c.name]));

    const countries: Hub[] = countryRows
      .filter((r): r is typeof r & { countryCode: string } => !!r.countryCode)
      .map((r) => {
        const c = findCountry(r.countryCode);
        return {
          href: `/events/country/${r.countryCode.toLowerCase()}`,
          label: countryNames.get(r.countryCode) ?? c?.name ?? r.countryCode,
          count: r._count._all,
          flag: c?.flag,
        };
      });

    const cities: Hub[] = cityRows.map((c) => ({
      href: `/events/city/${c.slug}`,
      label: c.nameEn,
      count: c._count.events,
      flag: findCountry(c.countryCode)?.flag,
    }));

    return { countries, cities };
  } catch {
    return { countries: [], cities: [] };
  }
}

export async function DestinationsMenu({
  label,
  byCountryLabel,
  byCityLabel,
  viewAllLabel,
}: {
  label: string;
  byCountryLabel: string;
  byCityLabel: string;
  viewAllLabel: string;
}) {
  const locale = await getLocale();
  const { countries, cities } = await loadHubs(locale);

  if (countries.length === 0 && cities.length === 0) {
    // Nothing to surface — fall back to plain link
    return (
      <Link
        href="/events"
        className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)] group-hover:bg-[var(--color-surface-muted)] group-hover:text-[var(--color-foreground)]"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" aria-hidden />
      </Link>
      {/* Invisible bridge to avoid hover-flicker between trigger and panel */}
      <div className="pointer-events-none absolute left-0 right-0 top-full h-3 group-hover:pointer-events-auto" aria-hidden />

      {/* Panel — hidden by default, shown via group-hover. Also keep open on focus-within for keyboard users. */}
      <div
        role="menu"
        aria-label={label}
        className="invisible absolute left-0 top-[calc(100%+12px)] z-50 w-[640px] -translate-y-1 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
          <div className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
            {/* Countries column */}
            <div className="bg-[var(--color-surface)] p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <Globe2 className="h-3 w-3" />
                {byCountryLabel}
              </div>
              <ul className="space-y-0.5">
                {countries.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        {c.flag && <span className="text-base leading-none">{c.flag}</span>}
                        <span className="truncate">{c.label}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-muted-strong)]">
                        {c.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cities column */}
            <div className="bg-[var(--color-surface)] p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <MapPin className="h-3 w-3" />
                {byCityLabel}
              </div>
              <ul className="space-y-0.5">
                {cities.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        {c.flag && <span className="text-base leading-none">{c.flag}</span>}
                        <span className="truncate">{c.label}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-muted-strong)]">
                        {c.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer — link to full events listing */}
          <Link
            href="/events"
            className="flex items-center justify-center gap-1 border-t border-[var(--color-border)] bg-[var(--color-bg-muted)] py-2.5 text-xs font-semibold text-[var(--color-pitch-700)] hover:bg-[var(--color-pitch-50)]"
          >
            {viewAllLabel}
            <ChevronDown className="h-3 w-3 -rotate-90" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
