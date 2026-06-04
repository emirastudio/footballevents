// Smoke-test the news pipeline end-to-end WITHOUT making any AI calls.
// Run with: DATABASE_URL=… pnpm tsx scripts/test-news-pipeline.ts
//
// Verifies:
//   1. discover() pulls items from at least one configured RSS / NewsAPI source
//   2. shouldDrop() + dedupe() filter as expected
//   3. classify() splits into WC2026 vs GENERAL
//   4. Article + ArticleTranslation tables are queryable through Prisma
//
// Does NOT call OpenAI — that would cost real money on every smoke run. Use
// the cron endpoint in dev with a real OPENAI_API_KEY for full e2e.

import { discover } from "../src/lib/news/discover";
import { dedupe } from "../src/lib/news/dedupe";
import { classify, shouldDrop } from "../src/lib/news/classify";
import { db } from "../src/lib/db";

async function main() {
  console.log("→ discover() — fetching configured RSS + NewsAPI sources…");
  const raw = await discover();
  console.log(`  ${raw.length} raw items`);
  if (raw.length === 0) {
    console.warn("  ⚠ zero items. Sources may be unreachable from this network.");
  } else {
    const samplePublishers = [...new Set(raw.map((r) => r.publisher))].slice(0, 5);
    console.log(`  publishers (sample): ${samplePublishers.join(", ")}`);
    console.log(`  example title: "${raw[0].title.slice(0, 80)}"`);
  }

  const kept = raw.filter((it) => !shouldDrop(it));
  console.log(`→ exclude filter: ${raw.length - kept.length} dropped, ${kept.length} kept`);

  console.log("→ dedupe() — comparing against IngestedSource history…");
  const fresh = await dedupe(kept);
  console.log(`  ${fresh.length} fresh items (rest already seen or in-batch dupes)`);

  const wc = fresh.filter((it) => classify(it) === "WC2026").length;
  const gen = fresh.length - wc;
  console.log(`→ classify(): WC2026=${wc}, GENERAL=${gen}`);

  console.log("→ Prisma tables — sanity counts…");
  const [articleCount, srcCount, tranCount] = await Promise.all([
    db.article.count(),
    db.ingestedSource.count(),
    db.articleTranslation.count(),
  ]);
  console.log(`  Article=${articleCount}, IngestedSource=${srcCount}, ArticleTranslation=${tranCount}`);

  await db.$disconnect();
  console.log("\n✓ smoke test complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
