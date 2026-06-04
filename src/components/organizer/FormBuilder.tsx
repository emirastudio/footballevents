"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { saveRegistrationFormAction, type FormBuilderState } from "@/app/actions/registration-form";
import {
  FIELD_TYPE_LABELS, hasOptions, isDisplayField,
  type FieldType, type FormField, type SizeChart,
} from "@/lib/forms/types";
import {
  Trash2, ChevronUp, ChevronDown, GripVertical,
  Type, AlignLeft, Mail, Phone, Hash, Calendar, ChevronDownSquare, ListChecks,
  CheckSquare, CircleDot, SquareCheck, ScrollText, Shirt, Globe, Heading, Info, Paperclip,
  MapPin, ToggleRight,
  type LucideIcon,
} from "lucide-react";

const ALL_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[];

const TYPE_ICONS: Record<FieldType, LucideIcon> = {
  text: Type, textarea: AlignLeft, email: Mail, phone: Phone, number: Hash,
  date: Calendar, select: ChevronDownSquare, multiselect: ListChecks,
  checkboxes: CheckSquare, radio: CircleDot, consent: SquareCheck,
  rules: ScrollText, size: Shirt, country: Globe, countrycity: MapPin, yesno: ToggleRight,
  heading: Heading, info: Info, file: Paperclip,
};

function newId() {
  try { return crypto.randomUUID().slice(0, 8); } catch { return Math.abs(Date.now() % 1e8).toString(36); }
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

function chartToText(c?: SizeChart): string {
  if (!c) return "";
  return [c.headers.join(", "), ...c.rows.map((r) => r.join(", "))].join("\n");
}
function textToChart(t: string): SizeChart | undefined {
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return undefined;
  const [head, ...rest] = lines;
  return { headers: head.split(",").map((s) => s.trim()), rows: rest.map((l) => l.split(",").map((s) => s.trim())) };
}

export function FormBuilder({
  eventId, initialFields, labels, typeLabels, baseLocale,
}: {
  eventId: string;
  initialFields: FormField[];
  baseLocale: string;
  typeLabels: Record<FieldType, string>;
  labels: { title: string; subtitle: string; addField: string; fieldLabel: string; required: string; help: string; options: string; optionsHint: string; sizeChart: string; sizeChartHint: string; rulesText: string; save: string; saving: string; saved: string; empty: string };
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [state, action] = useActionState<FormBuilderState, FormData>(saveRegistrationFormAction, null);

  const addType = (t: FieldType) =>
    setFields((p) => [...p, { id: newId(), type: t, label: typeLabels[t], required: false }]);
  const update = (i: number, patch: Partial<FormField>) =>
    setFields((p) => p.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i: number) => setFields((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setFields((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="baseLocale" value={baseLocale} />
      <input type="hidden" name="form" value={JSON.stringify({ fields })} />

      <div>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{labels.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{labels.subtitle}</p>
      </div>

      {/* Add field — click a type tile to append it */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{labels.addField}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ALL_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => addType(t)}
                className="group flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-left transition hover:border-[var(--color-pitch-400)] hover:bg-[var(--color-pitch-50)]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)] transition group-hover:bg-[var(--color-pitch-100)] group-hover:text-[var(--color-pitch-700)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-medium text-[var(--color-foreground)]">{typeLabels[t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {fields.length === 0 && (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-6 text-center text-sm text-[var(--color-muted)]">{labels.empty}</p>
      )}

      {/* Field list */}
      <div className="space-y-3">
        {fields.map((f, i) => {
          const Icon = TYPE_ICONS[f.type];
          return (
          <div key={f.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                <Icon className="h-3.5 w-3.5" /> {typeLabels[f.type]}
              </span>
              <span className="ml-auto mr-1 text-[var(--color-border-strong)]"><GripVertical className="h-4 w-4" /></span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-bg-muted)]" aria-label="up"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-bg-muted)]" aria-label="down"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label="delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">{labels.fieldLabel}</label>
            <input className={inputCls} value={f.label} onChange={(e) => update(i, { label: e.target.value })} />

            {f.type === "rules" ? (
              <textarea
                className={`${inputCls} mt-2`} rows={4}
                placeholder={labels.rulesText}
                value={f.help ?? ""}
                onChange={(e) => update(i, { help: e.target.value })}
              />
            ) : !isDisplayField(f.type) && (
              <input
                className={`${inputCls} mt-2`}
                placeholder={labels.help}
                value={f.help ?? ""}
                onChange={(e) => update(i, { help: e.target.value })}
              />
            )}

            {hasOptions(f.type) && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">{labels.options} <span className="font-normal text-[var(--color-muted)]">— {labels.optionsHint}</span></label>
                <textarea
                  className={inputCls} rows={3}
                  value={(f.options ?? []).join("\n")}
                  onChange={(e) => update(i, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
            )}

            {f.type === "size" && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">{labels.sizeChart} <span className="font-normal text-[var(--color-muted)]">— {labels.sizeChartHint}</span></label>
                <textarea
                  className={`${inputCls} font-[family-name:var(--font-mono,monospace)]`} rows={4}
                  placeholder={"Size, Chest, Length\nS, 96, 70\nM, 102, 72"}
                  value={chartToText(f.sizeChart)}
                  onChange={(e) => update(i, { sizeChart: textToChart(e.target.value) })}
                />
              </div>
            )}

            {!isDisplayField(f.type) && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[var(--color-muted-strong)]">
                <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} />
                {labels.required}
              </label>
            )}
          </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 py-3 backdrop-blur">
        <SaveBtn save={labels.save} saving={labels.saving} />
        {state?.ok && <span className="text-sm font-semibold text-[var(--color-pitch-700)]">{labels.saved}</span>}
        {state?.error && <span className="text-sm font-semibold text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

function SaveBtn({ save, saving }: { save: string; saving: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="accent" size="lg" disabled={pending}>{pending ? saving : save}</Button>;
}
