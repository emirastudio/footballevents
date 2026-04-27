"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveVenueAction, type VenueFormState } from "@/app/actions/venue";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";

type Country = { code: string; name: string; flag: string };

export type VenueLabels = {
  name: string;
  country: string;
  city: string;
  address: string;
  capacity: string;
  surfaceType: string;
  surfaceGrass: string;
  surfaceArtificial: string;
  surfaceHybrid: string;
  surfaceIndoor: string;
  website: string;
  isStadium: string;
  isStadiumHint: string;
  submit: string;
  saving: string;
  errors: Record<string, string>;
};

export type VenueDefaults = {
  id?: string;
  name?: string;
  countryCode?: string;
  city?: string;
  address?: string;
  capacity?: number;
  surfaceType?: string;
  website?: string;
  isStadium?: boolean;
};

export function VenueForm({
  countries,
  defaults,
  labels,
}: {
  countries: Country[];
  defaults?: VenueDefaults;
  labels: VenueLabels;
}) {
  const [state, action] = useActionState<VenueFormState, FormData>(saveVenueAction, null);
  const [countryCode, setCountryCode] = useState<string>(defaults?.countryCode ?? "");
  const fe = state?.fieldErrors ?? {};
  const errMsg = (k?: string) => k ? labels.errors[k] ?? k : undefined;

  return (
    <form action={action} className="space-y-5">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      <Field name="name" required label={labels.name} error={errMsg(fe.name)} defaultValue={defaults?.name} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Combobox
          name="countryCode"
          required
          label={labels.country}
          error={errMsg(fe.countryCode)}
          defaultValue={defaults?.countryCode}
          items={countries.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))}
          onValueChange={setCountryCode}
        />
        <CityCombobox name="city" label={labels.city} countryCode={countryCode} defaultValue={defaults?.city} />
      </div>

      <Field name="address" label={labels.address} defaultValue={defaults?.address} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="capacity" type="number" label={labels.capacity} placeholder="50000" defaultValue={defaults?.capacity?.toString()} />
        <SelectField
          name="surfaceType"
          label={labels.surfaceType}
          defaultValue={defaults?.surfaceType ?? ""}
          options={[
            { value: "",            label: "—" },
            { value: "grass",       label: labels.surfaceGrass },
            { value: "artificial",  label: labels.surfaceArtificial },
            { value: "hybrid",      label: labels.surfaceHybrid },
            { value: "indoor",      label: labels.surfaceIndoor },
          ]}
        />
      </div>

      <Field name="website" type="url" label={labels.website} placeholder="https://…" defaultValue={defaults?.website} />

      <label className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 text-sm">
        <input type="checkbox" name="isStadium" defaultChecked={defaults?.isStadium ?? false} className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)]" />
        <span>
          <span className="block font-semibold text-[var(--color-foreground)]">{labels.isStadium}</span>
          <span className="text-xs text-[var(--color-muted)]">{labels.isStadiumHint}</span>
        </span>
      </label>

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitBtn label={labels.submit} loadingLabel={labels.saving} />
    </form>
  );
}

function Field({
  name, label, required, error, defaultValue, type, placeholder,
}: {
  name: string; label: string; required?: boolean; error?: string;
  defaultValue?: string; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name} type={type ?? "text"} required={required}
        defaultValue={defaultValue} placeholder={placeholder}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  name, label, options, defaultValue,
}: {
  name: string; label: string; defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <select name={name} defaultValue={defaultValue}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      >
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </label>
  );
}

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="md" disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  );
}
