"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrganizerSettingsAction, type OrganizerSettingsState } from "@/app/actions/organizer";
import { openBillingPortal } from "@/app/actions/billing";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { Combobox } from "@/components/ui/Combobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { Link } from "@/i18n/navigation";
import { ExternalLink } from "lucide-react";

type Labels = {
  // sections
  settingsProfile: string;
  settingsContent: string;
  settingsImages: string;
  settingsSocial: string;
  settingsBilling: string;
  settingsSaved: string;
  settingsSaveError: string;
  settingsSave: string;
  settingsSaving: string;
  // profile fields
  name: string; nameHint: string;
  legalName: string; legalNameHint: string;
  email: string; phone: string; website: string;
  country: string; city: string;
  activityTypes: string; activityTypesHint: string;
  // content
  englishSection: string; englishSectionHint: string;
  secondSection: string; secondSectionHint: string;
  secondLanguagePicker: string;
  taglineEn: string; aboutEn: string;
  taglineSecond: string; aboutSecond: string;
  taglineHint: string; aboutHint: string;
  langNone: string; langRu: string; langDe: string; langEs: string;
  // images
  logoUrl: string; coverUrl: string;
  // social
  socialInstagram: string; socialFacebook: string; socialX: string;
  socialTikTok: string; socialYouTube: string; socialWhatsApp: string;
  socialUrlPlaceholder: string;
  // billing
  tier: string; currentPlan: string;
  planRenews: string; planExpired: string;
  manageBilling: string; upgradePlan: string;
};

type OrganizerData = {
  name: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  countryCode: string | null;
  city: string | null;
  activityTypes: string[];
  logoUrl: string | null;
  coverUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
  subscriptionTier: string;
  subscriptionEndsAt: string | null;
  stripeCustomerId: string | null;
  translations: { locale: string; tagline: string | null; about: string | null }[];
};

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  );
}

function Field({
  name, label, hint, required, error, defaultValue, placeholder, type = "text", maxLength,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; placeholder?: string; type?: string; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
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
        required={required}
        rows={rows}
        defaultValue={defaultValue ?? ""}
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

function SocialField({
  name, label, defaultValue, placeholder, icon,
}: {
  name: string; label: string; defaultValue?: string; placeholder?: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition focus-within:border-[var(--color-pitch-500)] focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20">
        <span className="flex items-center border-r border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 text-[var(--color-muted)]">
          {icon}
        </span>
        <input
          name={name}
          type="url"
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none"
        />
      </div>
    </label>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
      {title}
    </h2>
  );
}

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]",
  PRO: "bg-blue-100 text-blue-800",
  PREMIUM: "bg-amber-100 text-amber-800",
  ENTERPRISE: "bg-purple-100 text-purple-800",
};

