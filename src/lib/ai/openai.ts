// Thin OpenAI chat-completions wrapper around fetch(). One file = the single
// place we talk to OpenAI from — translate.ts, news-rewrite.ts and
// translate-article.ts all sit on top of this.
//
// Design notes:
//   - Returns parsed-and-validated JSON via Zod. Wrong-shape responses become
//     null (caller decides how to recover).
//   - Network/auth failure = null, never throws. Callers that need to surface
//     errors (e.g. cron telemetry) check the return value.
//   - Caller sets a `label` for log/error context — shows up in Telegram alerts.

import type { ZodType } from "zod";

const KEY = process.env.OPENAI_API_KEY;

type ChatJsonOpts<T> = {
  system: string;
  user: string;
  schema: ZodType<T>;
  model?: string;
  temperature?: number;
  label?: string;
};

export async function chatJson<T>({
  system,
  user,
  schema,
  model = "gpt-4o-mini",
  temperature = 0,
  label = "openai",
}: ChatJsonOpts<T>): Promise<T | null> {
  if (!KEY) {
    console.warn(`[${label}] OPENAI_API_KEY missing — skipping call`);
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`[${label}] OpenAI ${res.status}: ${await res.text().catch(() => "")}`);
      return null;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.warn(`[${label}] schema mismatch:`, result.error.issues.slice(0, 3));
      return null;
    }
    return result.data;
  } catch (e) {
    console.warn(`[${label}] failure:`, e);
    return null;
  }
}

export const OPENAI_AVAILABLE = !!KEY;
