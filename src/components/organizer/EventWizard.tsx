"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { wizardSaveAction, type WizardState } from "@/app/actions/event";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { VenueAutocomplete } from "@/components/ui/VenueAutocomplete";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Check, ChevronLeft, ChevronRight, Lock, Send, Plus, Trash2 } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { tierAllows } from "@/lib/tier";
import { Link } from "@/i18n/navigation";

type Category = { id: string; slug: string; name: string };
type Country = { code: string; name: string; flag: string };

const AGE_GROUPS = ["U6","U8","U10","U12","U14","U16","U18","U21","ADULT","ALL_AGES"];

export type WizardLabels = {
  steps: { 1: string; 2: string; 3: string; 4: string; 5: string };
  stepHints: { 1: string; 2: string; 3: string; 4: string; 5: string };
  prev: string; next: string; publish: string; saveDraft: string; saving: string;
  publishingDisabled: string; upgradeForPublish: string; upgradeCta: string;
  // Step 1
  category: string; categoryHint: string;
  englishSection: string; englishSectionHint: string;
  secondSection: string; secondSectionHint: string;
  secondLanguagePicker: string;
  langRu: string; langDe: string; langEs: string; langNone: string;
  titleEn: string; titleEnHint: string;
  shortDescEn: string; shortDescEnHint: string;
  descriptionEn: string; descriptionEnHint: string;
  titleSecond: string; shortDescSecond: string; descriptionSecond: string;
  // Step 2
  startDate: string; endDate: string; registrationDeadline: string;
  country: string; city: string;
  venueName: string; venueNameHint: string;
  venueAddress: string; venueAddressHint: string;
  // Step 3
  ageGroups: string; gender: string; genderMale: string; genderFemale: string; genderMixed: string;
  skillLevel: string; skillAll: string; skillAm: string; skillSemiPro: string; skillPro: string;
  format: string; formatHint: string; maxParticipants: string;
  // Step 4
  isFree: string; priceFrom: string; priceTo: string; currency: string;
  externalUrl: string; externalUrlHint: string;
  contactEmail: string; contactPhone: string;
  acceptsBookings: string;
  // Step 5
  logo: string; cover: string; videoUrl: string; videoUrlHint: string;
  included: string; includedHint: string;
  notIncluded: string; notIncludedHint: string;
  programme: string; programmeHint: string;
  programmeAddDay: string; programmeRemoveDay: string;
  programmeDayTitle: string; programmeDayItems: string;
  programmeAddItem: string;
  faq: string; faqHint: string;
  faqAddQuestion: string; faqRemoveQuestion: string;
  faqQuestion: string; faqAnswer: string;
  tierLockTitle: string; tierLockBody: string; videoLockBody: string;
  errors: Record<string, string>;
};

export type WizardDefaults = {
  // identifying
  eventId?: string;
  // step 1
  categoryId?: string;
  titleEn?: string; shortDescEn?: string; descriptionEn?: string;
  secondLocale?: "" | "ru" | "de" | "es";
  titleSecond?: string; shortDescSecond?: string; descriptionSecond?: string;
  // step 2
  startDate?: string; endDate?: string; registrationDeadline?: string;
  countryCode?: string; city?: string;
  venueName?: string; venueAddress?: string;
  // step 3
  ageGroups?: string[]; gender?: string; skillLevel?: string;
  format?: string; maxParticipants?: number;
  // step 4
  isFree?: boolean; priceFrom?: number; priceTo?: number; currency?: string;
  externalUrl?: string; contactEmail?: string; contactPhone?: string;
  acceptsBookings?: boolean;
  // step 5
  logoUrl?: string; coverUrl?: string; videoUrl?: string;
  included?: string; notIncluded?: string; programme?: string; faq?: string;
};

