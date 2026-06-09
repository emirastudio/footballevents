// Two-stage dedup. MVP runs only stage 1 — title-hash exact match against the
// IngestedSource history. Stage 2 (embedding similarity) is wired-in only if
// we see paraphrase-dupes leaking through.

import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { RawItem } from "./discover";

export function titleHash(title: string): string {
  const norm = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return createHash("sha256").update(norm).digest("hex");
}

/**
 * Return only items we have NOT seen before. An item is "seen" if its
 * externalId OR its title-hash already exists in IngestedSource.
 */
export async function dedupe(items: RawItem[]): Promise<RawItem[]> {
  if (items.length === 0) return [];

  const externalIds = items.map((i) => i.externalId);
  const hashes = items.map((i) => titleHash(i.title));

  const [seenIds, seenHashes] = await Promise.all([
    db.ingestedSource.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true },
    }),
    db.ingestedSource.findMany({
      where: { titleHash: { in: hashes } },
      select: { titleHash: true },
    }),
  ]);

  const idSet = new Set(seenIds.map((r) => r.externalId));
  const hashSet = new Set(seenHashes.map((r) => r.titleHash));

  // Also dedup within this batch — multiple sources can carry the same story.
  // Block on BOTH externalId and titleHash: a BBC article showing up in two
  // RSS feeds yields identical externalIds but the display title can vary by
  // a stray character ("· BBC Sport" suffix in one feed, none in the other),
  // so the title-only guard let it through and the second create hit P2002.
  const batchIds = new Set<string>();
  const batchHashes = new Set<string>();
  return items.filter((it) => {
    const h = titleHash(it.title);
    if (idSet.has(it.externalId)) return false;
    if (hashSet.has(h)) return false;
    if (batchIds.has(it.externalId)) return false;
    if (batchHashes.has(h)) return false;
    batchIds.add(it.externalId);
    batchHashes.add(h);
    return true;
  });
}
