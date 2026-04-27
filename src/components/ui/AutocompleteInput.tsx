"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type Suggestion = {
  /** Value placed into the input on select. */
  value: string;
  /** Primary line in the dropdown. */
  label: string;
  /** Optional secondary line (e.g. country, postcode). */
  hint?: string;
  /** Optional leading visual (flag, dot). */
  prefix?: React.ReactNode;
  /** Extra fields the parent may want when an item is picked. */
  meta?: Record<string, unknown>;
};

type Props = {
  /** Form-field name — value submitted is the input text. */
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  /** External lookup. Should return up to ~10 items. */
  onSearch: (q: string) => Promise<Suggestion[]>;
  /** Min chars before searching. */
  minChars?: number;
  /** Debounce ms. */
  debounceMs?: number;
  /** Called when a suggestion is selected. */
  onSelect?: (s: Suggestion) => void;
  /** Footer rendered when there are no matches but the user has typed something. */
  emptyFooter?: (q: string) => React.ReactNode;
  /** Disable browser autocomplete (off by default — set "on" / "address-line1" if you do want it). */
  autoComplete?: string;
};

export function AutocompleteInput({
  name, label, hint, error, required, placeholder, defaultValue,
  onSearch, minChars = 2, debounceMs = 250, onSelect, emptyFooter, autoComplete = "off",
}: Props) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Search effect
  useEffect(() => {
    if (value.trim().length < minChars) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const results = await onSearch(value.trim());
        if (!ctrl.signal.aborted) setItems(results);
      } catch {
        // ignore
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, debounceMs);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [value, minChars, debounceMs, onSearch]);

  // Click-outside to close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(s: Suggestion) {
    setValue(s.value);
    setOpen(false);
    onSelect?.(s);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); setOpen(true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && open && items[activeIdx]) { e.preventDefault(); pick(items[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  const showFooter = !loading && items.length === 0 && value.trim().length >= minChars && emptyFooter;

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </label>
      )}
      <div className={`flex items-center rounded-[var(--radius-md)] border bg-[var(--color-surface)] transition focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus-within:border-[var(--color-pitch-500)]"}`}>
        <input
          name={name}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
        />
        {loading && <Loader2 className="mr-3 h-4 w-4 animate-spin text-[var(--color-muted)]" />}
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}

      {open && (items.length > 0 || showFooter) && (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md)]">
          {items.map((s, i) => (
            <li key={`${s.value}:${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex w-full items-start gap-3 px-3 py-2 text-left text-sm transition ${i === activeIdx ? "bg-[var(--color-pitch-50)]" : "hover:bg-[var(--color-bg-muted)]"}`}
              >
                {s.prefix && <span className="shrink-0">{s.prefix}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[var(--color-foreground)]">{s.label}</span>
                  {s.hint && <span className="block truncate text-xs text-[var(--color-muted)]">{s.hint}</span>}
                </span>
              </button>
            </li>
          ))}
          {showFooter && (
            <li className="border-t border-[var(--color-border)] px-3 py-2">
              {emptyFooter!(value.trim())}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