export function OrganizerSettingsForm({
  organizer,
  countries,
  activityOptions,
  locale,
  labels,
}: {
  organizer: OrganizerData;
  countries: { code: string; name: string; flag: string }[];
  activityOptions: { value: string; label: string }[];
  locale: string;
  labels: Labels;
}) {
  const [state, action] = useActionState<OrganizerSettingsState, FormData>(
    updateOrganizerSettingsAction,
    null,
  );
  const [countryCode, setCountryCode] = useState(organizer.countryCode ?? "");
  const [secondLocale, setSecondLocale] = useState(() => {
    const found = organizer.translations.find((t) => t.locale !== "en");
    return found?.locale ?? "";
  });

  const enTrans = organizer.translations.find((t) => t.locale === "en");
  const secondTrans = organizer.translations.find((t) => t.locale === secondLocale);

  const fe = state?.fieldErrors ?? {};

  const isPaid = organizer.subscriptionTier !== "FREE";
  const endsAt = organizer.subscriptionEndsAt ? new Date(organizer.subscriptionEndsAt) : null;
  const expired = endsAt ? endsAt < new Date() : false;

  return (
    <form action={action} className="space-y-8">

      {/* ── Profile ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
        <SectionHeading title={labels.settingsProfile} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="name" required label={labels.name} hint={labels.nameHint} defaultValue={organizer.name} error={fe.name} />
          <Field name="legalName" label={labels.legalName} hint={labels.legalNameHint} defaultValue={organizer.legalName ?? ""} error={fe.legalName} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="email" required type="email" label={labels.email} defaultValue={organizer.email} error={fe.email} />
          <Field name="phone" label={labels.phone} placeholder="+49 …" defaultValue={organizer.phone ?? ""} error={fe.phone} />
        </div>
        <Field name="website" label={labels.website} placeholder="https://…" defaultValue={organizer.website ?? ""} error={fe.website} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Combobox
            name="countryCode"
            label={labels.country}
            placeholder="—"
            defaultValue={organizer.countryCode ?? ""}
            items={countries.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))}
            onValueChange={setCountryCode}
            error={fe.countryCode}
          />
          <CityCombobox
            name="city"
            label={labels.city}
            countryCode={countryCode}
            defaultValue={organizer.city ?? ""}
            error={fe.city}
          />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.activityTypes}
          </legend>
          <p className="mb-3 text-xs text-[var(--color-muted)]">{labels.activityTypesHint}</p>
          <div className="flex flex-wrap gap-2">
            {activityOptions.map((o) => (
              <label
                key={o.value}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)] transition has-[:checked]:border-[var(--color-pitch-500)] has-[:checked]:bg-[var(--color-pitch-50)] has-[:checked]:text-[var(--color-pitch-700)]"
              >
                <input
                  type="checkbox"
                  name="activityTypes"
                  value={o.value}
                  defaultChecked={organizer.activityTypes.includes(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* ── Content / Translations ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
        <SectionHeading title={labels.settingsContent} />

        <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
          <legend className="px-2">
            <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.englishSection}</span>
            <span className="ml-2 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">EN</span>
          </legend>
          <p className="text-xs text-[var(--color-muted)]">{labels.englishSectionHint}</p>
          <Field name="taglineEn" required label={labels.taglineEn} hint={labels.taglineHint} maxLength={120} defaultValue={enTrans?.tagline ?? ""} error={fe.taglineEn} />
          <TextareaField name="aboutEn" required label={labels.aboutEn} hint={labels.aboutHint} rows={4} defaultValue={enTrans?.about ?? ""} error={fe.aboutEn} />
        </fieldset>

        <fieldset className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-4">
          <legend className="px-2">
            <span className="text-sm font-bold text-[var(--color-foreground)]">{labels.secondSection}</span>
            <span className="ml-2 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {secondLocale ? secondLocale.toUpperCase() : "—"}
            </span>
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
              <Field name="taglineSecond" label={labels.taglineSecond} hint={labels.taglineHint} maxLength={120} defaultValue={secondTrans?.tagline ?? ""} error={fe.taglineSecond} />
              <TextareaField name="aboutSecond" label={labels.aboutSecond} hint={labels.aboutHint} rows={4} defaultValue={secondTrans?.about ?? ""} error={fe.aboutSecond} />
            </>
          )}
        </fieldset>
      </section>

      {/* ── Images ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
        <SectionHeading title={labels.settingsImages} />
        <ImageUpload name="logoUrl" kind="organizer-logo" label={labels.logoUrl} defaultUrl={organizer.logoUrl ?? undefined} />
        <ImageUpload name="coverUrl" kind="organizer-cover" label={labels.coverUrl} defaultUrl={organizer.coverUrl ?? undefined} />
      </section>

      {/* ── Social Media ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
        <SectionHeading title={labels.settingsSocial} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SocialField name="instagramUrl" label={labels.socialInstagram} defaultValue={organizer.instagramUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-[10px] font-bold">IG</span>} />
          <SocialField name="facebookUrl" label={labels.socialFacebook} defaultValue={organizer.facebookUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-[10px] font-bold">FB</span>} />
          <SocialField name="xUrl" label={labels.socialX} defaultValue={organizer.xUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-xs font-bold leading-none">𝕏</span>} />
          <SocialField name="tiktokUrl" label={labels.socialTikTok} defaultValue={organizer.tiktokUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-[10px] font-bold">TT</span>} />
          <SocialField name="youtubeUrl" label={labels.socialYouTube} defaultValue={organizer.youtubeUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-[10px] font-bold">YT</span>} />
          <SocialField name="whatsappUrl" label={labels.socialWhatsApp} defaultValue={organizer.whatsappUrl ?? ""} placeholder={labels.socialUrlPlaceholder} icon={<span className="text-[10px] font-bold">WA</span>} />
        </div>
      </section>

      {/* ── Plan & Billing ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <SectionHeading title={labels.settingsBilling} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted-strong)]">{labels.currentPlan}</span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${TIER_COLORS[organizer.subscriptionTier] ?? TIER_COLORS.FREE}`}>
            {organizer.subscriptionTier}
          </span>
        </div>
        {endsAt && (
          <p className={`text-sm ${expired ? "text-red-600" : "text-[var(--color-muted-strong)]"}`}>
            {expired
              ? labels.planExpired.replace("{date}", endsAt.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }))
              : labels.planRenews.replace("{date}", endsAt.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }))}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-1">
          {!isPaid && (
            <Button asChild variant="accent" size="lg">
              <Link href="/pricing">{labels.upgradePlan} <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {organizer.stripeCustomerId && (
            <form action={openBillingPortal}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="lg">{labels.manageBilling}</Button>
            </form>
          )}
          {isPaid && !organizer.stripeCustomerId && (
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">{labels.upgradePlan} <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>
      </section>

      {/* ── Status + Submit ── */}
      {state?.ok && (
        <p className="rounded-[var(--radius-md)] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {labels.settingsSaved}
        </p>
      )}
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitBtn label={labels.settingsSave} loadingLabel={labels.settingsSaving} />
    </form>
  );
}
