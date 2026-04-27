"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

export type LocaleCode = "en" | "ru" | "de" | "es";

const ALL_LOCALES: readonly LocaleCode[] = ["en", "ru", "de", "es"];

export type LangTabsLabels = {
  /** Section label rendered above the tabs (e.g. "Content language"). Optional. */
  heading?: string;
  /** "+ Add language" button. */
  addLanguage: string;
  /** Localized labels for each language code. */
  langs: Record<LocaleCode, string>;
};

type ControlledProps = {
  /** Currently picked second locale; "" means EN only. */
  secondLocale: "" | Exclude<LocaleCode, "en">;
  /** Optional setter — when provided, an "+ Add language" button appears + a remove button on the second tab. Omit for read-only contexts (e.g. wizard step 5 — locale was set on step 1). */
  onSecondLocaleChange?: (l: "" | Exclude<LocaleCode, "en">) => void;
};

type Props = ControlledProps & {
  /** When set, a hidden input with this name carries the second-locale value to the form action. */
  hiddenInputName?: string;
  labels: LangTabsLabels;
  /** Render each locale's panel. Receives active locale + the list of currently visible locales. */
  children: (ctx: { active: LocaleCode; visible: LocaleCode[] }) => React.ReactNode;
};

export function LangTabs({
  secondLocale, onSecondLocaleChange, hiddenInputName, labels, children,
}: Props) {
  const [active, setActive] = useState<LocaleCode>("en");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const visible: LocaleCode[] = ["en", ...(secondLocale ? [secondLocale] : [])];

  // If second locale was just removed and was active, snap back to EN.
  useEffect(() => {
    if (!visible.includes(active)) setActive("en");
  }, [visible, active]);

  // Close picker on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const remaining = ALL_LOCALES.filter((l) => l !== "en" && !visible.includes(l));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] pb-3">
        {labels.heading && (
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.heading}
          </span>
        )}

        <div className="inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-muted)] p-1">
          {visible.map((l) => {
            const isActive = active === l;
            const isSecond = l !== "en";
            return (
              <div key={l} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActive(l)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-[var(--color-pitch-500)] text-white shadow-[var(--shadow-xs)]"
                      : "text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {l}
                </button>
                {isSecond && onSecondLocaleChange && (
                  <button
                    type="button"
                    onClick={() => onSecondLocaleChange("")}
                    aria-label="Remove language"
                    className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add-language picker — only when controlled & no second locale set yet */}
        {onSecondLocaleChange && !secondLocale && remaining.length > 0 && (
          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
            >
              <Plus className="h-3 w-3" />
              {labels.addLanguage}
            </button>
            {pickerOpen && (
              <ul className="absolute left-0 top-full z-30 mt-1 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md)]">
                {remaining.map((l) => (
                  <li key={l}>
                    <button
                      type="button"
                      onClick={() => {
                        onSecondLocaleChange(l as Exclude<LocaleCode, "en">);
                        setPickerOpen(false);
                        setActive(l);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-[var(--color-pitch-50)]"
                    >
                      <span className="text-[var(--color-foreground)]">{labels.langs[l]}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{l}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {hiddenInputName && <input type="hidden" name={hiddenInputName} value={secondLocale} />}

      {children({ active, visible })}
    </div>
  );
}

/** Wrap fields inside this; visible only when its `locale` matches the tab's active locale. */
export function LangPanel({
  locale, active, children,
}: {
  locale: LocaleCode; active: LocaleCode; children: React.ReactNode;
}) {
  // Keep both DOM trees mounted so user-typed state survives tab switches.
  return <div className={locale === active ? "block space-y-4" : "hidden"}>{children}</div>;
}
