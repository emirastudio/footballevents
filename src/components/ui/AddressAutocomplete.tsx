"use client";

import { useState } from "react";
import { AutocompleteInput, type Suggestion } from "./AutocompleteInput";
import { MapPin } from "lucide-react";

type Props = {
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  countryCode?: string;
};

export function AddressAutocomplete({
  name, label, hint, error, required, placeholder, defaultValue, countryCode,
}: Props) {
  // Tiny in-component cache so identical re-keystrokes don't re-fetch.
  const [cache] = useState(() => new Map<string, Suggestion[]>());

  async function search(q: string): Promise<Suggestion[]> {
    const key = `${countryCode ?? ""}|${q.toLowerCase()}`;
    if (cache.has(key)) return cache.get(key)!;
    const params = new URLSearchParams({ q });
    if (countryCode) params.set("country", countryCode);
    const res = await fetch(`/api/search/address?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items: { label: string; full: string; street: string; city: string; postcode: string; countryCode: string }[];
    };
    const items = data.items.map<Suggestion>((a) => ({
      value: [a.street, a.postcode, a.city].filter(Boolean).join(", ") || a.full,
      label: a.label,
      hint: a.full,
      prefix: <MapPin className="mt-0.5 h-4 w-4 text-[var(--color-muted)]" />,
    }));
    cache.set(key, items);
    return items;
  }

  return (
    <AutocompleteInput
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onSearch={search}
      minChars={3}
      debounceMs={400}
      autoComplete="off"
    />
  );
}
