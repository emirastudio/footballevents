// Seed one WC2026 + one GENERAL article so /blog, /world-cup-2026, and
// /admin/news have something to render without firing the full AI pipeline.
//
// Run with: DATABASE_URL=… pnpm tsx scripts/seed-news-fixture.ts

import { db } from "../src/lib/db";

async function main() {
  await db.article.deleteMany({ where: { slug: { in: ["fixture-wc2026", "fixture-general"] } } });

  await db.article.create({
    data: {
      slug: "fixture-wc2026",
      category: "WC2026",
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["Messi", "Argentina", "Qualifiers"],
      translations: {
        create: {
          locale: "en",
          title: "Argentina sweep CONMEBOL qualifying with eye on 2026 defense",
          metaDescription:
            "Lionel Messi's Argentina enters the 2026 World Cup as title holders after a clean run through South American qualifying.",
          lead:
            "Argentina finished CONMEBOL qualifying with the conference's best goal difference, setting up a defence of the 2022 trophy on Canadian, Mexican and US soil.",
          body: [
            "Argentina rounded out their CONMEBOL campaign with another decisive away win, sealing a top-of-the-table finish ahead of Brazil and Uruguay.",
            "",
            "Lionel Scaloni's side conceded just four goals across the campaign — fewer than any other South American side, and a tactical fingerprint that will travel well to the larger pitches and warmer venues of the 2026 tournament.",
            "",
            "## What this means for 2026",
            "",
            "- The reigning champions arrive with a stable spine and minimal roster turnover.",
            "- Messi's role is expected to be more deep-lying, freeing Lautaro Martínez and Julián Álvarez to press.",
            "- The trio of Canada, Mexico and the US adds altitude and humidity variables — Scaloni has hinted at a dedicated June camp.",
            "",
            "Argentina's first group-stage opponent will not be confirmed until the draw in Las Vegas later this year.",
            "",
            "Reported via test-fixture.",
          ].join("\n"),
          generatedByAi: false,
        },
      },
    },
  });

  await db.article.create({
    data: {
      slug: "fixture-general",
      category: "GENERAL",
      status: "DRAFT", // lands in admin queue
      tags: ["Champions League", "Real Madrid"],
      translations: {
        create: {
          locale: "en",
          title: "Real Madrid edge through Champions League last-16 on second-leg discipline",
          metaDescription:
            "Real Madrid advanced to the Champions League quarter-finals after a disciplined second leg performance shut down their opponent's counter-attack.",
          lead:
            "Real Madrid's narrow last-16 second-leg win was less about flair and more about a back four that finally looks settled.",
          body: [
            "After conceding twice in the first leg, Real Madrid kept a clean sheet at the Bernabéu and progressed on aggregate via a single second-half goal.",
            "",
            "Carlo Ancelotti's tactical adjustment — pushing one midfielder permanently into the back line when out of possession — neutralised the away side's main outlet.",
            "",
            "## The numbers",
            "",
            "- 0.3 xG conceded over 90 minutes — Real's lowest in any knockout-stage second leg this decade.",
            "- 67% possession in the final third, with the centre-backs joining the build-up.",
            "",
            "The quarter-final draw takes place in Nyon next week.",
            "",
            "Reported via test-fixture.",
          ].join("\n"),
          generatedByAi: false,
        },
      },
    },
  });

  console.log("✓ seeded fixture-wc2026 (PUBLISHED) and fixture-general (DRAFT)");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
