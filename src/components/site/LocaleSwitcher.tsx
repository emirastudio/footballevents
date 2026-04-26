"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <Globe
        className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-muted)]"
        aria-hidden
      />
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className="appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-4 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        aria-label="Select language"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeFlags[l]} {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
