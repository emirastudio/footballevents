// Fetches raw news items from the sources defined in config/news-topics.json.
// RSS via fast-xml-parser, NewsAPI via REST. Returns a flat list of normalised
// RawItem records — dedupe + classify run downstream.

import { XMLParser } from "fast-xml-parser";
import { allSources, type Source, type TopicKey } from "./sources";

export type RawItem = {
  topic: TopicKey;
  publisher: string; // "fifa.com" | "newsapi:bbc-sport"
  externalId: string; // url or guid — uniqueness key
  url: string;
  title: string;
  body: string; // article summary / description, may be short
  publishedAt: string | null; // ISO if known
};

const USER_AGENT = "footballevents.eu newsbot/1.0 (+https://footballevents.eu)";
const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, ...(init?.headers ?? {}) },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

type RssEntry = {
  title?: string | { "#text"?: string };
  link?: string | { "@_href"?: string } | Array<string | { "@_href"?: string }>;
  guid?: string | { "#text"?: string };
  id?: string;
  description?: string;
  summary?: string | { "#text"?: string };
  content?: string;
  "content:encoded"?: string;
  pubDate?: string;
  published?: string;
  updated?: string;
};

function textOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) return String((v as { "#text"?: unknown })["#text"] ?? "");
  return "";
}

function linkOf(v: RssEntry["link"]): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const found = v.find((x) => typeof x === "object" && (x as { "@_href"?: string })["@_href"]);
    if (found && typeof found === "object") return (found as { "@_href"?: string })["@_href"] ?? "";
    const first = v[0];
    return typeof first === "string" ? first : "";
  }
  if (v && typeof v === "object" && "@_href" in v) return String((v as { "@_href"?: string })["@_href"] ?? "");
  return "";
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function discoverRss(src: Extract<Source, { type: "rss" }>): Promise<RawItem[]> {
  let xml: string;
  try {
    const res = await fetchWithTimeout(src.url);
    if (!res.ok) {
      console.warn(`[discover:rss] ${src.url} → ${res.status}`);
      return [];
    }
    xml = await res.text();
  } catch (e) {
    console.warn(`[discover:rss] ${src.url} fetch failed:`, e);
    return [];
  }

  let parsed: unknown;
  try {
    parsed = xmlParser.parse(xml);
  } catch (e) {
    console.warn(`[discover:rss] ${src.url} parse failed:`, e);
    return [];
  }

  // RSS 2.0 → rss.channel.item[]   Atom → feed.entry[]
  const root = parsed as Record<string, unknown>;
  const channel = (root.rss as { channel?: { item?: unknown } } | undefined)?.channel;
  const items: RssEntry[] = Array.isArray(channel?.item)
    ? (channel.item as RssEntry[])
    : channel?.item
      ? [channel.item as RssEntry]
      : Array.isArray((root.feed as { entry?: unknown[] } | undefined)?.entry)
        ? (((root.feed as { entry: unknown[] }).entry) as RssEntry[])
        : [];

  const publisher = host(src.url);

  return items
    .map((it): RawItem | null => {
      const title = stripTags(textOf(it.title));
      const url = linkOf(it.link);
      const externalId = textOf(it.guid) || textOf(it.id) || url;
      const bodyRaw =
        textOf(it["content:encoded"]) ||
        textOf(it.content) ||
        textOf(it.summary) ||
        textOf(it.description) ||
        "";
      const body = stripTags(bodyRaw);
      const publishedRaw = it.pubDate || it.published || it.updated || null;
      let publishedAt: string | null = null;
      if (publishedRaw) {
        const d = new Date(publishedRaw);
        if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
      }
      if (!title || !url || !externalId) return null;
      return { topic: src.topic, publisher, externalId, url, title, body, publishedAt };
    })
    .filter((x): x is RawItem => x !== null);
}

type NewsApiArticle = {
  source?: { id?: string | null; name?: string };
  title?: string | null;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  publishedAt?: string | null;
};

async function discoverNewsApi(src: Extract<Source, { type: "newsapi" }>): Promise<RawItem[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    console.warn(`[discover:newsapi] NEWS_API_KEY missing — skipping query "${src.q}"`);
    return [];
  }
  const url =
    `https://newsapi.org/v2/everything?` +
    new URLSearchParams({
      q: src.q,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "10",
      apiKey: key,
    }).toString();

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`[discover:newsapi] "${src.q}" → ${res.status}`);
      return [];
    }
    const json = (await res.json()) as { articles?: NewsApiArticle[] };
    return (json.articles ?? [])
      .map((a): RawItem | null => {
        if (!a.title || !a.url) return null;
        const publisher = `newsapi:${a.source?.id ?? a.source?.name ?? "unknown"}`;
        return {
          topic: src.topic,
          publisher,
          externalId: a.url,
          url: a.url,
          title: a.title,
          body: stripTags(a.content ?? a.description ?? ""),
          publishedAt: a.publishedAt ?? null,
        };
      })
      .filter((x): x is RawItem => x !== null);
  } catch (e) {
    console.warn(`[discover:newsapi] "${src.q}" fetch failed:`, e);
    return [];
  }
}

export async function discover(): Promise<RawItem[]> {
  const sources = allSources();
  const batches = await Promise.all(
    sources.map((s) => (s.type === "rss" ? discoverRss(s) : discoverNewsApi(s))),
  );
  return batches.flat();
}
