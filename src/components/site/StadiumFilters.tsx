"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";
import { countries } from "@/lib/mock-data";

type Labels = {
  search: string;
  searchPlaceholder: string;
  filterByCountry: string;
  allCountries: string;
  reset: string;
};

export function StadiumFilters({ labels }: { labels: Labels }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const q       = params.get("q") ?? "";
  const country = params.get("country") ?? "";

  function update(key: "q" | "country", value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value); else sp.delete(key);
    startTransition(() => { router.replace(`${pathname}?${sp.toString()}`); });
  }

  function reset() {
    startTransition(() => { router.replace(pathname); });
  }

  const hasFilters = !!q || !!country;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center sm:p-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          value={q}
          onChange={(e) => update("q", e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-[var(--radius-md)] border border-transparent bg-[var(--color-surface-muted)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          aria-label={labels.search}
        />
      </div>

      <div className="relative sm:min-w-[220px]">
        <select
          value={country}
          onChange={(e) => update("country", e.target.value)}
          className="w-full appearance-none rounded-[var(--radius-md)] border border-transparent bg-[var(--color-surface-muted)] py-2.5 pl-3 pr-9 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)] hover:border-[var(--color-border)] focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          aria-label={labels.filterByCountry}
        >
          <option value="">{labels.allCountries}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
      </div>

      {hasFilters && (
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
        >
          <X className="h-3.5 w-3.5" />
          {labels.reset}
        </button>
      )}
    </div>
  );
}
