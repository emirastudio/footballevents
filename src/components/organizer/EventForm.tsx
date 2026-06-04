"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useLocale } from "next-intl";
import { createEventAction, updateEventAction, type EventFormState } from "@/app/actions/event";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { RichEditor } from "@/components/ui/RichEditor";
import { Lock, Plus, Trash2 } from "lucide-react";
import type { Tier } from "@/lib/tier";
import { tierAllows } from "@/lib/tier";
import { parsePartners, type Partner } from "@/lib/partners";

type Category = { id: string; slug: string; name: string };
type Country = { code: string; name: string; flag: string };

// Backend errors come as either a plain key ("titleRequired") or as a
// colon-encoded structured code like "eventLimitReached:5:FREE". Decode and
// look up the right localized template.
export function formatError(raw: string, errors: Record<string, string>): string {
  if (raw.startsWith("eventLimitReached:")) {
    const [, limit, tier] = raw.split(":");
    const tpl = errors.eventLimitReached;
    if (!tpl) return raw;
    const hint = errors[`limitHint${tier?.charAt(0)}${tier?.slice(1).toLowerCase()}`] ?? "";
    return tpl.replace("{limit}", String(limit)).replace("{tier}", String(tier)).replace("{hint}", hint);
  }
  return errors[raw] ?? raw;
}

export type EventFormLabels = {
  newTitle: string; newSubtitle: string;
  saveDraft: string; submitReview: string; saveChanges: string; saving: string;
  draftHint: string; publishedHint: string;
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
  format: string; formatHint: string; formatAny: string;
  isFree: string; priceFrom: string; priceTo: string; currency: string;
  externalUrl: string; externalUrlHint: string;
  contactEmail: string; contactPhone: string;
  acceptsBookings: string;
  videoUrl: string; videoUrlHint: string;
  customSlug: string; customSlugHint: string;
  logo: string; cover: string;
  gallery: string; galleryHint: string;
  included: string; includedHint: string; includedAddItem: string;
  notIncluded: string; notIncludedHint: string;
  programme: string; programmeHint: string;
  programmeDayTitle: string; programmeDayItems: string;
  programmeAddDay: string; programmeRemoveDay: string; programmeAddItem: string;
  faq: string; faqHint: string;
  faqQuestion: string; faqAnswer: string; faqAddQuestion: string; faqRemoveQuestion: string;
  tierLockTitle: string; tierLockBody: string; videoLockBody: string;
  errors: Record<string, string>;
};

const _CY = new Date().getFullYear();
const YEAR_GRID = [...Array.from({ length: 20 }, (_, i) => String(_CY - i)), "ADULT"];
const FORMATS_LIST = ["5x5","6x6","7x7","8x8","9x9","11x11"];

