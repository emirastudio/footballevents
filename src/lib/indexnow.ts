// IndexNow client — notify Bing, Yandex, Seznam, Naver and other participating
// search engines about new or updated URLs in real time. Google does NOT
// participate (yet); for Google use Search Console + sitemap polling.
//
// Setup:
// 1. Generate a key (32–128 hex/alphanum chars). Put it in INDEXNOW_KEY env.
// 2. The file at /[key].txt must return the same key — handled by the
//    dynamic key-file route in this repo.
// 3. Call notifyIndexNow([...]) from server actions that publish/update content.
//
// Spec: https://www.indexnow.org/documentation

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
const KEY = process.env.INDEXNOW_KEY;

// Single endpoint that fans out to all participating engines.
const ENDPOINT = "https://api.indexnow.org/IndexNow";

/** Notify IndexNow about up to 10,000 URLs in a single batch. No-ops if key/host invalid. */
export async function notifyIndexNow(urls: string[]): Promise<{ ok: boolean; reason?: string }> {
  if (!KEY) return { ok: false, reason: "no-key" };
  if (!SITE || SITE.startsWith("http://localhost")) return { ok: false, reason: "non-prod" };

  const host = new URL(SITE).host;
  const clean = urls.filter((u) => u && u.startsWith(SITE)).slice(0, 10000);
  if (clean.length === 0) return { ok: false, reason: "no-urls" };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${SITE}/${KEY}.txt`,
        urlList: clean,
      }),
      // IndexNow returns 200/202 on success, 422 on partial, 4xx on error.
      // Don't await indefinitely — best-effort fire-and-forget pattern.
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok || res.status === 202, reason: res.ok ? undefined : `status-${res.status}` };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "network" };
  }
}

/** Convenience: notify all locale variants of a single canonical path. */
export async function notifyIndexNowAllLocales(
  path: string,
  locales: readonly string[],
): Promise<{ ok: boolean; reason?: string }> {
  const urls = locales.map((l) => `${SITE}/${l}${path.startsWith("/") ? path : `/${path}`}`);
  return notifyIndexNow(urls);
}
