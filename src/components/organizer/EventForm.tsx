"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createEventAction, updateEventAction, type EventFormState } from "@/app/actions/event";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Lock } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { tierAllows } from "@/lib/tier";

type Category = { id: string; slug: string; name: string };
type Country = { code: string; name: string; flag: string };

export type EventFormLabels = {
  newTitle: string; newSubtitle: string;
  saveDraft: string; submitReview: string; saving: string;
  draftHint: string;
  sections: Record<string, string>;
  category: string; categoryHint: string;
  englishSection: string; englishSectionHint: string;
  secondSection: string; secondSectionHint: string;
  secondLanguagePicker: string;
  langRu: string; langDe: string; langEs: string; langNone: string;
  titleEn: string; titleEnHint: string;
  shortDescEn: string; shortDescEnHint: string;
  descriptionEn: string; descriptionEnHint: string;
  titleSecond: string; shortDescSecond: string; descriptionSecond: string;
  startDate: string; endDate: string; registrationDeadline: string; timezone: string;
  country: string; city: string;
  venueName: string; venueNameHint: string;
  venueAddress: string; venueAddressHint: string;
  ageGroups: string; gender: string; skillLevel: string;
  format: string; formatHint: string; maxParticipants: string;
  isFree: string; priceFrom: string; priceTo: string; currency: string;
  externalUrl: string; externalUrlHint: string;
  contactEmail: string; contactPhone: string;
  acceptsBookings: string;
  videoUrl: string; videoUrlHint: string;
  logo: string; cover: string;
  gallery: string; galleryHint: string;
  included: string; includedHint: string;
  notIncluded: string; notIncludedHint: string;
  programme: string; programmeHint: string;
  faq: string; faqHint: string;
  tierLockTitle: string; tierLockBody: string; videoLockBody: string;
  errors: Record<string, string>;
};

const AGE_GROUPS = ["U6","U8","U10","U12","U14","U16","U18","U21","ADULT","ALL_AGES"];

export type EventDefaults = {
  id?: string;
  categoryId?: string;
  titleEn?: string;
  shortDescEn?: string;
  descriptionEn?: string;
  startDate?: string;          // YYYY-MM-DD
  endDate?: string;
  registrationDeadline?: string;
  countryCode?: string;
  city?: string;
  venueName?: string;
  venueAddress?: string;
  ageGroups?: string[];
  gender?: string;
  skillLevel?: string;
  format?: string;
  maxParticipants?: number;
  isFree?: boolean;
  priceFrom?: number;
  priceTo?: number;
  currency?: string;
  externalUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  acceptsBookings?: boolean;
  videoUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  included?: string;
  notIncluded?: string;
  programme?: string;
  faq?: string;
  secondLocale?: "" | "ru" | "de" | "es";
  titleSecond?: string;
  shortDescSecond?: string;
  descriptionSecond?: string;
};

