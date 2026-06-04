// Keyword-based classifier. The pipeline trusts the source's `topic` hint by
// default — that's already a coarse split (WC2026 feeds vs general). The
// classifier overrides only when the article body strongly signals WC2026 in
// what was queried as a general feed, or vice versa.
//
// `exclude` keywords drop the item entirely.

import type { ArticleCategory } from "@prisma/client";
import type { RawItem } from "./discover";
import { TOPICS } from "./sources";

const wc = TOPICS.wc2026.keywords.map((k) => k.toLowerCase());
const excl = (TOPICS.general.exclude ?? []).map((k) => k.toLowerCase());

function blob(it: RawItem): string {
  return `${it.title}\n${it.body}`.toLowerCase();
}

export function shouldDrop(it: RawItem): boolean {
  if (excl.length === 0) return false;
  const text = blob(it);
  return excl.some((k) => text.includes(k));
}

/**
 * Resolve category from item content. Source hint is the prior; keyword scan
 * promotes to WC2026 if any WC2026 keyword shows up in title or body.
 */
export function classify(it: RawItem): ArticleCategory {
  if (it.topic === "wc2026") return "WC2026";
  const text = blob(it);
  return wc.some((k) => text.includes(k)) ? "WC2026" : "GENERAL";
}
