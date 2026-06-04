// Reads config/news-topics.json — the single place where source feeds,
// NewsAPI queries, classification keywords and exclude filters live.

import topics from "../../../config/news-topics.json";

export type TopicKey = "wc2026" | "general";

export type TopicConfig = {
  rss: string[];
  newsapi: string[];
  keywords: string[];
  exclude?: string[];
};

export const TOPICS: Record<TopicKey, TopicConfig> = {
  wc2026: topics.wc2026 as TopicConfig,
  general: topics.general as TopicConfig,
};

export type Source =
  | { type: "rss"; topic: TopicKey; url: string }
  | { type: "newsapi"; topic: TopicKey; q: string };

export function allSources(): Source[] {
  const out: Source[] = [];
  (["wc2026", "general"] as const).forEach((topic) => {
    TOPICS[topic].rss.forEach((url) => out.push({ type: "rss", topic, url }));
    TOPICS[topic].newsapi.forEach((q) => out.push({ type: "newsapi", topic, q }));
  });
  return out;
}