export function EventWizard({
  step,
  highestStep,
  tier,
  categories,
  countries,
  defaults,
  labels,
}: {
  step: 1 | 2 | 3 | 4 | 5;
  highestStep: number; // max step user already reached
  tier: Tier;
  categories: Category[];
  countries: Country[];
  defaults: WizardDefaults;
  labels: WizardLabels;
}) {
  const [state, action] = useActionState<WizardState, FormData>(wizardSaveAction, null);
  const [secondLocale, setSecondLocale] = useState<string>(defaults.secondLocale ?? "");
  const [isFree, setIsFree] = useState<boolean>(defaults.isFree ?? false);
  const [countryCode, setCountryCode] = useState<string>(defaults.countryCode ?? "");

  const fe = state?.fieldErrors ?? {};
  const errMsg = (key?: string) => key ? labels.errors[key] ?? key : undefined;

  const isLast = step === 5;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="step" value={step} />
      {defaults.eventId && <input type="hidden" name="eventId" value={defaults.eventId} />}

      <Stepper step={step} highestStep={highestStep} labels={labels} eventId={defaults.eventId} />

      <header>
        <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {labels.steps[step]}
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-muted-strong)]">{labels.stepHints[step]}</p>
      </header>

      {step === 1 && (
        <Step1
          categories={categories}
          defaults={defaults}
          labels={labels}
          fe={fe}
          errMsg={errMsg}
          secondLocale={secondLocale}
          setSecondLocale={setSecondLocale}
        />
      )}

      {step === 2 && (
        <Step2
          countries={countries}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          defaults={defaults}
          labels={labels}
          fe={fe}
          errMsg={errMsg}
        />
      )}

      {step === 3 && (
        <Step3 defaults={defaults} labels={labels} />
      )}

      {step === 4 && (
        <Step4 defaults={defaults} labels={labels} isFree={isFree} setIsFree={setIsFree} fe={fe} errMsg={errMsg} />
      )}

      {step === 5 && (
        <Step5 defaults={defaults} labels={labels} tier={tier} fe={fe} errMsg={errMsg} />
      )}

      {state?.error && state.error !== "validation" && state.error !== "publishIncomplete" && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.error === "publishIncomplete" && (
        <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.publishingDisabled}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <SubmitBtn name="direction" value="prev" variant="outline" icon="prev" label={labels.prev} loadingLabel={labels.saving} />
        ) : <span className="hidden sm:block" />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {!isLast && (
            <SubmitBtn name="direction" value="next" variant="accent" icon="next" label={labels.next} loadingLabel={labels.saving} />
          )}
          {isLast && (
            <>
              <SubmitBtn name="direction" value="prev" variant="ghost" icon="none" label={labels.saveDraft} loadingLabel={labels.saving} hiddenStep />
              <SubmitBtn name="direction" value="publish" variant="accent" icon="publish" label={labels.publish} loadingLabel={labels.saving} />
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Stepper({ step, highestStep, labels, eventId }: { step: number; highestStep: number; labels: WizardLabels; eventId?: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = n === step;
        const isDone = n < step || n <= highestStep;
        const visited = n <= highestStep;
        const cls = isActive
          ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-500)] text-white"
          : isDone
            ? "border-[var(--color-pitch-300)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-muted)]";
        const inner = (
          <span className={`inline-flex h-7 items-center gap-2 rounded-full border px-3 font-semibold ${cls}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${isActive ? "bg-white/20" : isDone ? "bg-[var(--color-pitch-500)] text-white" : "bg-[var(--color-bg-muted)]"}`}>
              {isDone && !isActive ? <Check className="h-2.5 w-2.5" /> : n}
            </span>
            <span className="hidden sm:inline">{labels.steps[n as 1]}</span>
          </span>
        );
        if (visited && eventId && !isActive) {
          return (
            <li key={n}>
              <Link href={`/organizer/events/${eventId}/setup?step=${n}`} className="transition hover:opacity-80">
                {inner}
              </Link>
            </li>
          );
        }
        return <li key={n}>{inner}</li>;
      })}
    </ol>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Что