export type EventDefaults = {
  id?: string;
  status?: string;
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
  formats?: string[];
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
  partners?: string;
  slug?: string;
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
  const [selectedAges, setSelectedAges] = useState<string[]>(defaults?.ageGroups ?? []);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(
    defaults?.formats ?? (defaults?.format ? defaults.format.split(",").filter(Boolean) : [])
  );
  const toggleAge = (v: string) => setSelectedAges((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  const toggleFmt = (v: string) => setSelectedFormats((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);

  const fe = state?.fieldErrors ?? {};
  const errMsg = (key?: string) => key ? labels.errors[key] ?? key : undefined;

  // On a failed submit, jump to the first field with an error and focus it —
  // otherwise the error is off-screen and the submit looks like it did nothing.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const firstKey = state?.fieldErrors && Object.keys(state.fieldErrors)[0];
    if (!firstKey || !formRef.current) return;
    const el = formRef.current.querySelector<HTMLElement>(`[name="${firstKey}"]`);
    if (!el) return;
    const target = el.closest("label") ?? el;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus?.({ preventScroll: true });
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-12">
      {isEdit && <input type="hidden" name="id" value={defaults!.id} />}
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{labels.newTitle}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.newSubtitle}</p>
      </header>
      {state?.error && state.error !== "validation" && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formatError(state.error, labels.errors)}
        </p>
      )}
      {state?.error === "validation" && Object.keys(fe).length > 0 && (
        <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {labels.errors.validationHint ?? "Please check the highlighted fields below."}
        </p>
      )}

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
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.descriptionEn}</span>
            <RichEditor name="descriptionEn" defaultValue={defaults?.descriptionEn} placeholder={labels.descriptionEnHint} />
            {fe.descriptionEn && <span className="mt-1 block text-xs text-red-600">{errMsg(fe.descriptionEn)}</span>}
          </div>
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
              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.descriptionSecond}</span>
                <RichEditor name="descriptionSecond" defaultValue={defaults?.descriptionSecond} />
              </div>
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
        {/* Age groups — year grid */}
        <fieldset>
          <legend className="mb-3 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.ageGroups}</legend>
          {selectedAges.map((v) => <input key={v} type="hidden" name="ageGroups" value={v} />)}
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
            {YEAR_GRID.map((val) => {
              const active = selectedAges.includes(val);
              return (
                <button key={val} type="button" onClick={() => toggleAge(val)}
                  className={["h-10 rounded-[var(--radius-md)] border text-sm font-semibold tabular-nums transition", val === "ADULT" ? "col-span-2 sm:col-span-1" : "", active ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-500)] text-white" : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-400)] hover:text-[var(--color-foreground)]"].join(" ")}>
                  {val === "ADULT" ? "Adult" : val}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Gender */}
        <RadioGroup name="gender" label={labels.gender} options={[
          { value: "MALE", label: "Boys/Men" },
          { value: "FEMALE", label: "Girls/Women" },
          { value: "MIXED", label: "Mixed" },
        ]} defaultValue={defaults?.gender ?? "MIXED"} />

        {/* Skill level */}
        <RadioGroup name="skillLevel" label={labels.skillLevel} options={[
          { value: "ALL_LEVELS", label: "All levels" },
          { value: "AMATEUR", label: "Amateur" },
          { value: "SEMI_PRO", label: "Semi-pro" },
          { value: "PROFESSIONAL", label: "Professional" },
        ]} defaultValue={defaults?.skillLevel ?? "ALL_LEVELS"} />

        {/* Format — multi-select */}
        <fieldset>
          <legend className="mb-3 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.format}</legend>
          <input type="hidden" name="format" value={selectedFormats.join(",")} />
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {FORMATS_LIST.map((val) => {
              const active = selectedFormats.includes(val);
              const label = val.replace("x", "×");
              return (
                <button key={val} type="button" onClick={() => toggleFmt(val)}
                  className={["h-10 rounded-[var(--radius-md)] border text-sm font-semibold transition", active ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-500)] text-white" : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-400)] hover:text-[var(--color-foreground)]"].join(" ")}>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
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
      </Section>

      {/* Media */}
      <Section title={labels.sections.media} hint={labels.sections.mediaHint}>
        <ImageUpload name="logoUrl" kind="event-logo" label={labels.logo} defaultUrl={defaults?.logoUrl} />
        <ImageUpload name="coverUrl" kind="event-cover" label={labels.cover} defaultUrl={defaults?.coverUrl} />
        <p className="text-xs text-[var(--color-muted)]">{labels.galleryHint}</p>
      </Section>

      {/* Co-organizers & partners (display on the public event page) */}
      <FormPartnersEditor name="partners" defaultValue={defaults?.partners} />

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
              <ListBuilder name="included" label={labels.included} hint={labels.includedHint} addLabel={labels.includedAddItem} defaultValue={defaults?.included} />
              <ListBuilder name="notIncluded" label={labels.notIncluded} hint={labels.notIncludedHint} addLabel={labels.includedAddItem} defaultValue={defaults?.notIncluded} />
            </div>
            <FormProgrammeEditor name="programme" labels={labels} defaultValue={defaults?.programme} />
            <FormFaqEditor name="faq" labels={labels} defaultValue={defaults?.faq} />
          </>
        ) : (
          <TierLock title={labels.tierLockTitle} body={labels.tierLockBody} />
        )}
      </Section>

      {/* Booking */}
      <Section title={labels.sections.booking} hint={labels.sections.bookingHint}>
        <RegistrationChooser
          platformLabel={labels.acceptsBookings}
          externalLabel={labels.externalUrl}
          externalHint={labels.externalUrlHint}
          defaultAccepts={defaults?.acceptsBookings ?? true}
          defaultExternalUrl={defaults?.externalUrl}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="contactEmail" type="email" label={labels.contactEmail} placeholder="info@…" defaultValue={defaults?.contactEmail} />
          <Field name="contactPhone" label={labels.contactPhone} placeholder="+49 …" defaultValue={defaults?.contactPhone} />
        </div>
      </Section>

      {/* Custom URL slug — edit mode only */}
      {isEdit && defaults?.slug && (
        <Section title={labels.customSlug} hint={labels.customSlugHint}>
          <SlugField
            name="customSlug"
            defaultValue={defaults.slug}
            error={errMsg(fe.customSlug)}
          />
        </Section>
      )}

      {state?.error && !state.fieldErrors && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formatError(state.error, labels.errors)}
        </p>
      )}

      {/* Validation errors repeated right above the buttons — the top banner is
          off-screen when the user clicks submit at the bottom ("nothing happens"). */}
      {state?.error === "validation" && Object.keys(fe).length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{labels.errors.validationHint ?? "Please fix the following:"}</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(fe).map(([k, v]) => (
              <li key={k}>{labels.errors[v] ?? labels.errors[k] ?? v}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--color-muted)]">
          {defaults?.status === "PUBLISHED" ? labels.publishedHint : labels.draftHint}
        </p>
        <div className="flex gap-2">
          {defaults?.status === "PUBLISHED" ? (
            <SubmitBtn intent="draft" label={labels.saveChanges} loadingLabel={labels.saving} variant="accent" />
          ) : (
            <>
              <SubmitBtn intent="draft" label={labels.saveDraft} loadingLabel={labels.saving} variant="outline" />
              <SubmitBtn intent="review" label={labels.submitReview} loadingLabel={labels.saving} variant="accent" />
            </>
          )}
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

function RegistrationChooser({
  platformLabel, externalLabel, externalHint, defaultAccepts, defaultExternalUrl,
}: {
  platformLabel: string; externalLabel: string; externalHint: string;
  defaultAccepts: boolean; defaultExternalUrl?: string;
}) {
  const [mode, setMode] = useState<"platform" | "external">(
    !defaultAccepts && defaultExternalUrl ? "external" : "platform",
  );
  return (
    <div>
      <input type="hidden" name="acceptsBookings" value={mode === "platform" ? "true" : "false"} />
      <div className="grid gap-2 sm:grid-cols-2">
        <ModeBtn active={mode === "platform"} onClick={() => setMode("platform")} title={platformLabel} />
        <ModeBtn active={mode === "external"} onClick={() => setMode("external")} title={externalLabel} />
      </div>
      {mode === "external" && (
        <div className="mt-3">
          <FormUrlField name="externalUrl" label={externalLabel} hint={externalHint} defaultValue={defaultExternalUrl} />
        </div>
      )}
    </div>
  );
}

function ModeBtn({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-left text-sm font-medium transition ${active ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]" : "border-[var(--color-border-strong)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"}`}
    >
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${active ? "border-[var(--color-pitch-500)]" : "border-[var(--color-border-strong)]"}`}>
        {active && <span className="h-2 w-2 rounded-full bg-[var(--color-pitch-500)]" />}
      </span>
      {title}
    </button>
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

function FormUrlField({ name, label, hint, defaultValue }: { name: string; label: string; hint?: string; defaultValue?: string }) {
  const normalise = (v: string) => {
    const t = v.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    return "https://" + t;
  };
  const [val, setVal] = useState(() => normalise(defaultValue ?? ""));
  const fullUrl = val; // always has https:// or is empty
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      {/* Hidden input submits the full normalised URL (with https://) */}
      <input type="hidden" name={name} value={fullUrl} />
      <div className={`flex items-center overflow-hidden rounded-[var(--radius-md)] border transition focus-within:border-[var(--color-pitch-500)] focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20 ${val ? "border-[var(--color-pitch-500)]" : "border-[var(--color-border-strong)]"}`}>
        <span className="select-none border-r border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-2.5 text-sm text-[var(--color-muted)]">https://</span>
        <input
          type="text"
          value={val.replace(/^https?:\/\//i, "")}
          onChange={(e) => setVal(e.target.value ? normalise(e.target.value) : "")}
          onBlur={(e) => setVal(normalise(e.target.value))}
          placeholder="monkeycup.eu"
          className="flex-1 bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
          autoComplete="url"
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </div>
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

// ─────────────────────────────────────────────────────────────
// List builder — "What's included" / "Not included"
// ─────────────────────────────────────────────────────────────
function ListBuilder({
  name, label, hint, addLabel, defaultValue,
}: { name: string; label: string; hint?: string; addLabel: string; defaultValue?: string }) {
  const [items, setItems] = useState<string[]>(() =>
    defaultValue?.split("\n").map((s) => s.trim()).filter(Boolean) ?? []
  );

  const add = () => setItems((p) => [...p, ""]);
  const remove = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) => setItems((p) => p.map((x, idx) => (idx === i ? v : x)));

  return (
    <div>
      <input type="hidden" name={name} value={items.join("\n")} />
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-2 py-1.5 last:border-b-0">
            <span className="text-[var(--color-muted)]">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="grid h-6 w-6 place-items-center rounded text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-4 text-center text-sm text-[var(--color-muted)]">—</div>
        )}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-pitch-600)] transition hover:text-[var(--color-pitch-800)]"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Programme builder — day-by-day schedule
// ─────────────────────────────────────────────────────────────
type PDay = { title: string; items: string[] };

function parseProgrammeDefault(raw?: string): PDay[] {
  if (!raw?.trim()) return [];
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
  // Legacy plain-text: blank line separates days
  const days: PDay[] = [];
  let cur: PDay | null = null;
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) { if (cur) { days.push(cur); cur = null; } continue; }
    if (!cur) cur = { title: line, items: [] };
    else cur.items.push(line);
  }
  if (cur) days.push(cur);
  return days;
}

function FormProgrammeEditor({ name, labels, defaultValue }: {
  name: string;
  labels: Pick<EventFormLabels, "programme" | "programmeHint" | "programmeDayTitle" | "programmeDayItems" | "programmeAddDay" | "programmeRemoveDay" | "programmeAddItem">;
  defaultValue?: string;
}) {
  const [days, setDays] = useState<PDay[]>(() => parseProgrammeDefault(defaultValue));

  const updateDay = (idx: number, patch: Partial<PDay>) =>
    setDays(days.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  const updateItem = (di: number, ii: number, v: string) =>
    setDays(days.map((d, i) => i === di ? { ...d, items: d.items.map((x, j) => (j === ii ? v : x)) } : d));
  const addDay = () => setDays([...days, { title: "", items: [""] }]);
  const removeDay = (idx: number) => setDays(days.filter((_, i) => i !== idx));
  const addItem = (di: number) =>
    setDays(days.map((d, i) => (i === di ? { ...d, items: [...d.items, ""] } : d)));
  const removeItem = (di: number, ii: number) =>
    setDays(days.map((d, i) => (i === di ? { ...d, items: d.items.filter((_, j) => j !== ii) } : d)));

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.programme}</span>
      <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.programmeHint}</p>
      <input type="hidden" name={name} value={JSON.stringify(days)} />
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
              <button
                type="button"
                onClick={() => removeDay(i)}
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600"
                aria-label={labels.programmeRemoveDay}
              >
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
      <button
        type="button"
        onClick={addDay}
        className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
      >
        <Plus className="h-4 w-4" /> {labels.programmeAddDay}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ builder — Q/A pairs
// ─────────────────────────────────────────────────────────────
type Qa = { q: string; a: string };

function parseFaqDefault(raw?: string): Qa[] {
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
  // Legacy: "Q: …" / "A: …" pairs
  const qas: Qa[] = [];
  let cur: Partial<Qa> | null = null;
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) { if (cur?.q && cur.a) qas.push({ q: cur.q, a: cur.a }); cur = null; continue; }
    if (line.toLowerCase().startsWith("q:")) cur = { q: line.slice(2).trim(), a: "" };
    else if (line.toLowerCase().startsWith("a:") && cur) cur.a = line.slice(2).trim();
  }
  if (cur?.q && cur.a) qas.push({ q: cur.q, a: cur.a });
  return qas;
}

function FormFaqEditor({ name, labels, defaultValue }: {
  name: string;
  labels: Pick<EventFormLabels, "faq" | "faqHint" | "faqQuestion" | "faqAnswer" | "faqAddQuestion" | "faqRemoveQuestion">;
  defaultValue?: string;
}) {
  const [items, setItems] = useState<Qa[]>(() => parseFaqDefault(defaultValue));

  const update = (i: number, patch: Partial<Qa>) =>
    setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = () => setItems([...items, { q: "", a: "" }]);
  const remove = (i: number) => setItems(items.filter((_, j) => j !== i));

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.faq}</span>
      <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.faqHint}</p>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
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
                  rows={2}
                  value={qa.a}
                  onChange={(e) => update(i, { a: e.target.value })}
                  placeholder={labels.faqAnswer}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:bg-[var(--color-surface)]"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted)] transition hover:bg-red-50 hover:text-red-600"
                aria-label={labels.faqRemoveQuestion}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
      >
        <Plus className="h-4 w-4" /> {labels.faqAddQuestion}
      </button>
    </div>
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

function SlugField({ name, defaultValue, error }: { name: string; defaultValue: string; error?: string }) {
  const [val, setVal] = useState(defaultValue);

  const normalise = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");

  return (
    <div>
      <input type="hidden" name={name} value={val} />
      <div
        className={[
          "flex overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
          error ? "border-red-400" : "border-[var(--color-border-strong)]",
        ].join(" ")}
      >
        <span className="flex shrink-0 items-center bg-[var(--color-bg-muted)] px-3 text-xs text-[var(--color-muted)] select-none">
          footballevents.eu/events/
        </span>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(normalise(e.target.value))}
          onBlur={(e) => setVal(normalise(e.target.value))}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        Preview: <a href={`${SITE_URL}/events/${val}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-pitch-700)]">{SITE_URL}/events/{val}</a>
      </p>
    </div>
  );
}

