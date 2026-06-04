"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOrgForAction } from "@/lib/organizer-access";
import { revalidatePath } from "next/cache";
import { parseForm, type FormField, type FieldI18n } from "@/lib/forms/types";
import { translateBatch } from "@/lib/translate";
import { locales } from "@/i18n/config";

export type FormBuilderState = { ok?: boolean; error?: string } | null;

/** Save an event's custom registration form (organizer-owned events only). */
export async function saveRegistrationFormAction(
  _prev: FormBuilderState,
  formData: FormData,
): Promise<FormBuilderState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const access = await getOrgForAction(session.user.id, "events");
  if (!access) return { error: "notOrganizer" };
  const organizer = access.organizer;

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { error: "missingEvent" };

  const ev = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true, slug: true } });
  if (!ev || ev.organizerId !== organizer.id) return { error: "notFound" };

  let fields: FormField[];
  try {
    const parsed = JSON.parse(String(formData.get("form") ?? "{}"));
    fields = parseForm(parsed).fields;
  } catch {
    return { error: "invalidForm" };
  }

  // Cap to keep the JSON sane.
  if (fields.length > 60) fields = fields.slice(0, 60);

  const baseLocale = String(formData.get("baseLocale") ?? "en");

  // Auto-translate every field's text into the other locales (best-effort).
  let i18n: Record<string, Record<string, FieldI18n>> | undefined;
  if (fields.length && process.env.OPENAI_API_KEY) {
    const targets = locales.filter((l) => l !== baseLocale);
    const results = await Promise.all(
      targets.map(async (loc) => {
        type Item = { fid: string; key: "label" | "help" | "placeholder" | "option"; oi?: number };
        const items: Item[] = [];
        const strs: string[] = [];
        for (const f of fields) {
          if (f.label) { items.push({ fid: f.id, key: "label" }); strs.push(f.label); }
          if (f.help) { items.push({ fid: f.id, key: "help" }); strs.push(f.help); }
          if (f.placeholder) { items.push({ fid: f.id, key: "placeholder" }); strs.push(f.placeholder); }
          (f.options ?? []).forEach((o, oi) => { items.push({ fid: f.id, key: "option", oi }); strs.push(o); });
        }
        const tr = await translateBatch(strs, loc, baseLocale);
        const map: Record<string, FieldI18n> = {};
        items.forEach((it, k) => {
          const v = tr[k];
          const o = (map[it.fid] ??= {});
          if (it.key === "label") o.label = v;
          else if (it.key === "help") o.help = v;
          else if (it.key === "placeholder") o.placeholder = v;
          else if (it.key === "option") { (o.options ??= [])[it.oi!] = v; }
        });
        return [loc, map] as const;
      }),
    );
    i18n = Object.fromEntries(results);
  }

  await db.event.update({
    where: { id: eventId },
    data: { registrationForm: fields.length ? ({ fields, baseLocale, i18n } as never) : undefined },
  });

  revalidatePath(`/organizer/events/${eventId}/form`);
  revalidatePath(`/events/${ev.slug}/apply`);
  return { ok: true };
}
