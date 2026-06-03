"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { applyEventAction, type BookingFormState } from "@/app/actions/booking";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import type { FormField } from "@/lib/forms/types";

const dynInputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

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
  fields = [],
}: {
  eventId: string;
  defaultEmail: string;
  defaultName: string;
  labels: Labels;
  fields?: FormField[];
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

      {fields.map((f) => <DynField key={f.id} f={f} />)}

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

function FieldShell({ f, children }: { f: FormField; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {f.label}{f.required ? " *" : ""}
      </span>
      {children}
      {f.help && <span className="mt-1 block text-xs text-[var(--color-muted)]">{f.help}</span>}
    </label>
  );
}

/** Renders one custom field. Inputs are named cf_<id> so the action reads them. */
export function DynField({ f }: { f: FormField }) {
  const name = `cf_${f.id}`;
  const opts = f.options ?? [];

  if (f.type === "heading")
    return <h3 className="pt-2 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{f.label}</h3>;
  if (f.type === "info")
    return <p className="text-sm text-[var(--color-muted-strong)]">{f.label}</p>;

  if (f.type === "textarea")
    return <FieldShell f={f}><textarea name={name} rows={4} required={f.required} placeholder={f.placeholder} className={dynInputCls} /></FieldShell>;

  if (f.type === "select" || f.type === "country")
    return (
      <FieldShell f={f}>
        <select name={name} required={f.required} defaultValue="" className={dynInputCls}>
          <option value="" disabled>—</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </FieldShell>
    );

  if (f.type === "size")
    return (
      <FieldShell f={f}>
        <select name={name} required={f.required} defaultValue="" className={dynInputCls}>
          <option value="" disabled>—</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {f.sizeChart && f.sizeChart.headers.length > 0 && (
          <div className="mt-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead><tr className="bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]">
                {f.sizeChart.headers.map((h, i) => <th key={i} className="px-2.5 py-1.5 text-left font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {f.sizeChart.rows.map((r, ri) => (
                  <tr key={ri} className="border-t border-[var(--color-border)]">
                    {r.map((c, ci) => <td key={ci} className="px-2.5 py-1.5 tabular-nums text-[var(--color-foreground)]">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FieldShell>
    );

  if (f.type === "radio")
    return (
      <FieldShell f={f}>
        <div className="space-y-1.5">
          {opts.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input type="radio" name={name} value={o} required={f.required} /> {o}
            </label>
          ))}
        </div>
      </FieldShell>
    );

  if (f.type === "checkboxes" || f.type === "multiselect")
    return (
      <FieldShell f={f}>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {opts.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input type="checkbox" name={name} value={o} /> {o}
            </label>
          ))}
        </div>
      </FieldShell>
    );

  if (f.type === "rules")
    return (
      <div className="space-y-2">
        {f.help && (
          <div className="max-h-44 overflow-y-auto whitespace-pre-line rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 text-sm text-[var(--color-muted-strong)]">
            {f.help}
          </div>
        )}
        <label className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
          <input type="checkbox" name={name} value="yes" required={f.required} className="mt-0.5" />
          <span>{f.label}{f.required ? " *" : ""}</span>
        </label>
      </div>
    );

  if (f.type === "consent")
    return (
      <label className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
        <input type="checkbox" name={name} value="yes" required={f.required} className="mt-0.5" />
        <span>{f.label}{f.required ? " *" : ""}</span>
      </label>
    );

  // text / email / phone / number / date
  const inputType = f.type === "phone" ? "tel" : f.type;
  return (
    <FieldShell f={f}>
      <input name={name} type={inputType} required={f.required} placeholder={f.placeholder} className={dynInputCls} />
    </FieldShell>
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
