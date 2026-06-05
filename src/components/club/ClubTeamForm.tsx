"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createClubTeamAction,
  updateClubTeamAction,
  type ClubTeamFormState,
} from "@/app/actions/clubTeam";
import { Button } from "@/components/ui/Button";

// Suggested values for the picker. Free string lets clubs type custom (e.g. "Veterans 35+")
// but the dropdown covers ~95% of cases. Aligned with Event.ageGroups conventions.
const AGE_PRESETS = ["U-9", "U-11", "U-13", "U-15", "U-17", "U-19", "U-21", "Adult", "Veterans"];
const FORMAT_PRESETS = ["5x5", "7x7", "8x8", "9x9", "11x11"];

type Labels = {
  name: string; nameHint: string;
  ageGroup: string; ageGroupHint: string;
  gender: string; format: string; formatHint: string;
  skillLevel: string;
  skillAmateur: string; skillSemi: string; skillPro: string; skillAll: string;
  genderMale: string; genderFemale: string; genderMixed: string;
  birthYears: string; birthYearsHint: string; birthYearFromPlaceholder: string; birthYearToPlaceholder: string;
  notes: string; notesHint: string;
  submitCreate: string; submitEdit: string; loading: string;
  saved: string;
};

type Defaults = {
  name: string;
  ageGroup: string;
  gender: "MALE" | "FEMALE" | "MIXED";
  format: string;
  skillLevel: "AMATEUR" | "SEMI_PRO" | "PROFESSIONAL" | "ALL_LEVELS";
  birthYearFrom: string;
  birthYearTo: string;
  notes: string;
};

function SubmitBtn({ labels, mode }: { labels: Labels; mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? labels.loading : mode === "create" ? labels.submitCreate : labels.submitEdit}
    </Button>
  );
}

export function ClubTeamForm({
  mode,
  teamId,
  defaults,
  labels,
}: {
  mode: "create" | "edit";
  teamId?: string;
  defaults: Defaults;
  labels: Labels;
}) {
  // Bind teamId into the update action server-side so the form only POSTs (prev, formData).
  const editAction = teamId ? updateClubTeamAction.bind(null, teamId) : null;
  const [state, action] = useActionState<ClubTeamFormState, FormData>(
    mode === "edit" && editAction ? editAction : createClubTeamAction,
    null,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state?.ok && mode === "edit" && (
        <p className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {labels.saved}
        </p>
      )}

      <Field
        name="name" required
        label={labels.name} hint={labels.nameHint}
        defaultValue={defaults.name}
        placeholder="U-13 «A»"
        error={fe.name}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <DatalistField
          name="ageGroup" required
          label={labels.ageGroup} hint={labels.ageGroupHint}
          defaultValue={defaults.ageGroup}
          placeholder="U-13"
          options={AGE_PRESETS}
          error={fe.ageGroup}
        />
        <DatalistField
          name="format"
          label={labels.format} hint={labels.formatHint}
          defaultValue={defaults.format}
          placeholder="8x8"
          options={FORMAT_PRESETS}
          error={fe.format}
        />
        <SelectField
          name="gender"
          label={labels.gender}
          defaultValue={defaults.gender}
          options={[
            { value: "MIXED", label: labels.genderMixed },
            { value: "MALE", label: labels.genderMale },
            { value: "FEMALE", label: labels.genderFemale },
          ]}
          error={fe.gender}
        />
      </div>

      <SelectField
        name="skillLevel"
        label={labels.skillLevel}
        defaultValue={defaults.skillLevel}
        options={[
          { value: "ALL_LEVELS", label: labels.skillAll },
          { value: "AMATEUR", label: labels.skillAmateur },
          { value: "SEMI_PRO", label: labels.skillSemi },
          { value: "PROFESSIONAL", label: labels.skillPro },
        ]}
        error={fe.skillLevel}
      />

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.birthYears}</legend>
        <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.birthYearsHint}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="birthYearFrom"
            type="number"
            placeholder={labels.birthYearFromPlaceholder}
            defaultValue={defaults.birthYearFrom}
            error={fe.birthYearFrom}
          />
          <Field
            name="birthYearTo"
            type="number"
            placeholder={labels.birthYearToPlaceholder}
            defaultValue={defaults.birthYearTo}
            error={fe.birthYearTo}
          />
        </div>
      </fieldset>

      <TextareaField
        name="notes"
        label={labels.notes}
        hint={labels.notesHint}
        defaultValue={defaults.notes}
        rows={3}
        error={fe.notes}
      />

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitBtn labels={labels} mode={mode} />
      </div>
    </form>
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

// Native datalist — free text + suggested options, no extra JS, works on mobile.
function DatalistField({
  name, label, hint, required, error, defaultValue, placeholder, options,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; placeholder?: string; options: string[];
}) {
  const listId = `dl-${name}`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        type="text"
        list={listId}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

function SelectField({
  name, label, required, error, defaultValue, options,
}: {
  name: string; label: string; required?: boolean; error?: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function TextareaField({
  name, label, hint, error, defaultValue, rows = 3,
}: {
  name: string; label: string; hint?: string; error?: string;
  defaultValue?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
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
