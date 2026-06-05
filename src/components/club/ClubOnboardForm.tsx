"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClubAction, type ClubFormState } from "@/app/actions/club";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";

type Labels = {
  name: string; nameHint: string;
  slug: string; slugHint: string;
  country: string; city: string;
  foundedYear: string; foundedYearHint: string;
  englishSection: string; englishSectionHint: string;
  secondSection: string; secondSectionHint: string;
  secondLanguagePicker: string;
  taglineEn: string; aboutEn: string;
  taglineSecond: string; aboutSecond: string;
  taglineHint: string; aboutHint: string;
  logoUrl: string; coverUrl: string;
  website: string; phone: string;
  submit: string; loading: string;
  langRu: string; langDe: string; langEs: string; langNone: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function ClubOnboardForm({
  defaultName,
  defaultSecondLocale,
  countries,
  labels,
}: {
  defaultName: string;
  defaultSecondLocale: "" | "ru" | "de" | "es";
  countries: { code: string; name: string; flag: string }[];
  labels: Labels;
}) {
  const [countryCode, setCountryCode] = useState<string>("");
  const [state, action] = useActionState<ClubFormState, FormData>(createClubAction, null);
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(slugify(defaultName));
  const [slugTouched, setSlugTouched] = useState(false);
  const [secondLocale, setSecondLocale] = useState<string>(defaultSecondLocale);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <Field
        name="name" required label={labels.name} hint={labels.nameHint}
        value={name} onChange={(e) => setName(e.target.value)}
        error={fe.name}
      />
      <Field
        name="slug" required label={labels.slug} hint={labels.slugHint}
        value={slug}
        onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
        error={fe.slug}
        prefix="footballevents.eu/club/"
      />

      <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
        <Combobox
          name="countryCode"
          required
          label={labels.country}
          placeholder="—"
          error={fe.countryCode}
          items={countries.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))}
          onValueChange={setCountryCode}
        />
        <CityCombobox
          name="city"
          label={labels.city}
          countryCode={countryCode}
          error={fe.city}
        />
      </div>

      <Field
        name="foundedYear" label={labels.foundedYear} hint={labels.foundedYearHint}
        placeholder="2008" type="number" error={fe.foundedYear}
      />

      <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
        <legend className="px-2">
          <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.englishSection}</span>
          <span className="ml-2 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">EN</span>
        </legend>
        <p className="text-xs text-[var(--color-muted)]">{labels.englishSectionHint}</p>
        <Field name="taglineEn" required label={labels.taglineEn} hint={labels.taglineHint} maxLength={120} error={fe.taglineEn} />
        <TextareaField name="aboutEn" required label={labels.aboutEn} hint={labels.aboutHint} rows={4} error={fe.aboutEn} />
      </fieldset>

      <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
        <legend className="px-2">
          <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.secondSection}</span>
          <span className="ml-2 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">{secondLocale ? secondLocale.toUpperCase() : "—"}</span>
        </legend>
        <p className="text-xs text-[var(--color-muted)]">{labels.secondSectionHint}</p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.secondLanguagePicker}</span>
          <select
            name="secondLocale"
            value={secondLocale}
            onChange={(e) => setSecondLocale(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          >
            <option value="">{labels.langNone}</option>
            <option value="ru">{labels.langRu}</option>
            <option value="de">{labels.langDe}</option>
            <option value="es">{labels.langEs}</option>
          </select>
        </label>
        {secondLocale && (
          <>
            <Field name="taglineSecond" label={labels.taglineSecond} hint={labels.taglineHint} maxLength={120} error={fe.taglineSecond} />
            <TextareaField name="aboutSecond" label={labels.aboutSecond} hint={labels.aboutHint} rows={4} error={fe.aboutSecond} />
          </>
        )}
      </fieldset>

      <ImageUpload name="logoUrl" kind="organizer-logo" label={labels.logoUrl} />
      <ImageUpload name="coverUrl" kind="organizer-cover" label={labels.coverUrl} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="website" label={labels.website} placeholder="https://…" error={fe.website} />
        <Field name="phone" label={labels.phone} placeholder="+49 …" error={fe.phone} />
      </div>

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitBtn labels={labels} />
    </form>
  );
}

function Field({
  name, label, hint, required, error, value, onChange, maxLength, placeholder, prefix, type,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number; placeholder?: string; prefix?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <div className={`flex rounded-[var(--radius-md)] border bg-[var(--color-surface)] transition focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus-within:border-[var(--color-pitch-500)]"}`}>
        {prefix && (
          <span className="flex items-center border-r border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 text-xs text-[var(--color-muted)]">{prefix}</span>
        )}
        <input
          name={name}
          type={type ?? "text"}
          required={required}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
        />
      </div>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

function TextareaField({
  name, label, hint, required, error, rows = 4,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={rows}
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