// ── Co-organizers & partners editor ──────────────────────────────
const PARTNER_L: Record<string, {
  title: string; hint: string; coorganizer: string; partner: string;
  namePh: string; urlPh: string; logo: string; logoBusy: string; addCo: string; addPartner: string; remove: string; searching: string;
}> = {
  en: { title: "Co-organizers & partners", hint: "Start typing a name — we search organizers already on FootballEvents. No match? It's added just to this event.",
    coorganizer: "Co-organizer", partner: "Partner", namePh: "Name", urlPh: "Website (optional)",
    logo: "Upload logo", logoBusy: "Uploading…", addCo: "Add co-organizer", addPartner: "Add partner", remove: "Remove", searching: "Searching…" },
  ru: { title: "Со-организаторы и партнёры", hint: "Начните вводить название — мы ищем среди организаторов FootballEvents. Нет совпадения? Добавится только в этот эвент.",
    coorganizer: "Со-организатор", partner: "Партнёр", namePh: "Название", urlPh: "Сайт (необязательно)",
    logo: "Загрузить лого", logoBusy: "Загрузка…", addCo: "Добавить со-организатора", addPartner: "Добавить партнёра", remove: "Удалить", searching: "Поиск…" },
  de: { title: "Co-Organisatoren & Partner", hint: "Tippe einen Namen — wir suchen unter FootballEvents-Organisatoren. Kein Treffer? Wird nur zu diesem Event hinzugefügt.",
    coorganizer: "Co-Organisator", partner: "Partner", namePh: "Name", urlPh: "Website (optional)",
    logo: "Logo hochladen", logoBusy: "Lädt…", addCo: "Co-Organisator hinzufügen", addPartner: "Partner hinzufügen", remove: "Entfernen", searching: "Suche…" },
  es: { title: "Coorganizadores y socios", hint: "Empieza a escribir un nombre — buscamos entre organizadores de FootballEvents. ¿Sin coincidencia? Se añade solo a este evento.",
    coorganizer: "Coorganizador", partner: "Socio", namePh: "Nombre", urlPh: "Sitio web (opcional)",
    logo: "Subir logo", logoBusy: "Subiendo…", addCo: "Añadir coorganizador", addPartner: "Añadir socio", remove: "Quitar", searching: "Buscando…" },
};

