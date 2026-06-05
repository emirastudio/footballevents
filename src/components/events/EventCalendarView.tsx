// Mini year-calendar for multi-stage events.
// Renders when an event has ≥2 divisions with startDates in the same year.
// Circles/highlights every date that has a tournament stage.
// Pure HTML — no third-party calendar library.

import type { MockDivision } from "@/lib/mock-data";

const MONTH_NAMES: Record<string, string[]> = {
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  ru: ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],
  de: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
  es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
};

const DOW_NAMES: Record<string, string[]> = {
  en: ["M","T","W","T","F","S","S"],
  ru: ["П","В","С","Ч","П","С","В"],
  de: ["M","D","M","D","F","S","S"],
  es: ["L","M","X","J","V","S","D"],
};

// Build a Set of ISO date strings that are "active" (have at least one division).
function buildActiveDates(divisions: MockDivision[]): Set<string> {
  const active = new Set<string>();
  for (const d of divisions) {
    if (!d.startDate) continue;
    const start = new Date(d.startDate);
    const end = d.endDate ? new Date(d.endDate) : start;
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      active.add(cur.toISOString().slice(0, 10));
    }
  }
  return active;
}

function MonthGrid({
  year,
  month,        // 0-based
  active,
  locale,
}: {
  year: number;
  month: number;
  active: Set<string>;
  locale: string;
}) {
  const months = MONTH_NAMES[locale] ?? MONTH_NAMES.en;
  const dows = DOW_NAMES[locale] ?? DOW_NAMES.en;

  // First weekday of the month (0=Sun, shift to 0=Mon)
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {months[month]}
      </p>
      <div className="grid grid-cols-7 gap-0.5">
        {dows.map((d, i) => (
          <div key={i} className="py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isActive = active.has(isoDate);
          const isToday = isoDate === today;
          return (
            <div
              key={i}
              className={`grid aspect-square place-items-center rounded-full text-[11px] font-semibold transition ${
                isActive
                  ? "bg-[var(--color-pitch-600)] text-white"
                  : isToday
                  ? "border border-[var(--color-pitch-300)] text-[var(--color-pitch-700)]"
                  : "text-[var(--color-muted-strong)]"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventCalendarView({
  divisions,
  locale,
  label,
}: {
  divisions: MockDivision[];
  locale: string;
  label: string; // "Tournament calendar"
}) {
  const dated = divisions.filter((d) => d.startDate);
  if (dated.length < 2) return null;

  // Collect all unique (year, month) pairs from divisions so we only
  // render months that contain at least one stage.
  const monthSet = new Set<string>();
  for (const d of dated) {
    const s = new Date(d.startDate!);
    monthSet.add(`${s.getFullYear()}-${s.getMonth()}`);
    if (d.endDate) {
      const e = new Date(d.endDate);
      monthSet.add(`${e.getFullYear()}-${e.getMonth()}`);
    }
  }
  const months = Array.from(monthSet)
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

  const active = buildActiveDates(dated);

  return (
    <section className="mt-12">
      <h2 className="mb-4 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)]">
        {label}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            active={active}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
