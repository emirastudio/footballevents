// Lazy locale-translation accessor. Called from the article page when the
// requested locale's translation doesn't exist yet — it kicks off ONE AI call,
// caches the result in ArticleTranslation, and returns it.
//
// First non-EN visitor pays ~2-3s wall-clock; everyone after that hits the DB
// row. Concurrent requests are race-safe via the unique (articleId,locale)
// index + upsert.
//
// Falls back to the EN row when:
//   - target is "en" (canonical row)
//   - OPENAI_API_KEY missing or model failed (best-effort, no error to user)

import type { ArticleTranslation, Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { translateArticleFields } from "@/lib/ai/translate-article";

export async function getOrCreateTranslation(
  articleId: string,
  locale: Locale,
): Promise<ArticleTranslation | null> {
  const existing = await db.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale } },
  });
  if (existing) return existing;

  const base = await db.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale: "en" } },
  });
  if (!base) return null; // shouldn't happen — EN is created on ingest
  if (locale === "en") return base;

  const translated = await translateArticleFields(
    {
      title: base.title,
      metaDescription: base.metaDescription,
      lead: base.lead,
      body: base.body,
    },
    locale,
  );
  if (!translated) return base; // graceful fallback — render in EN this visit

  return db.articleTranslation.upsert({
    where: { articleId_locale: { articleId, locale } },
    create: {
      articleId,
      locale,
      title: translated.title,
      metaDescription: translated.metaDescription,
      lead: translated.lead,
      body: translated.body,
      generatedByAi: true,
    },
    update: {}, // race-loser keeps the winner's row
  });
}