function FormPartnersEditor({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const t = PARTNER_L[useLocale()] ?? PARTNER_L.en;
  const [items, setItems] = useState<Partner[]>(() => parsePartners(defaultValue));
  const update = (i: number, patch: Partial<Partner>) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const add = (kind: Partner["kind"]) => setItems((p) => [...p, { kind, name: "" }]);
  const remove = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const inputCls = "min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)]";

  return (
    <Section title={t.title} hint={t.hint}>
      <input type="hidden" name={name} value={JSON.stringify(items.filter((x) => x.name.trim()))} />
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={it.kind}
                  onChange={(e) => update(i, { kind: e.target.value as Partner["kind"] })}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-2 text-sm"
                >
                  <option value="coorganizer">{t.coorganizer}</option>
                  <option value="partner">{t.partner}</option>
                </select>
                <PartnerNameField
                  value={it.name}
                  placeholder={t.namePh}
                  searchingLabel={t.searching}
                  onText={(nm) => update(i, { name: nm, organizerId: undefined })}
                  onPick={(o) => update(i, { name: o.name, logoUrl: o.logoUrl, url: o.url, organizerId: o.organizerId })}
                />
                <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label={t.remove}><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input value={it.url ?? ""} onChange={(e) => update(i, { url: e.target.value })} placeholder={t.urlPh} className={inputCls} />
                <PartnerLogoUpload url={it.logoUrl} onChange={(u) => update(i, { logoUrl: u })} label={t.logo} busyLabel={t.logoBusy} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => add("coorganizer")} className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)]"><Plus className="h-4 w-4" /> {t.addCo}</button>
        <button type="button" onClick={() => add("partner")} className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)]"><Plus className="h-4 w-4" /> {t.addPartner}</button>
      </div>
    </Section>
  );
}

