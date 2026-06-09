// End-to-end news pipeline: discover → drop excluded → dedupe → rewrite via
// AI → persist as Article + ArticleTranslation(en) + IngestedSource.
//
// Called from /api/cron/ingest-news once a day. Returns a stats object that
// becomes both the cron-job HTTP response AND a Telegram summary line.
//
// Capacity: NEWS_PIPELINE_DAILY_CAP (default 20). Beyond that we stop
// rewriting — the next day's run picks up the rest from the source.
//
// Failure policy: a single bad item never fails the run. Failed items are
// counted in `stats.failed` and reported to Telegram with item URL for
// diagnosis. Successful items commit; failures are not retried (the source
// will keep them in the feed for tomorrow).

import { db } from "@/lib/db";
import { tgServerError, sendTelegram } from "@/lib/telegram";
import { slugify, uniqueSlug } from "@/lib/slug";
import { discover } from "./discover";
import { dedupe, titleHash } from "./dedupe";
import { classify, shouldDrop } from "./classify";
import { rewriteArticle } from "@/lib/ai/news-rewrite";

const DAILY_CAP = Number(process.env.NEWS_PIPELINE_DAILY_CAP ?? 20);

export type PipelineStats = {
  discovered: number;
  excluded: number;
  fresh: number;
  capped: number;
  ingested: number;
  wc2026: number;
  general: number;
  skipped: number;
  failed: number;
  failures: string[]; // sampled URLs of failed items (max 5)
};

export async function runPipeline(): Promise<PipelineStats> {
  const stats: PipelineStats = {
    discovered: 0,
    excluded: 0,
    fresh: 0,
    capped: 0,
    ingested: 0,
    wc2026: 0,
    general: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const raw = await discover();
  stats.discovered = raw.length;

  const filtered = raw.filter((it) => !shouldDrop(it));
  stats.excluded = raw.length - filtered.length;

  const fresh = await dedupe(filtered);
  stats.fresh = fresh.length;

  const work = fresh.slice(0, DAILY_CAP);
  stats.capped = Math.max(0, fresh.length - DAILY_CAP);

  for (const item of work) {
    try {
      const result = await rewriteArticle(item);
      if (result.kind === "skip") {
        await db.ingestedSource.create({
          data: {
            externalId: item.externalId,
            url: item.url,
            publisher: item.publisher,
            titleHash: titleHash(item.title),
          },
        });
        stats.skipped++;
        continue;
      }

      const article = result.article;
      const category = classify({ ...item, topic: article.category === "WC2026" ? "wc2026" : "general" });
      const status = category === "WC2026" ? "PUBLISHED" : "DRAFT";
      const publishedAt = status === "PUBLISHED" ? new Date() : null;

      const base = slugify(article.slugBase) || slugify(article.titleEn) || "article";
      const slug = await uniqueSlug(base, async (s) => {
        return (await db.article.count({ where: { slug: s } })) > 0;
      });

      await db.$transaction([
        db.ingestedSource.create({
          data: {
            externalId: item.externalId,
            url: item.url,
            publisher: item.publisher,
            titleHash: titleHash(item.title),
            article: {
              create: {
                slug,
                category,
                status,
                publishedAt,
                tags: article.tags,
                translations: {
                  create: {
                    locale: "en",
                    title: article.titleEn,
                    metaDescription: article.metaDescriptionEn,
                    lead: article.leadEn,
                    body: article.bodyEn,
                    generatedByAi: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      stats.ingested++;
      if (category === "WC2026") stats.wc2026++;
      else stats.general++;
    } catch (e) {
      stats.failed++;
      if (stats.failures.length < 5) stats.failures.push(item.url);
      // P2002 on IngestedSource(externalId) means another row with this
      // externalId raced in between dedupe() and the create — either a
      // concurrent pipeline run, a leftover row from a prior crash mid-loop,
      // or a same-batch dupe the dedupe layer should have caught but didn't.
      // Either way, the source is already recorded; don't count as a real
      // failure and don't page on it.
      const code = (e as { code?: string })?.code;
      if (code === "P2002") {
        stats.skipped++;
        console.warn(`[pipeline] dedup-race on ${item.url} — already ingested`);
        continue;
      }
      stats.failed++;
      if (stats.failures.length < 5) stats.failures.push(item.url);
      console.error(`[pipeline] item failed ${item.url}:`, e);
      void tgServerError({
        url: item.url,
        message: `news pipeline: ${(e as Error).message ?? String(e)}`,
      });
    }
  }

  void sendTelegram(
    `📰 <b>News pipeline</b>\n` +
      `discovered ${stats.discovered}, fresh ${stats.fresh}, ingested ${stats.ingested} ` +
      `(WC2026 ${stats.wc2026}, GEN ${stats.general}), skipped ${stats.skipped}, failed ${stats.failed}` +
      (stats.capped ? `\ncapped ${stats.capped} for tomorrow` : ""),
  );

  return stats;
}
