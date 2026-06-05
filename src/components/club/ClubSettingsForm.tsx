"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateClubSettingsAction, type ClubSettingsState } from "@/app/actions/club";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";

type Labels = {
  saved: string;
  basicsSection: string;
  name: string; legalName: string;
  email: string; phone: string; website: string;
  country: string; city: string; foundedYear: string;
  englishSection: string; secondSection: string;
  secondLanguagePicker: string;
  taglineEn: string; aboutEn: string;
  taglineSecond: string; aboutSecond: string;
  taglineHint: string; aboutHint: string;
  logoUrl: string; coverUrl: string;
  socialsSection: string;
  instagram: string; facebook: string; xTwitter: string; tiktok: string; youtube: string; whatsapp: string;
  submit: string; loading: string;
  langRu: string; langDe: string; langEs: string; langNone: string;
};

type Defaults = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  countryCode: string;
  city: string;
  foundedYear: string;
  logoUrl: string;
  coverUrl: string;
  taglineEn: string;
  aboutEn: string;
  secondLocale: "" | "ru" | "de" | "es";
  taglineSecond: string;
  aboutSecond: string;
  instagramUrl: string;
  facebookUrl: string;
  xUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  whatsappUrl: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function ClubSettingsForm({
  defaults,
  countries,
  labels,
}: {
  defaults: Defaults;
  countries: { code: string; name: string; flag: string }[];
  labels: Labels;
}) {
  const [state, action] = useActionState<ClubSettingsState, FormData>(updateClubSettingsAction, null);
  const [countryCode, setCountryCode] = useState<string>(defaults.countryCode);
  const [secondLocale, setSecondLocale] = useState<string>(defaults.secondLocale);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-6">
      {state?.ok && (
        <p className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {labels.saved}
        </p>
      )}

      <Section title={labels.basicsSection}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" required label={labels.name} defaultValue={defaults.name} error={fe.name} />
          <Field name="legalName" label={labels.legalName} defaultValue={defaults.legalName} error={fe.legalName} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="email" type="email" label={labels.email} defaultValue={defaults.email} error={fe.email} />
          <Field name="phone" label={labels.phone} defaultValue={defaults.phone} error={fe.phone} />
        </div>
        <Field name="website" label={labels.website} defaultValue={defaults.website} placeholder="https://…" error={fe.website} />
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_140px]">
          <Combobox
            name="countryCode"
            label={labels.country}
            placeholder="—"
            error={fe.countryCode}
            defaultValue={defaults.countryCode}
            items={countries.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))}
            onValueChange={setCountryCode}
          />
          <CityCombobox
            name="city"
            label={labels.city}
            countryCode={countryCode}
            defaultValue={defaults.city}
            error={fe.city}
          />
          <Field name="foundedYear" type="number" label={labels.foundedYear} defaultValue={defaults.foundedYear} error={fe.foundedYear} />
        </div>
      </Section>

      <Section title={labels.englishSection}>
        <Field name="taglineEn" required label={labels.taglineEn} hint={labels.taglineHint} maxLength={120} defaultValue={defaults.taglineEn} error={fe.taglineEn} />
        <TextareaField name="aboutEn" required label={labels.aboutEn} hint={labels.aboutHint} rows={5} defaultValue={defaults.aboutEn} error={fe.aboutEn} />
      </Section>

      <Section title={labels.secondSection}>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.secondLanguagePicker}
          </span>
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
            <Field name="taglineSecond" label={labels.taglineSecond} hint={labels.taglineHint} maxLength={120} defaultValue={defaults.taglineSecond} error={fe.taglineSecond} />
            <TextareaField name="aboutSecond" label={labels.aboutSecond} hint={labels.aboutHint} rows={5} defaultValue={defaults.aboutSecond} error={fe.aboutSecond} />
          </>
        )}
      </Section>

      <Section title={labels.logoUrl}>
        <ImageUpload name="logoUrl" kind="organizer-logo" label={labels.logoUrl} defaultUrl={defaults.logoUrl} />
        <ImageUpload name="coverUrl" kind="organizer-cover" label={labels.coverUrl} defaultUrl={defaults.coverUrl} />
      </Section>

      <Section title={labels.socialsSection}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="instagramUrl" label={labels.instagram} defaultValue={defaults.instagramUrl} placeholder="https://instagram.com/…" error={fe.instagramUrl} />
          <Field name="facebookUrl"  label={labels.facebook}  defaultValue={defaults.facebookUrl}  placeholder="https://facebook.com/…"  error={fe.facebookUrl} />
          <Field name="xUrl"         label={labels.xTwitter}  defaultValue={defaults.xUrl}         placeholder="https://x.com/…"         error={fe.xUrl} />
          <Field name="tiktokUrl"    label={labels.tiktok}    defaultValue={defaults.tiktokUrl}    placeholder="https://tiktok.com/@…"   error={fe.tiktokUrl} />
          <Field name="youtubeUrl"   label={labels.youtube}   defaultValue={defaults.youtubeUrl}   placeholder="https://youtube.com/@…"  error={fe.youtubeUrl} />
          <Field name="whatsappUrl"  label={labels.whatsapp}  defaultValue={defaults.whatsappUrl}  placeholder="https://wa.me/…"         error={fe.whatsappUrl} />
        </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <legend className="px-2 text-sm font-bold text-[var(--color-foreground)]">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  name, label, hint, required, error, defaultValue, maxLength, placeholder, type,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; maxLength?: number; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        type={type ?? "text"}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
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

function TextareaField({
  name, label, hint, required, error, defaultValue, rows = 4,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
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
