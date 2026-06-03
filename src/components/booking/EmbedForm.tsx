"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPublicRegistrationAction, type BookingFormState } from "@/app/actions/booking";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";
import { DynField } from "@/components/booking/ApplyForm";
import type { FormField } from "@/lib/forms/types";

const cls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

type Labels = {
  participantName: string; teamName: string; partySize: string;
  contactEmail: string; contactPhone: string; comment: string;
  submit: string; submitting: string; successTitle: string; successBody: string;
};

export function EmbedForm({ eventId, fields, labels }: { eventId: string; fields: FormField[]; labels: Labels }) {
  const [state, action] = useActionState<BookingFormState, FormData>(submitPublicRegistrationAction, null);

  if (state?.ok) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{labels.successTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.successBody}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      {/* Honeypot — hidden from humans, bots fill it and get silently dropped. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <L label={labels.participantName} req><input name="participantName" required className={cls} /></L>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label={labels.contactEmail} req><input name="contactEmail" type="email" required className={cls} /></L>
        <L label={labels.contactPhone}><input name="contactPhone" className={cls} /></L>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <L label={labels.teamName}><input name="teamName" className={cls} /></L>
        <L label={labels.partySize}><input name="partySize" type="number" defaultValue="1" min={1} className={cls} /></L>
      </div>
      <L label={labels.comment}><textarea name="comment" rows={3} className={cls} /></L>

      {fields.map((f) => <DynField key={f.id} f={f} />)}

      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <SubmitBtn label={labels.submit} loadingLabel={labels.submitting} />
    </form>
  );
}

function L({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}{req ? " *" : ""}</span>
      {children}
    </label>
  );
}

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>{pending ? loadingLabel : label}</Button>;
}
