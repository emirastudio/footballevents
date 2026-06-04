// Translate a single ArticleTranslation (EN base) into another locale.
// One AI call, structured JSON in/out. Returns null on failure — caller
// falls back to EN.

import { z } from "zod";
import { chatJson } from "@/lib/ai/openai";
import { articleTranslateSystem } from "../../../config/news-prompts";
import type { Locale } from "@prisma/client";

const Schema = z.object({
  title: z.string().min(1),
  metaDescription: z.string().min(20),
  lead: z.string().min(10),
  body: z.string().min(50),
});

export type ArticleFields = z.infer<typeof Schema>;

export async function translateArticleFields(
  base: ArticleFields,
  target: Exclude<Locale, "en">,
): Promise<ArticleFields | null> {
  const sys = articleTranslateSystem(target);
  const user = JSON.stringify(base);
  return chatJson({
    system: sys,
    user,
    schema: Schema,
    temperature: 0.2,
    label: `translate-article:${target}`,
  });
}
