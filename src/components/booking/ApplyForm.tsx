"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { applyEventAction, type BookingFormState } from "@/app/actions/booking";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";

type Labels = {
  participantName: string; teamName: string; partySize: string;
  contactEmail: string; contactPhone: string;
  comment: string; commentHint: string;
  submit: string; submitting: string;
  successTitle: string; successBody: string; viewMine: string;
};

export function ApplyForm({
  eventId,
  defaultEmail,
  defaultName,
  labels,
}: {
  eventId: string;
  defaultEmail: string;
  defaultName: string;
  labels: Labels;
}) {
  const [state, action] = useActionState<BookingFormState, FormData>(applyEventAction, null);

  if (state?.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{labels.successTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.successBody}</p>
        <Button asChild variant="accent" size="lg" className="mt-6">
          <Link href="/me/applications">{labels.viewMine}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <Field name="participantName" required defaultValue={defaultName} label={labels.participantName} />
      <Field name="partySize" type="number" defaultValue="1" label={labels.partySize} />
      <Field name="teamName" label={labels.teamName} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="contactEmail" type="email" required defaultValue={defaultEmail} label={labels.contactEmail} />
        <Field name="contactPhone" label={labels.contactPhone} />
      </div>
      <Textarea name="comment" rows={4} label={labels.comment} hint={labels.commentHint} />

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitBtn label={labels.submit} loadingLabel={labels.submitting} />
    </form>
  );
}

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  );
}

function Field({
  name, label, type = "text", required, defaultValue,
}: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string | number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <input
        name={name} type={type} required={required} defaultValue={defaultValue}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      />
    </label>
  );
}

function Textarea({ name, label, hint, rows = 3 }: { name: string; label: string; hint?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <textarea
        name={name} rows={rows}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      />
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
}
