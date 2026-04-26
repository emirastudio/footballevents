"use client";

import { useEffect, useState } from "react";
import { Combobox, type ComboboxItem } from "./Combobox";

type Props = {
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** ISO 3166-1 alpha-2 — when set, results are restricted to this country. */
  countryCode?: string;
  defaultValue?: string;
};

export function CityCombobox({ name, label, hint, error, required, countryCode, defaultValue }: Props) {
  const [items, setItems] = useState<ComboboxItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!query || query.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        if (countryCode) params.set("country", countryCode);
        const res = await fetch(`/api/search/cities?${params.toString()}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: { name: string; country: string; flag: string; slug: string }[] };
        setItems(
          data.items.map((c) => ({
            value: c.name,
            label: c.name,
            prefix: c.flag,
            hint: c.country,
          })),
        );
      } catch {
        // ignore aborted
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [query, countryCode]);

  return (
    <Combobox
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      placeholder={countryCode ? "Type city name…" : "Pick a country first"}
      defaultValue={defaultValue}
      items={items}
      onSearch={(q) => setQuery(q)}
      searching={searching}
      notFoundLabel="No cities found"
    />
  );
}
