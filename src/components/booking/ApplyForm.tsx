"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale } from "next-intl";
import { applyEventAction, type BookingFormState } from "@/app/actions/booking";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import type { FormField } from "@/lib/forms/types";
import { COUNTRY_OPTIONS } from "@/lib/forms/country-options";

// Small localised UI strings for built-in field widgets (not organizer-authored).
const UI_STRINGS: Record<string, { country: string; city: string; yes: string; no: string }> = {
  en: { country: "Country", city: "City", yes: "Yes", no: "No" },
  ru: { country: "Страна", city: "Город", yes: "Да", no: "Нет" },
  de: { country: "Land", city: "Stadt", yes: "Ja", no: "Nein" },
  es: { country: "País", city: "Ciudad", yes: "Sí", no: "No" },
};
function uiStrings(locale: string) {
  return UI_STRINGS[locale] ?? UI_STRINGS.en;
}

const dynInputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

type Labels = {
  participantName: string; teamName: string; partySize: string;
  contactEmail: string; contactPhone: string;
  comment: string; commentHint: string;
  submit: string; submitting: string;
  successTitle: string; successBody: string; viewMine: string; another: string;
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
  const locale = useLocale();

  if (state?.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{labels.successTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.successBody}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* Reload the page for a fresh, empty form — e.g. to register a 2nd child. */}
          <Button variant="accent" size="lg" onClick={() => window.location.reload()}>
            {labels.another}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/me/applications">{labels.viewMine}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="locale" value={locale} />
      {/* Custom form (built by the organizer) fully replaces the standard fields.
          Name + email come from the signed-in account server-side. */}
      {fields.length > 0 ? (
        fields.map((f) => <DynField key={f.id} f={f} />)
      ) : (
        <>
          <Field name="participantName" required defaultValue={defaultName} label={labels.participantName} />
          <Field name="partySize" type="number" defaultValue="1" label={labels.partySize} />
          <Field name="teamName" label={labels.teamName} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="contactEmail" type="email" required defaultValue={defaultEmail} label={labels.contactEmail} />
            <Field name="contactPhone" label={labels.contactPhone} />
          </div>
          <Textarea name="comment" rows={4} label={labels.comment} hint={labels.commentHint} />
        </>
      )}

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

  if (f.type === "countrycity") return <CountryCityField f={f} name={name} />;

  if (f.type === "yesno") return <YesNoField f={f} name={name} />;

  if (f.type === "file") return <FileUpload f={f} name={name} />;

  // text / email / phone / number / date
  const inputType = f.type === "phone" ? "tel" : f.type;
  return (
    <FieldShell f={f}>
      <input name={name} type={inputType} required={f.required} placeholder={f.placeholder} className={dynInputCls} />
    </FieldShell>
  );
}

function FileUpload({ f, name }: { f: FormField; name: string }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setUrl("");
    try {
      const pres = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "registration-file", contentType: file.type, size: file.size }),
      });
      if (!pres.ok) throw new Error("presign");
      const { uploadUrl, publicUrl } = await pres.json();
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("put");
      setUrl(publicUrl);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <FieldShell f={f}>
      <input type="hidden" name={name} value={url} />
      <input
        type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onChange}
        className="block w-full text-sm text-[var(--color-muted-strong)] file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-pitch-50)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-pitch-700)]"
      />
      {status === "uploading" && <span className="mt-1 block text-xs text-[var(--color-muted)]">…</span>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs font-semibold text-[var(--color-pitch-700)]">✓</a>}
      {status === "error" && <span className="mt-1 block text-xs text-red-600">upload failed</span>}
    </FieldShell>
  );
}

/** Combined Country (searchable, with flag) + City. Submits one combined value
 *  ("🇩🇪 Germany — Berlin") in the hidden cf_<id> input. */
function CountryCityField({ f, name }: { f: FormField; name: string }) {
  const s = uiStrings(useLocale());
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const combined = country.trim() ? (city.trim() ? `${country.trim()} — ${city.trim()}` : country.trim()) : "";
  const listId = `cc-${f.id}`;
  return (
    <FieldShell f={f}>
      <input type="hidden" name={name} value={combined} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          list={listId}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required={f.required}
          placeholder={s.country}
          autoComplete="off"
          className={dynInputCls}
        />
        <datalist id={listId}>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.n} value={`${c.f} ${c.n}`} />
          ))}
        </datalist>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={s.city}
          autoComplete="off"
          className={dynInputCls}
        />
      </div>
    </FieldShell>
  );
}

/** A single Yes / No choice (submits "yes" or "no" in cf_<id>). */
function YesNoField({ f, name }: { f: FormField; name: string }) {
  const s = uiStrings(useLocale());
  return (
    <FieldShell f={f}>
      <div className="flex gap-5">
        {([["yes", s.yes], ["no", s.no]] as const).map(([v, lbl]) => (
          <label key={v} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input type="radio" name={name} value={v} required={f.required} /> {lbl}
          </label>
        ))}
      </div>
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
