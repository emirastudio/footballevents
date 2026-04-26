"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export type ComboboxItem = {
  value: string;
  label: string;
  prefix?: React.ReactNode;
  hint?: string;
};

type Props = {
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  items: ComboboxItem[];
  /** When provided, called as the user types — for async (city) search. If omitted, items filter locally. */
  onSearch?: (q: string) => void;
  searching?: boolean;
  notFoundLabel?: string;
  /** Fires when user selects (or clears) an item. */
  onValueChange?: (value: string) => void;
};

export function Combobox({
  name, label, hint, error, required, placeholder, defaultValue,
  items, onSearch, searching, notFoundLabel = "No matches", onValueChange,
}: Props) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const initial = items.find((i) => i.value === defaultValue);
  const [selected, setSelected] = useState<ComboboxItem | null>(initial ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // Local filtering when no async search provided
  const filtered = useMemo(() => {
    if (onSearch) return items; // server already filtered
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q));
  }, [items, query, onSearch]);

  useEffect(() => { setActiveIdx(0); }, [query, items]);

  // Click outside to close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(item: ComboboxItem) {
    setSelected(item);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    onValueChange?.(item.value);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    inputRef.current?.focus();
    onValueChange?.("");
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) pick(it);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="block">
      <input type="hidden" name={name} value={selected?.value ?? ""} required={required && !selected} />
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </label>
      )}
      <div className={`relative flex items-center rounded-[var(--radius-md)] border bg-[var(--color-surface)] transition focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus-within:border-[var(--color-pitch-500)]"}`}>
        {selected?.prefix && (
          <span className="pl-3 text-base leading-none">{selected.prefix}</span>
        )}
        {!selected && <Search className="ml-3 h-4 w-4 text-[var(--color-muted)]" />}
        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder={selected ? "" : placeholder}
          value={selected && !open ? selected.label : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
            setOpen(true);
            onSearch?.(e.target.value);
          }}
          onKeyDown={onKey}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
        />
        {selected ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="mr-2 grid h-7 w-7 place-items-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="mr-3 h-4 w-4 text-[var(--color-muted)]" />
        )}
      </div>
      {open && (
        <div className="relative">
          <ul
            role="listbox"
            className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md)]"
          >
            {searching && (
              <li className="px-3 py-2 text-xs text-[var(--color-muted)]">Searching…</li>
            )}
            {!searching && filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-[var(--color-muted)]">{notFoundLabel}</li>
            )}
            {filtered.map((it, idx) => (
              <li key={it.value}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => pick(it)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    idx === activeIdx ? "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]" : "text-[var(--color-foreground)]"
                  }`}
                >
                  {it.prefix && <span className="text-base leading-none">{it.prefix}</span>}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="text-xs text-[var(--color-muted)]">{it.hint}</span>}
                  {selected?.value === it.value && <Check className="h-4 w-4 text-[var(--color-pitch-600)]" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </div>
  );
}
