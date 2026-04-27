"use client";

import { AutocompleteInput, type Suggestion } from "./AutocompleteInput";
import { Building2, Plus } from "lucide-react";

type Props = {
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  countryCode?: string;
  /** Called when an existing venue is picked (for the parent to optionally fill the address). */
  onPicked?: (v: { id: string; name: string; address: string | null }) => void;
  /** Localized "Use «{name}»" template — e.g. tw("addNewVenue") returning "Use «{name}» — we'll add it". */
  newLabelTemplate?: string;
};

export function VenueAutocomplete({
  name, label, hint, error, required, placeholder, defaultValue, countryCode, onPicked,
  newLabelTemplate = "Use «{name}» — we'll create it",
}: Props) {
  async function search(q: string): Promise<Suggestion[]> {
    const params = new URLSearchParams({ q });
    if (countryCode) params.set("country", countryCode);
    const res = await fetch(`/api/search/venues?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items: { id: string; slug: string; name: string; address: string | null; countryCode: string; capacity: number | null }[] };
    return data.items.map((v) => ({
      value: v.name,
      label: v.name,
      hint: [v.address, v.capacity ? `${v.capacity.toLocaleString()} cap.` : null].filter(Boolean).join(" · "),
      prefix: <Building2 className="mt-0.5 h-4 w-4 text-[var(--color-muted)]" />,
      meta: { id: v.id, address: v.address, slug: v.slug },
    }));
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
      onSelect={(s) => {
        const m = s.meta as { id?: string; address?: string | null } | undefined;
        if (m?.id) onPicked?.({ id: m.id, name: s.value, address: m.address ?? null });
      }}
      emptyFooter={(q) => (
        <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-pitch-700)]">
          <Plus className="h-3.5 w-3.5" />
          {newLabelTemplate.replace("{name}", q)}
        </span>
      )}
    />
  );
}
