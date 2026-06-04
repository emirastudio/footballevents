// AI rewriter: source RSS/NewsAPI item → structured English article in our
// voice. System prompt lives in config/news-prompts.ts so non-developers can
// tweak voice without touching pipeline code.
//
// The model may return {"skip": true} when the topic is off-scope (betting,
// non-football, arrests etc.) — see config/news-prompts.ts. Callers must
// handle null (model failure) AND skip=true (model declined) the same way:
// drop the item, don't error.

import { z } from "zod";
import { chatJson } from "@/lib/ai/openai";
import { NEWS_REWRITE_SYSTEM } from "../../../config/news-prompts";
import type { RawItem } from "@/lib/news/discover";

const SkipSchema = z.object({ skip: z.literal(true) });

const ArticleSchema = z.object({
  skip: z.literal(false).optional(),
  titleEn: z.string().min(8).max(120),
  slugBase: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  metaDescriptionEn: z.string().min(80).max(200),
  leadEn: z.string().min(20).max(400),
  bodyEn: z.string().min(200),
  tags: z.array(z.string()).min(1).max(10),
  category: z.enum(["WC2026", "GENERAL"]),
});

const RewriteResultSchema = z.union([SkipSchema, ArticleSchema]);

export type RewrittenArticle = z.infer<typeof ArticleSchema>;
export type RewriteResult =
  | { kind: "skip"; reason?: string }
  | { kind: "ok"; article: RewrittenArticle };

export async function rewriteArticle(item: RawItem): Promise<RewriteResult> {
  const user = JSON.stringify({
    sourceTitle: item.title,
    sourceBody: item.body.slice(0, 4000),
    sourceUrl: item.url,
    publisher: item.publisher,
    publishedAt: item.publishedAt,
    topicHint: item.topic,
  });

  const result = await chatJson({
    system: NEWS_REWRITE_SYSTEM,
    user,
    schema: RewriteResultSchema,
    temperature: 0.4,
    label: `news-rewrite:${item.publisher}`,
  });

  if (!result) return { kind: "skip", reason: "ai-failure" };
  if ("skip" in result && result.skip === true) {
    return { kind: "skip", reason: "off-topic" };
  }
  return { kind: "ok", article: result as RewrittenArticle };
}