// ─────────────────────────────────────────────────────────────
function Step1({
  categories, defaults, labels, fe, errMsg, secondLocale, setSecondLocale,
}: {
  categories: Category[]; defaults: WizardDefaults; labels: WizardLabels;
  fe: Record<string, string>; errMsg: (key?: string) => string | undefined;
  secondLocale: string; setSecondLocale: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Combobox
        name="categoryId"
        required
        label={labels.category}
        hint={labels.categoryHint}
        error={errMsg(fe.categoryId)}
        defaultValue={defaults.categoryId}
        items={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <fieldset className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5">
        <legend className="px-2">
          <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.englishSection}</span>
          <span className="ml-2 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">EN</span>
        </legend>
        <p className="text-xs text-[var(--color-muted)]">{labels.englishSectionHint}</p>
        <Field name="titleEn" required label={labels.titleEn} hint={labels.titleEnHint} maxLength={120} error={errMsg(fe.titleEn)} defaultValue={defaults.titleEn} />
        <Field name="shortDescEn" label={labels.shortDescEn} hint={labels.shortDescEnHint} maxLength={240} defaultValue={defaults.shortDescEn} />
        <Textarea name="descriptionEn" label={labels.descriptionEn} hint={labels.descriptionEnHint} rows={5} error={errMsg(fe.descriptionEn)} defaultValue={defaults.descriptionEn} />
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
            <Field name="titleSecond" label={labels.titleSecond} maxLength={120} defaultValue={defaults.titleSecond} />
            <Field name="shortDescSecond" label={labels.shortDescSecond} maxLength={240} defaultValue={defaults.shortDescSecond} />
            <Textarea name="descriptionSecond" label={labels.descriptionSecond} rows={5} defaultValue={defaults.descriptionSecond} />
          </>
        )}
      </fieldset>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Когда и где
// ─────────────────────────────────────────────────────────────
function Step2({
  countries, countryCode, setCountryCode, defaults, labels, fe, errMsg,
}: {
  countries: Country[]; countryCode: string; setCountryCode: (v: string) => void;
  defaults: WizardDefaults; labels: WizardLabels;
  fe: Record<string, string>; errMsg: (key?: string) => string | undefined;
}) {
  // Local state for the address so picking a venue can autofill it.
  // `addressKey` bumps to force-remount the AddressAutocomplete with a new defaultValue.
  const [address, setAddress] = useState<string>(defaults.venueAddress ?? "");
  const [addressKey, setAddressKey] = useState(0);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field name="startDate" type="date" label={labels.startDate} error={errMsg(fe.startDate)} defaultValue={defaults.startDate} />
        <Field name="endDate" type="date" label={labels.endDate} error={errMsg(fe.endDate)} defaultValue={defaults.endDate} />
        <Field name="registrationDeadline" type="date" label={labels.registrationDeadline} defaultValue={defaults.registrationDeadline} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Combobox
          name="countryCode"
          label={labels.country}
          error={errMsg(fe.countryCode)}
          defaultValue={defaults.countryCode}
          items={countries.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))}
          onValueChange={setCountryCode}
        />
        <CityCombobox name="city" label={labels.city} countryCode={countryCode} defaultValue={defaults.city} />
      </div>
      <VenueAutocomplete
        name="venueName"
        label={labels.venueName}
        hint={labels.venueNameHint}
        error={errMsg(fe.venueName)}
        defaultValue={defaults.venueName}
        countryCode={countryCode}
        onPicked={(v) => {
          if (v.address) {
            setAddress(v.address);
            setAddressKey((k) => k + 1);
          }
        }}
      />
      <AddressAutocomplete
        key={addressKey}
        name="venueAddress"
        label={labels.venueAddress}
        hint={labels.venueAddressHint}
        defaultValue={address}
        countryCode={countryCode}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Для кого
