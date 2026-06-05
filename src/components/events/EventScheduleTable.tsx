// Schedule table for multi-stage events (tournaments with a season calendar).
// Renders when an event has ≥2 divisions that each have a startDate — the
// classic "KCS Cup 2026" use-case where every division is one stage.

import { Link } from "@/i18n/navigation";
import type { MockDivision } from "@/lib/mock-data";
import { formatDateRange, formatPrice } from "@/lib/format";

type Labels = {
  title: string;        // "2026 Year Schedule"
  colDate: string;      // "Date"
  colAgeGroup: string;  // "Age group"
  colFormat: string;    // "Format"
  colEntryFee: string;  // "Entry fee"
  colSpots: string;     // "Spots"
  colRegister: string;  // "Register"
  free: string;
  spotsLeft: string;    // "{n} left" — simple string, no ICU (caller formats)
  full: string;
  noDate: string;
};

// Group divisions by YEAR of their startDate — used when the schedule spans
// multiple calendar years (e.g. autumn–spring season).
function groupByYear(divisions: MockDivision[]): Map<string, MockDivision[]> {
  const map = new Map<string, MockDivision[]>();
  for (const d of divisions) {
    const year = d.startDate
      ? new Date(d.startDate).getFullYear().toString()
      : "—";
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(d);
  }
  return map;
}

export function EventScheduleTable({
  divisions,
  eventSlug,
  locale,
  labels,
}: {
  divisions: MockDivision[];
  eventSlug: string;
  locale: string;
  labels: Labels;
}) {
  // Only show when there are multiple dated divisions — a single division means
  // it's not a multi-stage event, the regular price/date block is enough.
  const dated = divisions.filter((d) => d.startDate);
  if (dated.length < 2) return null;

  const groups = groupByYear(dated);

  return (
    <section className="mt-12">
      {Array.from(groups.entries()).map(([year, rows]) => (
        <div key={year} className="mb-10">
          {/* Section header: "2026 YEAR SCHEDULE" */}
          <div className="mb-4 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-pitch-700)] px-6 py-3 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-xl font-extrabold uppercase tracking-widest text-white">
              {year} {labels.title}
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-pitch-600)]">
                  {[labels.colDate, labels.colAgeGroup, labels.colFormat, labels.colEntryFee].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-white whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                  {/* Spots + Register are optional contextual columns */}
                  <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-white whitespace-nowrap">
                    {labels.colSpots}
                  </th>
                  <th className="w-28 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const isEven = i % 2 === 0;
                  const dateStr = d.startDate
                    ? formatDateRange(d.startDate, d.endDate ?? d.startDate, locale, "day-month")
                    : labels.noDate;
                  const priceStr = d.isFree
                    ? labels.free
                    : d.priceFrom
                    ? formatPrice(d.priceFrom, d.currency, locale)
                    : "—";
                  const isFull = typeof d.spotsLeft === "number" && d.spotsLeft === 0;
                  const spotsLabel =
                    typeof d.spotsLeft === "number"
                      ? isFull
                        ? labels.full
                        : `${d.spotsLeft} ${labels.spotsLeft}`
                      : typeof d.maxTeams === "number"
                      ? `/ ${d.maxTeams}`
                      : "—";

                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-pitch-50)] ${
                        isEven ? "bg-[var(--color-surface)]" : "bg-[var(--color-bg-muted)]"
                      }`}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 text-center font-semibold text-[var(--color-foreground)] whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Age group */}
                      <td className="px-4 py-3 text-center text-[var(--color-foreground)]">
                        {d.ageGroup}
                        {d.name && d.name !== d.ageGroup && (
                          <span className="ml-1 text-xs text-[var(--color-muted)]">· {d.name}</span>
                        )}
                      </td>

                      {/* Format */}
                      <td className="px-4 py-3 text-center text-[var(--color-foreground)] whitespace-nowrap">
                        {d.format || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-center font-semibold text-[var(--color-foreground)] whitespace-nowrap">
                        {priceStr}
                      </td>

                      {/* Spots */}
                      <td
                        className={`px-4 py-3 text-center text-xs whitespace-nowrap ${
                          isFull ? "font-bold text-red-600" : "text-[var(--color-muted-strong)]"
                        }`}
                      >
                        {spotsLabel}
                      </td>

                      {/* Register CTA */}
                      <td className="px-4 py-3 text-right">
                        {isFull ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
                            {labels.full}
                          </span>
                        ) : d.externalUrl ? (
                          <a
                            href={d.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--color-pitch-700)] whitespace-nowrap"
                          >
                            {labels.colRegister}
                          </a>
                        ) : (
                          <Link
                            href={`/events/${eventSlug}/apply?division=${d.id}`}
                            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--color-pitch-700)] whitespace-nowrap"
                          >
                            {labels.colRegister}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