export function EventForm({
  tier,
  categories,
  countries,
  labels,
  defaults,
}: {
  tier: Tier;
  categories: Category[];
  countries: Country[];
  labels: EventFormLabels;
  defaults?: EventDefaults;
}) {
  const isEdit = !!defaults?.id;
  const [state, action] = useActionState<EventFormState, FormData>(
    isEdit ? updateEventAction : createEventAction,
    null,
  );
  const [countryCode, setCountryCode] = useState<string>(defaults?.countryCode ?? "");
  const [isFree, setIsFree] = useState(defaults?.isFree ?? false);
  const [secondLocale, setSecondLocale] = useState<string>(defaults?.secondLocale ?? "");

  const fe = state?.fieldErrors ?? {};
  const errMsg = (key?: string) => key ? labels.errors[key] ?? key : undefined;

  return (
    <form action={action} className="space-y-12">
      {isEdit && <input type="hidden" name="id" value={defaults!.id} />}
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{labels.newTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.newSubtitle}</p>
      </header>

      {/* Basics */}
      <Section title={labels.sections.basics} hint={labels.sections.basicsHint}>
        <Combobox
          name="categoryId"
          required
          label={labels.category}
          hint={labels.categoryHint}
          error={errMsg(fe.categoryId)}
          defaultValue={defaults?.categoryId}
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <fieldset className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
          <legend className="px-2">
            <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.englishSection}</span>
            <span className="ml-2 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">EN</span>
          </legend>
          <p className="text-xs text-[var(--color-muted)]">{labels.englishSectionHint}</p>
          <Field name="titleEn" required label={labels.titleEn} hint={labels.titleEnHint} maxLength={120} error={errMsg(fe.titleEn)} defaultValue={defaults?.titleEn} />
          <Field name="shortDescEn" label={labels.shortDescEn} hint={labels.shortDescEnHint} maxLength={240} defaultValue={defaults?.shortDescEn} />
          <Textarea name="descriptionEn" required label={labels.descriptionEn} hint={labels.descriptionEnHint} rows={6} error={errMsg(fe.descriptionEn)} defaultValue={defaults?.descriptionEn} />
        </fieldset>

        <fieldset className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
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
              <Field name="titleSecond" label={labels.titleSecond} maxLength={120} defaultValue={defaults?.titleSecond} />
              <Field name="shortDescSecond" label={labels.shortDescSecond} maxLength={240} defaultValue={defaults?.shortDescSecond} />
              <Textarea name="descriptionSecond" label={labels.descriptionSecond} rows={6} defaultValue={defaults?.descriptionSecond} />
            </>
          )}
        </fieldset>
      </Section>

      {/* Schedule */}
      <Section title={labels.sections.schedule} hint={labels.sections.scheduleHint}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="startDate" type="date" required label={labels.startDate} error={errMsg(fe.startDate)} defaultValue={defaults?.startDate} />
          <Field name="endDate" type="date" required label={labels.endDate} error={errMsg(fe.endDate)} defaultValue={defaults?.endDate} />
          <Field name="registrationDeadline" type="date" label={labels.registrationDeadline} defaultValue={defaults?.registrationDeadline} />
        </div>
      </Section>

      {/* Location */}
      <Section title={labels.sections.location} hint={labels.sections.locationHint}>
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
        <Field name="venueName" required label={labels.venueName} hint={labels.venueNameHint} error={errMsg(fe.venueName)} defaultValue={defaults?.venueName} />
        <Field name="venueAddress" label={labels.venueAddress} hint={labels.venueAddressHint} defaultValue={defaults?.venueAddress} />
      </Section>

      {/* Audience */}
      <Section title={labels.sections.audience} hint={labels.sections.audienceHint}>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.ageGroups}</legend>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((a) => (
              <label key={a} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]">
                <input type="checkbox" name="ageGroups" value={a} defaultChecked={defaults?.ageGroups?.includes(a)} className="sr-only" />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-3">
          <RadioGroup name="gender" label={labels.gender} options={[
            { value: "MALE", label: "Boys" },
            { value: "FEMALE", label: "Girls" },
            { value: "MIXED", label: "Mixed" },
          ]} defaultValue={defaults?.gender ?? "MIXED"} />
          <SelectField name="skillLevel" label={labels.skillLevel} options={[
            { value: "ALL_LEVELS", label: "All levels" },
            { value: "AMATEUR", label: "Amateur" },
            { value: "SEMI_PRO", label: "Semi-pro" },
            { value: "PROFESSIONAL", label: "Professional" },
          ]} defaultValue={defaults?.skillLevel ?? "ALL_LEVELS"} />
          <Field name="format" label={labels.format} hint={labels.formatHint} placeholder="11x11" defaultValue={defaults?.format} />
        </div>
        <Field name="maxParticipants" type="number" label={labels.maxParticipants} placeholder="32" defaultValue={defaults?.maxParticipants} />
      </Section>

      {/* Pricing */}
      <Section title={labels.sections.pricing} hint={labels.sections.pricingHint}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border-strong)]" />
          {labels.isFree}
        </label>
        {!isFree && (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field name="priceFrom" type="number" label={labels.priceFrom} placeholder="120" defaultValue={defaults?.priceFrom} />
            <Field name="priceTo" type="number" label={labels.priceTo} placeholder="280" error={errMsg(fe.priceTo)} defaultValue={defaults?.priceTo} />
            <SelectField name="currency" label={labels.currency} defaultValue={defaults?.currency ?? "EUR"} options={[
              { value: "EUR", label: "EUR €" },
              { value: "USD", label: "USD $" },
              { value: "GBP", label: "GBP £" },
            ]} />
          </div>
        )}
        <Field name="externalUrl" type="url" label={labels.externalUrl} hint={labels.externalUrlHint} placeholder="https://…" defaultValue={defaults?.externalUrl} />
      </Section>

      {/* Media */}
      <Section title={labels.sections.media} hint={labels.sections.mediaHint}>
        <ImageUpload name="logoUrl" kind="event-logo" label={labels.logo} defaultUrl={defaults?.logoUrl} />
        <ImageUpload name="coverUrl" kind="event-cover" label={labels.cover} defaultUrl={defaults?.coverUrl} />
        <p className="text-xs text-[var(--color-muted)]">{labels.galleryHint}</p>
      </Section>

      {/* Video — Premium */}
      <Section title={labels.sections.video} hint={labels.sections.videoHint}>
        {tierAllows(tier, "videoEmbed") ? (
          <Field name="videoUrl" type="url" label={labels.videoUrl} hint={labels.videoUrlHint} placeholder="https://www.youtube.com/watch?v=…" error={errMsg(fe.videoUrl)} defaultValue={defaults?.videoUrl} />
        ) : (
          <TierLock title={labels.tierLockTitle} body={labels.videoLockBody} />
        )}
      </Section>

      {/* Content — Pro+ */}
      <Section title={labels.sections.content} hint={labels.sections.contentHint}>
        {tierAllows(tier, "included") ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Textarea name="included" label={labels.included} hint={labels.includedHint} rows={6} defaultValue={defaults?.included} />
              <Textarea name="notIncluded" label={labels.notIncluded} hint={labels.notIncludedHint} rows={6} defaultValue={defaults?.notIncluded} />
            </div>
            <Textarea name="programme" label={labels.programme} hint={labels.programmeHint} rows={8} defaultValue={defaults?.programme} />
            <Textarea name="faq" label={labels.faq} hint={labels.faqHint} rows={8} defaultValue={defaults?.faq} />
          </>
        ) : (
          <TierLock title={labels.tierLockTitle} body={labels.tierLockBody} />
        )}
      </Section>

      {/* Booking */}
      <Section title={labels.sections.booking} hint={labels.sections.bookingHint}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="acceptsBookings" defaultChecked={defaults?.acceptsBookings ?? true} className="h-4 w-4 rounded border-[var(--color-border-strong)]" />
          {labels.acceptsBookings}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="contactEmail" type="email" label={labels.contactEmail} placeholder="info@…" defaultValue={defaults?.contactEmail} />
          <Field name="contactPhone" label={labels.contactPhone} placeholder="+49 …" defaultValue={defaults?.contactPhone} />
        </div>
      </Section>

      {state?.error && !state.fieldErrors && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {labels.errors[state.error] ?? state.error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-muted)]">{labels.draftHint}</p>
        <div className="flex gap-2">
          <SubmitBtn intent="draft" label={labels.saveDraft} loadingLabel={labels.saving} variant="outline" />
          <SubmitBtn intent="review" label={labels.submitReview} loadingLabel={labels.saving} variant="accent" />
        </div>
      </div>
    </form>
  );
}

