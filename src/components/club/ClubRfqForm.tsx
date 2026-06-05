"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createRfqAction, type RfqFormState } from "@/app/actions/rfq";
import { Button } from "@/components/ui/Button";

const AGE_PRESETS = ["U-9", "U-11", "U-13", "U-15", "U-17", "U-19", "U-21", "Adult", "Veterans"];
const FORMAT_PRESETS = ["5x5", "7x7", "8x8", "9x9", "11x11"];

type Country = { code: string; name: string; flag: string };
type Team = { id: string; name: string; ageGroup: string };

type Labels = {
  eventType: string; eventTypeHint: string;
  team: string; teamHint: string; teamNone: string;
  audience: string;
  ageGroup: string; format: string;
  skillLevel: string;
  skillAmateur: string; skillSemi: string; skillPro: string; skillAll: string;
  gender: string; genderAny: string;
  genderMale: string; genderFemale: string; genderMixed: string;
  whereWhen: string;
  targetCountries: string; targetCountriesHint: string;
  targetRegion: string; targetRegionHint: string;
  dateFrom: string; dateTo: string;
  durationDays: string; durationDaysHint: string;
  budget: string;
  budgetAmount: string; budgetAmountHint: string;
  currency: string;
  details: string;
  comment: string; commentHint: string;
  submit: string; submitting: string;
  eventTypes: Record<string, string>;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? labels.submitting : labels.submit}
    </Button>
  );
}

const EVENT_TYPES = [
  "TOURNAMENT", "CAMP", "FESTIVAL", "MASTERCLASS", "MATCH_TOUR",
  "TRAINING_CAMP", "TRYOUT", "SHOWCASE", "CLINIC",
];

export function ClubRfqForm({
  countries,
  teams,
  labels,
}: {
  countries: Country[];
  teams: Team[];
  labels: Labels;
}) {
  const [state, action] = useActionState<RfqFormState, FormData>(createRfqAction, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6">
      <Section title={labels.eventType} subtitle={labels.eventTypeHint}>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t, i) => (
            <label
              key={t}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]"
            >
              <input type="radio" name="eventType" value={t} defaultChecked={i === 0} required className="sr-only" />
              {labels.eventTypes[t] ?? t}
            </label>
          ))}
        </div>
        {fe.eventType && <p className="mt-1 text-xs text-red-600">{fe.eventType}</p>}
      </Section>

      {teams.length > 0 && (
        <Section title={labels.team} subtitle={labels.teamHint}>
          <select
            name="teamId"
            defaultValue=""
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          >
            <option value="">{labels.teamNone}</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>{tm.name} — {tm.ageGroup}</option>
            ))}
          </select>
        </Section>
      )}

      <Section title={labels.audience}>
        <div className="grid gap-4 sm:grid-cols-4">
          <DatalistField name="ageGroup" label={labels.ageGroup} options={AGE_PRESETS} placeholder="U-13" />
          <DatalistField name="format" label={labels.format} options={FORMAT_PRESETS} placeholder="8x8" />
          <SelectField
            name="skillLevel"
            label={labels.skillLevel}
            options={[
              { value: "", label: "—" },
              { value: "ALL_LEVELS", label: labels.skillAll },
              { value: "AMATEUR", label: labels.skillAmateur },
              { value: "SEMI_PRO", label: labels.skillSemi },
              { value: "PROFESSIONAL", label: labels.skillPro },
            ]}
          />
          <SelectField
            name="gender"
            label={labels.gender}
            options={[
              { value: "", label: labels.genderAny },
              { value: "MIXED", label: labels.genderMixed },
              { value: "MALE", label: labels.genderMale },
              { value: "FEMALE", label: labels.genderFemale },
            ]}
          />
        </div>
      </Section>

      <Section title={labels.whereWhen}>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.targetCountries}</p>
          <p className="mb-2 text-xs text-[var(--color-muted)]">{labels.targetCountriesHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {countries.map((c) => (
              <label
                key={c.code}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]"
              >
                <input type="checkbox" name="targetCountries" value={c.code} className="sr-only" />
                <span>{c.flag}</span> {c.name}
              </label>
            ))}
          </div>
        </div>
        <Field name="targetRegion" label={labels.targetRegion} hint={labels.targetRegionHint} placeholder="Northern Europe" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="dateFrom" type="date" label={labels.dateFrom} error={fe.dateFrom} />
          <Field name="dateTo" type="date" label={labels.dateTo} error={fe.dateTo} />
          <Field name="durationDays" type="number" label={labels.durationDays} hint={labels.durationDaysHint} placeholder="3" error={fe.durationDays} />
        </div>
      </Section>

      <Section title={labels.budget}>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field
            name="budgetPerTeamCents"
            type="number"
            label={labels.budgetAmount}
            hint={labels.budgetAmountHint}
            placeholder="80000"
            error={fe.budgetPerTeamCents}
          />
          <SelectField
            name="currency"
            label={labels.currency}
            options={[
              { value: "", label: "—" },
              { value: "EUR", label: "EUR (€)" },
              { value: "USD", label: "USD ($)" },
              { value: "GBP", label: "GBP (£)" },
              { value: "RUB", label: "RUB (₽)" },
            ]}
          />
        </div>
      </Section>

      <Section title={labels.details}>
        <TextareaField name="comment" label={labels.comment} hint={labels.commentHint} rows={4} error={fe.comment} />
      </Section>

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <SubmitBtn labels={labels} />
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <legend className="px-2 text-sm font-bold text-[var(--color-foreground)]">{title}</legend>
      {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
      {children}
    </fieldset>
  );
}

function Field({
  name, label, hint, required, error, defaultValue, placeholder, type,
}: {
  name: string; label?: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      )}
      <input
        name={name}
        type={type ?? "text"}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

function DatalistField({
  name, label, options, placeholder, defaultValue,
}: {
  name: string; label: string; options: string[]; placeholder?: string; defaultValue?: string;
}) {
  const listId = `dl-${name}`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        list={listId}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </label>
  );
}

function SelectField({
  name, label, defaultValue, options,
}: {
  name: string; label: string; defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TextareaField({
  name, label, hint, error, defaultValue, rows = 3,
}: {
  name: string; label: string; hint?: string; error?: string; defaultValue?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        maxLength={500}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
