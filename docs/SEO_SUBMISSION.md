# SEO submission & search-engine onboarding

This file is a runbook for getting the site indexed across Google, Bing, Yandex
and IndexNow-participating engines after deploy. Most of it is one-time setup
plus a few quarterly checks.

## 1. Google Search Console (manual — one-time)

Google deprecated their `/ping?sitemap=` endpoint in June 2023, so submission
is done in the Search Console UI:

1. Open <https://search.google.com/search-console>
2. Add property → **URL prefix** → `https://footballevents.eu`
3. Verify ownership. Recommended: **DNS TXT** record (Cloudflare). Fallback:
   HTML meta tag — copy the content value into `GOOGLE_SITE_VERIFICATION` env
   in Coolify; it's already wired into `<head>` via [`layout.tsx`](../src/app/[locale]/layout.tsx).
4. **Sitemaps** → add: `sitemap.xml` (relative to the root).
5. **Settings → International targeting**: leave empty (we use hreflang).
6. (Optional) Submit each pSEO hub URL via **URL Inspection** if you want a
   specific page indexed within hours instead of days.

GSC will email you when issues appear (manual actions, mobile usability,
Core Web Vitals regressions). Add `andrei@footballevents.eu` as Owner +
your email as Full user.

## 2. Bing Webmaster Tools

1. Open <https://www.bing.com/webmasters>
2. Import directly from Google Search Console — saves 90% of the setup.
3. Verify with the same DNS TXT or the `BING_SITE_VERIFICATION` env var.
4. Sitemaps → add `https://footballevents.eu/sitemap.xml`.
5. **IndexNow** tab: paste the same key you set in `INDEXNOW_KEY` env.
   Bing will then auto-receive pings from us (see §4).

## 3. Yandex.Webmaster (for RU/CIS traffic)

1. <https://webmaster.yandex.com/> → Add site → `https://footballevents.eu`
2. Verify via meta tag → put the value in `YANDEX_SITE_VERIFICATION` env.
   It's wired into `<head>` via [`layout.tsx`](../src/app/[locale]/layout.tsx).
3. Indexing → Sitemap files → add `https://footballevents.eu/sitemap.xml`.
4. Quality → Site quality → enable IndexNow with the same key.
5. (Optional) Yandex.Metrika counter ID → `NEXT_PUBLIC_YANDEX_METRIKA_ID` env.

## 4. IndexNow (automatic — already wired)

IndexNow notifies Bing, Yandex, Seznam, Naver and Yep instantly when content
changes. Already integrated in this codebase:

- **Setup**: generate a 32-char key with `openssl rand -hex 16`, put it in
  `INDEXNOW_KEY` env in Coolify. The file at `/<KEY>.txt` is served by
  middleware automatically (no static file needed).
- **Auto-pings**: every approved event triggers a notification across all
  4 locale variants — see [`actions/admin.ts`](../src/app/actions/admin.ts).
- **Manual batch**: `POST /api/indexnow` with header `x-cron-secret: <CRON_SECRET>`
  notifies all events updated in the last 30 minutes. Run via cron (Coolify
  Scheduler) every 30 min if you want extra safety.
- **Custom URLs**: `POST /api/indexnow` body `{ "urls": ["https://..."] }`
  pushes an arbitrary list.

Verify your key file: `curl https://footballevents.eu/<KEY>.txt` should return
the key as plaintext.

## 5. Quarterly checks (15 min)

- GSC → Performance → check CTR and impressions for the pSEO hubs.
- GSC → Core Web Vitals → no "Poor" URLs.
- GSC → Coverage → fix any new "Excluded by noindex" surprises (could be a
  stray `robots` tag on a fresh page).
- Bing → Site Explorer → backlink check.
- Yandex.Webmaster → Site quality (ИКС) → trend.
- Run [PageSpeed Insights](https://pagespeed.web.dev/) on the homepage and
  one event detail — both should be ≥90 on mobile.

## 6. Environment variables checklist

```
NEXT_PUBLIC_SITE_URL=https://footballevents.eu
GOOGLE_SITE_VERIFICATION=...
BING_SITE_VERIFICATION=...
YANDEX_SITE_VERIFICATION=...
NEXT_PUBLIC_GA_ID=G-...                 # Google Analytics 4
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=...        # optional, privacy-friendly
NEXT_PUBLIC_YANDEX_METRIKA_ID=...       # Метрика для RU
INDEXNOW_KEY=...                        # openssl rand -hex 16
CRON_SECRET=...                         # required to call POST /api/indexnow
```
