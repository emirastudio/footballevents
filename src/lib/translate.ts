// Auto-translation via OpenAI (gpt-4o-mini). Used for registration forms and
// event content. Key in OPENAI_API_KEY (env). Degrades gracefully: if the key
// is missing or the call fails, returns the source strings unchanged.

import { z } from "zod";
import { chatJson } from "@/lib/ai/openai";

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  de: "German",
  es: "Spanish",
};

const BatchSchema = z.object({ t: z.array(z.string()) });

/**
 * Translate an array of short strings into `target`. Returns a same-length,
 * same-order array. Empty strings are passed through untouched. On any failure
 * the original strings are returned (never throws).
 */
export async function translateBatch(
  texts: string[],
  target: string,
  source?: string,
): Promise<string[]> {
  if (texts.length === 0) return texts;

  const idx: number[] = [];
  const payload: string[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim()) {
      idx.push(i);
      payload.push(t);
    }
  });
  if (payload.length === 0) return texts;

  const sys =
    `You are a professional translator for a football events platform. ` +
    `Translate each string in the input array into ${LOCALE_NAMES[target] ?? target}` +
    (source ? ` from ${LOCALE_NAMES[source] ?? source}` : "") +
    `. Keep translations natural and concise. Preserve any HTML tags/markup, numbers, ` +
    `placeholders like {name}, URLs and proper nouns. Return ONLY JSON: {"t": [ ...translated strings... ]} ` +
    `with exactly ${payload.length} items in the same order.`;

  const result = await chatJson({
    system: sys,
    user: JSON.stringify(payload),
    schema: BatchSchema,
    label: `translate:${target}`,
  });

  if (!result || result.t.length !== payload.length) return texts;

  const out = [...texts];
  idx.forEach((origI, k) => {
    if (typeof result.t[k] === "string") out[origI] = result.t[k];
  });
  return out;
}
