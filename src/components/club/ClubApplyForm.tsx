"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale } from "next-intl";
import { applyClubToEventAction, type BookingFormState } from "@/app/actions/booking";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";

type Labels = {
  pickTeam: string;
  pickTeamHint: string;
  partySize: string; partySizeHint: string;
  contactEmail: string; contactPhone: string;
  comment: string; commentHint: string;
  submit: string; submitting: string;
  successTitle: string; successBody: string;
  goDashboard: string; goEvent: string;
  noActiveTeams: string; createTeamCta: string;
};

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  format: string | null;
};

export function ClubApplyForm({
  eventId,
  eventSlug,
  teams,
  defaultEmail,
  labels,
}: {
  eventId: string;
  eventSlug: string;
  teams: Team[];
  defaultEmail: string;
  labels: Labels;
}) {
  const [state, action] = useActionState<BookingFormState, FormData>(applyClubToEventAction, null);
  const locale = useLocale();
  const fe = state?.fieldErrors ?? {};

  // Guard: a club with no active teams can't apply — point them to /club/teams.
  // The page wrapper also checks, but the form should never render itself broken.
  if (teams.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {labels.noActiveTeams}{" "}
        <Link href="/club/teams/new" className="font-semibold underline">
          {labels.createTeamCta}
        </Link>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
          {labels.successTitle}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.successBody}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="accent">
            <Link href="/club/applications">{labels.goDashboard}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/events/${eventSlug}`}>{labels.goEvent}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="locale" value={locale} />

      <SelectField
        name="clubTeamId" required
        label={labels.pickTeam}
        hint={labels.pickTeamHint}
        error={fe.clubTeamId}
        defaultValue={teams[0]?.id}
        options={teams.map((t) => ({
          value: t.id,
          label: `${t.name} — ${t.ageGroup}${t.format ? ` · ${t.format}` : ""}`,
        }))}
      />

      <Field
        name="partySize"
        type="number"
        label={labels.partySize}
        hint={labels.partySizeHint}
        defaultValue="1"
        placeholder="14"
        error={fe.partySize}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="contactEmail" type="email" required
          label={labels.contactEmail}
          defaultValue={defaultEmail}
          error={fe.contactEmail}
        />
        <Field
          name="contactPhone"
          label={labels.contactPhone}
          placeholder="+49 …"
          error={fe.contactPhone}
        />
      </div>

      <TextareaField
        name="comment"
        label={labels.comment}
        hint={labels.commentHint}
        rows={3}
        error={fe.comment}
      />

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitBtn labels={labels} />
    </form>
  );
}

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
      {pending ? labels.submitting : labels.submit}
    </Button>
  );
}

function Field({
  name, label, hint, required, error, defaultValue, placeholder, type,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
  defaultValue?: string; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
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

function SelectField({
  name, label, hint, required, error, defaultValue, options,
}: {
  name: string; label: string; hint?: string; required?: boolean; error?: string;
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
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

function TextareaField({
  name, label, hint, error, rows = 3,
}: {
  name: string; label: string; hint?: string; error?: string; rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name}
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
