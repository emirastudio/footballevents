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
  const seenInBatch = new Set<string>();
  return items.filter((it) => {
    const h = titleHash(it.title);
    if (idSet.has(it.externalId)) return false;
    if (hashSet.has(h)) return false;
    if (seenInBatch.has(h)) return false;
    seenInBatch.add(h);
    return true;
  });
}
