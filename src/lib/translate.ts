// Auto-translation via OpenAI (gpt-4o-mini). Used for registration forms and
// event content. Key in OPENAI_API_KEY (env). Degrades gracefully: if the key
// is missing or the call fails, returns the source strings unchanged.

const KEY = process.env.OPENAI_API_KEY;

const LOCALE_NAMES: Record<string, string> = {
  en: "English", ru: "Russian", de: "German", es: "Spanish",
};

/**
 * Translate an array of short strings into `target`. Returns a same-length,
 * same-order array. Empty strings are passed through untouched. On any failure
 * the original strings are returned (never throws).
 */
export async function translateBatch(texts: string[], target: string, source?: string): Promise<string[]> {
  if (!KEY || texts.length === 0) return texts;

  const idx: number[] = [];
  const payload: string[] = [];
  texts.forEach((t, i) => { if (t && t.trim()) { idx.push(i); payload.push(t); } });
  if (payload.length === 0) return texts;

  const sys =
    `You are a professional translator for a football events platform. ` +
    `Translate each string in the input array into ${LOCALE_NAMES[target] ?? target}` +
    (source ? ` from ${LOCALE_NAMES[source] ?? source}` : "") +
    `. Keep translations natural and concise. Preserve numbers, placeholders like {name}, ` +
    `URLs and proper nouns. Return ONLY JSON: {"t": [ ...translated strings... ]} ` +
    `with exactly ${payload.length} items in the same order.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });
    if (!res.ok) return texts;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : parsed?.t;
    if (!Array.isArray(arr) || arr.length !== payload.length) return texts;
    const out = [...texts];
    idx.forEach((origI, k) => { if (typeof arr[k] === "string") out[origI] = arr[k]; });
    return out;
  } catch {
    return texts;
  }
}