function PartnerLogoUpload({ url, onChange, label, busyLabel }: { url?: string; onChange: (u: string) => void; label: string; busyLabel: string }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return;
    setBusy(true);
    try {
      const pres = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "event-logo", contentType: file.type, size: file.size }),
      });
      if (!pres.ok) throw new Error("presign");
      const { uploadUrl, publicUrl } = await pres.json();
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("put");
      onChange(publicUrl);
    } catch {
      /* non-fatal */
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-2" data-pending-upload={busy ? "1" : "0"}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-10 w-10 rounded-[var(--radius-md)] border border-[var(--color-border)] object-contain bg-white" />
      )}
      <button type="button" onClick={() => ref.current?.click()} className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)]">
        {busy ? busyLabel : label}
      </button>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />
    </div>
  );
}

type OrgHit = { id: string; name: string; slug: string; logoUrl: string | null };

/** Name field that searches existing platform organizers as you type. Pick a hit
 *  to link it (fills logo + link to /org/<slug>); otherwise it's free text. */
function PartnerNameField({ value, placeholder, searchingLabel, onText, onPick }: {
  value: string;
  placeholder: string;
  searchingLabel: string;
  onText: (name: string) => void;
  onPick: (o: { name: string; logoUrl?: string; url: string; organizerId: string }) => void;
}) {
  const [hits, setHits] = useState<OrgHit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  function onChange(v: string) {
    onText(v);
    if (timer.current) clearTimeout(timer.current);
    const q = v.trim();
    if (q.length < 2) { setHits([]); setOpen(false); return; }
    setBusy(true);
    timer.current = setTimeout(async () => {
      const mine = ++seq.current;
      try {
        const r = await fetch(`/api/search/organizers?q=${encodeURIComponent(q)}`);
        const j = r.ok ? await r.json() : { items: [] };
        if (mine !== seq.current) return; // a newer keystroke won
        setHits(j.items ?? []);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 250);
  }

  const inputCls = "min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)]";

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputCls}
      />
      {open && (hits.length > 0 || busy) && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md)]">
          {busy && hits.length === 0 && <li className="px-3 py-2 text-xs text-[var(--color-muted)]">{searchingLabel}</li>}
          {hits.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onPick({ name: o.name, logoUrl: o.logoUrl ?? undefined, url: `/org/${o.slug}`, organizerId: o.id }); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-muted)]"
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white bg-contain bg-center bg-no-repeat"
                  style={o.logoUrl ? { backgroundImage: `url(${o.logoUrl})` } : undefined}
                />
                <span className="truncate font-medium text-[var(--color-foreground)]">{o.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