// ─────────────────────────────────────────────────────────────
function Step3({ defaults, labels }: { defaults: WizardDefaults; labels: WizardLabels }) {
  return (
    <div className="space-y-7">
      {/* Age — equal-width grid so every chip is the same size */}
      <PillCheckGroup
        legend={labels.ageGroups}
        name="ageGroups"
        defaultValues={defaults.ageGroups ?? []}
        options={AGE_GROUPS.map((a) => ({ value: a, label: a === "ALL_AGES" ? "ALL" : a }))}
        cols="grid-cols-6 sm:grid-cols-11"
      />

      {/* Gender — 3 equal cells */}
      <PillRadioGroup
        legend={labels.gender}
        name="gender"
        defaultValue={defaults.gender ?? "MIXED"}
        cols="grid-cols-3"
        options={[
          { value: "MALE",   label: labels.genderMale },
          { value: "FEMALE", label: labels.genderFemale },
          { value: "MIXED",  label: labels.genderMixed },
        ]}
      />

      {/* Skill level — 2 cols on mobile, 4 on desktop, equal */}
      <PillRadioGroup
        legend={labels.skillLevel}
        name="skillLevel"
        defaultValue={defaults.skillLevel ?? "ALL_LEVELS"}
        cols="grid-cols-2 sm:grid-cols-4"
        options={[
          { value: "ALL_LEVELS",   label: labels.skillAll },
          { value: "AMATEUR",      label: labels.skillAm },
          { value: "SEMI_PRO",     label: labels.skillSemiPro },
          { value: "PROFESSIONAL", label: labels.skillPro },
        ]}
      />

      {/* Format + Max participants */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="format" label={labels.format} hint={labels.formatHint} placeholder="11×11" defaultValue={defaults.format} />
        <Field name="maxParticipants" type="number" label={labels.maxParticipants} placeholder="32" defaultValue={defaults.maxParticipants?.toString()} />
      </div>
    </div>
  );
}

const pillCellCls =
  "inline-flex h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-sm font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-500)] has-[:checked]:text-white hover:border-[var(--color-pitch-300)]";

/** Multi-select chip group with uniform grid cells. */
function PillCheckGroup({
  legend, name, options, defaultValues, cols,
}: {
  legend: string; name: string; cols: string;
  defaultValues: string[];
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{legend}</legend>
      <div className={`grid gap-1.5 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className={pillCellCls}>
            <input type="checkbox" name={name} value={o.value} defaultChecked={defaultValues.includes(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Single-select pill row with uniform grid cells. */
function PillRadioGroup({
  legend, name, options, defaultValue, cols,
}: {
  legend: string; name: string; defaultValue: string; cols: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{legend}</legend>
      <div className={`grid gap-1.5 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className={pillCellCls}>
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Цена и регистрация
// ─────────────────────────────────────────────────────────────
function Step4({
  defaults, labels, isFree, setIsFree, fe, errMsg,
}: {
  defaults: WizardDefaults; labels: WizardLabels;
  isFree: boolean; setIsFree: (v: boolean) => void;
  fe: Record<string, string>; errMsg: (key?: string) => string | undefined;
}) {
  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border-strong)]" />
        {labels.isFree}
      </label>
      {!isFree && (
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="priceFrom" type="number" label={labels.priceFrom} placeholder="120" defaultValue={defaults.priceFrom?.toString()} />
          <Field name="priceTo"   type="number" label={labels.priceTo}   placeholder="280" error={errMsg(fe.priceTo)} defaultValue={defaults.priceTo?.toString()} />
          <Field name="currency" label={labels.currency} defaultValue={defaults.currency ?? "EUR"} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="contactEmail" type="email" label={labels.contactEmail} placeholder="info@…" defaultValue={defaults.contactEmail} />
        <Field name="contactPhone" type="tel"   label={labels.contactPhone} placeholder="+49 …" defaultValue={defaults.contactPhone} />
      </div>

      <Field name="externalUrl" type="url" label={labels.externalUrl} hint={labels.externalUrlHint} placeholder="https://…" defaultValue={defaults.externalUrl} />

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="acceptsBookings" defaultChecked={defaults.acceptsBookings ?? true} className="h-4 w-4 rounded border-[var(--color-border-strong)]" />
        {labels.acceptsBookings}
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 5 — Оформление и публикация
// ─────────────────────────────────────────────────────────────
function Step5({
  defaults, labels, tier, fe, errMsg,
}: {
  defaults: WizardDefaults; labels: WizardLabels; tier: Tier;
  fe: Record<string, string>; errMsg: (key?: string) => string | undefined;
}) {
  const allowVideo = tierAllows(tier, "videoEmbed");
  const allowContent = tierAllows(tier, "included") || tierAllows(tier, "programme") || tierAllows(tier, "faq");

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <ImageUpload name="logoUrl" kind="event-logo" label={labels.logo} defaultUrl={defaults.logoUrl} />
        <ImageUpload name="coverUrl" kind="event-cover" label={labels.cover} defaultUrl={defaults.coverUrl} />
      </div>

      <div>
        {allowVideo ? (
          <Field name="videoUrl" type="url" label={labels.videoUrl} hint={labels.videoUrlHint} error={errMsg(fe.videoUrl)} placeholder="https://www.youtube.com/watch?v=…" defaultValue={defaults.videoUrl} />
        ) : (
          <LockedSection title={labels.videoUrl} body={labels.videoLockBody} cta={labels.upgradeCta} />
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {tierAllows(tier, "included") ? (
          <>
            <Textarea name="included" label={labels.included} hint={labels.includedHint} rows={5} defaultValue={defaults.included} />
            <Textarea name="notIncluded" label={labels.notIncluded} hint={labels.notIncludedHint} rows={5} defaultValue={defaults.notIncluded} />
          </>
        ) : (
          <div className="sm:col-span-2">
            <LockedSection title={labels.included} body={labels.tierLockBody} cta={labels.upgradeCta} />
          </div>
        )}
      </div>
      {tierAllows(tier, "programme") && (
        <ProgrammeEditor labels={labels} defaultValue={defaults.programme} />
      )}
      {tierAllows(tier, "faq") && (
        <FaqEditor labels={labels} defaultValue={defaults.faq} />
      )}
      {!allowContent && tier === "FREE" && (
        <LockedSection title={labels.tierLockTitle} body={labels.tierLockBody} cta={labels.upgradeCta} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bits
// ─────────────────────────────────────────────────────────────
function SubmitBtn({
  name, value, variant, icon, label, loadingLabel, hiddenStep,
}: {
  name: string; value: string;
  variant: "accent" | "outline" | "ghost";
  icon: "next" | "prev" | "publish" | "none";
  label: string; loadingLabel: string;
  hiddenStep?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} variant={variant} size="md" disabled={pending}>
      {icon === "prev" && <ChevronLeft className="h-4 w-4" />}
      {pending ? loadingLabel : label}
      {icon === "next" && <ChevronRight className="h-4 w-4" />}
      {icon === "publish" && <Send className="h-4 w-4" />}
    </Button>
  );
}

function LockedSection({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] p-5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-[var(--color-muted)]" />
        <span className="text-sm font-bold text-[var(--color-foreground)]">{title}</span>
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted-strong)]">{body}</p>
      <Link href="/pricing" className="mt-3 inline-block text-xs font-semibold text-[var(--color-pitch-700)] underline-offset-4 hover:underline">
        {cta} →
      </Link>
    </div>
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
        name={name} type={type ?? "text"} required={required}
        defaultValue={defaultValue} maxLength={maxLength} placeholder={placeholder}
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

function Textarea({
  name, label, hint, error, defaultValue, rows = 4,
}: {
  name: string; label: string; hint?: string; error?: string;
  defaultValue?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name} rows={rows} defaultValue={defaultValue}
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

function SelectField({
  name, label, options, defaultValue,
}: {
  name: string; label: string; defaultValue?: string;
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

function RadioGroup({
  name, label, options, defaultValue,
}: {
  name: string; label: string; defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</legend>
      <div className="flex gap-2">
        {options.map((o) => (
          <label key={o.value} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]">
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ─────────────────────────────────────────────────────────────
// Structured Programme editor (days + items)
// ─────────────────────────────────────────────────────────────
type Day = { title: string; items: string[] };

function parseProgrammeJson(raw?: string): Day[] {
  if (!raw?.trim()) return [];
  // 1) JSON array path
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((d: unknown) => {
          const obj = d as { title?: unknown; items?: unknown };
          return {
            title: typeof obj.title === "string" ? obj.title : "",
            items: Array.isArray(obj.items) ? obj.items.filter((x): x is string => typeof x === "string") : [],
          };
        });
      }
    } catch { /* fall through */ }
  }
  // 2) Legacy plain-text path: blank line separates days; first line of each block is title.
  const days: Day[] = [];
  let current: Day | null = null;
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) {
      if (current) { days.push(current); current = null; }
      continue;
    }
    if (!current) current = { title: line, items: [] };
    else current.items.push(line);
  }
  if (current) days.push(current);
  return days;
}

function ProgrammeEditor({ labels, defaultValue }: { labels: WizardLabels; defaultValue?: string }) {
  const [days, setDays] = useState<Day[]>(() => parseProgrammeJson(defaultValue));

  const updateDay = (idx: number, patch: Partial<Day>) => {
    setDays(days.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };
  const updateItem = (dayIdx: number, itemIdx: number, value: string) => {
    setDays(days.map((d, i) => i === dayIdx ? { ...d, items: d.items.map((x, j) => j === itemIdx ? value : x) } : d));
  };
  const addDay = () => setDays([...days, { title: "", items: [""] }]);
  const removeDay = (idx: number) => setDays(days.filter((_, i) => i !== idx));
  const addItem = (dayIdx: number) => setDays(days.map((d, i) => i === dayIdx ? { ...d, items: [...d.items, ""] } : d));
  const removeItem = (dayIdx: number, itemIdx: number) =>
    setDays(days.map((d, i) => i === dayIdx ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) } : d));

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.programme}</span>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.programmeHint}</p>

      <input type="hidden" name="programme" value={JSON.stringify(days)} />

      <div className="space-y-3">
        {days.map((d, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-pitch-50)] text-xs font-bold text-[var(--color-pitch-700)]">{i + 1}</span>
              <input
                type="text"
                value={d.title}
                onChange={(e) => updateDay(i, { title: e.target.value })}
                placeholder={labels.programmeDayTitle}
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
              />
              <button type="button" onClick={() => removeDay(i)} className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600" aria-label={labels.programmeRemoveDay}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2 pl-9">
              {d.items.map((it, j) => (
                <li key={j} className="flex items-center gap-2">
                  <span className="text-[var(--color-muted)]">•</span>
                  <input
                    type="text"
                    value={it}
                    onChange={(e) => updateItem(i, j, e.target.value)}
                    placeholder={labels.programmeDayItems}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)]"
                  />
                  <button type="button" onClick={() => removeItem(i, j)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => addItem(i)} className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 text-xs font-semibold text-[var(--color-pitch-700)] transition hover:bg-[var(--color-pitch-50)]">
                  <Plus className="h-3.5 w-3.5" /> {labels.programmeAddItem}
                </button>
              </li>
            </ul>
          </div>
        ))}
      </div>

      <button type="button" onClick={addDay} className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]">
        <Plus className="h-4 w-4" /> {labels.programmeAddDay}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Structured FAQ editor (Q/A pairs)
// ─────────────────────────────────────────────────────────────
type Qa = { q: string; a: string };

function parseFaqJson(raw?: string): Qa[] {
  if (!raw?.trim()) return [];
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((p: unknown) => {
          const o = p as { q?: unknown; a?: unknown };
          return { q: typeof o.q === "string" ? o.q : "", a: typeof o.a === "string" ? o.a : "" };
        });
      }
    } catch { /* fall through */ }
  }
  // Legacy: "Q: …" / "A: …" pairs separated by blank line.
  const qas: Qa[] = [];
  let current: Partial<Qa> | null = null;
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) {
      if (current?.q && current.a) qas.push({ q: current.q, a: current.a });
      current = null;
      continue;
    }
    if (line.toLowerCase().startsWith("q:")) {
      current = { q: line.slice(2).trim(), a: "" };
    } else if (line.toLowerCase().startsWith("a:") && current) {
      current.a = line.slice(2).trim();
    }
  }
  if (current?.q && current.a) qas.push({ q: current.q, a: current.a });
  return qas;
}

function FaqEditor({ labels, defaultValue }: { labels: WizardLabels; defaultValue?: string }) {
  const [items, setItems] = useState<Qa[]>(() => parseFaqJson(defaultValue));

  const update = (i: number, patch: Partial<Qa>) => setItems(items.map((x, j) => j === i ? { ...x, ...patch } : x));
  const add = () => setItems([...items, { q: "", a: "" }]);
  const remove = (i: number) => setItems(items.filter((_, j) => j !== i));

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.faq}</span>
      </div>
      <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.faqHint}</p>

      <input type="hidden" name="faq" value={JSON.stringify(items)} />

      <div className="space-y-3">
        {items.map((qa, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={qa.q}
                  onChange={(e) => update(i, { q: e.target.value })}
                  placeholder={labels.faqQuestion}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
                />
                <textarea
                  rows={3}
                  value={qa.a}
                  onChange={(e) => update(i, { a: e.target.value })}
                  placeholder={labels.faqAnswer}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)]"
                />
              </div>
              <button type="button" onClick={() => remove(i)} className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600" aria-label={labels.faqRemoveQuestion}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]">
        <Plus className="h-4 w-4" /> {labels.faqAddQuestion}
      </button>
    </div>
  );
}