function SubmitBtn({ intent, label, loadingLabel, variant }: { intent: "draft" | "review"; label: string; loadingLabel: string; variant: "outline" | "accent" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="intent" value={intent} variant={variant} size="lg" disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">{title}</h2>
        {hint && <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{hint}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TierLock({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-muted)]" />
      <div>
        <div className="text-sm font-semibold text-[var(--color-foreground)]">{title}</div>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{body}</p>
      </div>
    </div>
  );
}

function Field({
  name, label, hint, type = "text", required, error, placeholder, maxLength, defaultValue,
}: {
  name: string; label: string; hint?: string; type?: string; required?: boolean;
  error?: string; placeholder?: string; maxLength?: number; defaultValue?: string | number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}

function Textarea({
  name, label, hint, required, rows = 4, error, defaultValue,
}: {
  name: string; label: string; hint?: string; required?: boolean; rows?: number; error?: string; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
        className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:ring-2 focus:ring-[var(--color-pitch-500)]/20 ${error ? "border-red-300" : "border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)]"}`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}

function SelectField({
  name, label, options, defaultValue,
}: { name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function RadioGroup({
  name, label, options, defaultValue,
}: { name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</legend>
      <div className="flex gap-2">
        {options.map((o) => (
          <label key={o.value} className="flex flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
