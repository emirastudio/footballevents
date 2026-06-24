# Архитектура деплоя (CI/CD)

## Архитектура (одной картинкой)

```
git push main
   │
   ▼
┌──────────────────── GitHub Actions (.github/workflows/deploy.yml) ────────────────────┐
│ 1. checkout                                                                            │
│ 2. docker build --target runner  (Dockerfile, multi-stage)                             │
│    └─ build-args: NEXT_PUBLIC_* из GitHub Secrets (инлайнятся в client bundle)         │
│ 3. docker push ghcr.io/emirastudio/footballevents:{sha,latest}   (public package)      │
│ 4. ssh fe-prod true   ← пустая команда; SSH-ключ forced-command = `docker pull latest` │
│    (без этого Coolify reuse'нул бы stale local :latest)                                │
│ 5. curl Bearer → COOLIFY_WEBHOOK?force=true                                            │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────── VPS 178.105.2.89 (Coolify) ──────────────────────────┐
│ Coolify билдит Dockerfile.deploy = `FROM ghcr…:latest`   (просто pull)      │
│   ↓                                                                          │
│ docker-entrypoint.sh:  prisma migrate deploy  →  node server.js              │
│   ↓                                                                          │
│ Traefik (coolify-proxy) → footballevents.eu + www                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Принцип:** VPS (3.7 GB RAM) **никогда не билдит** Next.js — на нём один раз OOM'нул `next build`, сайт лежал 36 часов. Билд только в CI; если CI упал — на проде продолжает крутиться последний хороший image.

---

## Файлы, где это всё лежит

| Что | Файл |
|---|---|
| CI билд + push + webhook | [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) |
| Реальный multi-stage билд | [Dockerfile](../Dockerfile) |
| То, что «билдит» Coolify (1 строка) | [Dockerfile.deploy](../Dockerfile.deploy) |
| `prisma migrate deploy` перед стартом | [docker-entrypoint.sh](../docker-entrypoint.sh) |
| Uptime monitor (GH Actions, */5 min) | [.github/workflows/uptime.yml](../.github/workflows/uptime.yml) |
| Cron jobs (новости, sitemap и т.п.) | [.github/workflows/cron-jobs.yml](../.github/workflows/cron-jobs.yml) |

---

## Доступы

### 1. SSH на прод
```
Host fe-prod
  HostName 178.105.2.89
  User root
  IdentityFile ~/.ssh/footballevents_ed25519
```
Подключение: `ssh fe-prod`. Лежит локально в `~/.ssh/config`.

### 2. Coolify dashboard
- **URL:** https://coolify.footballevents.eu (или `localhost:8000` если на VPS)
- **API base:** `/api/v1`
- **App UUID:** `jmg6o7cf7y6o9apc3lrhocta`
- **Project:** `footballevents`
- Bearer-токен «claude-setup» уже существует. Новый — через `docker exec -it coolify php artisan tinker` (Sanctum PAT, обязательно `team_id=0`).

### 3. Container registry
- **GHCR:** `ghcr.io/emirastudio/footballevents:latest` / `:<sha>`
- **Public** package — pull без авторизации.
- Push: только из GitHub Actions через `GITHUB_TOKEN` (workflow permission `packages: write`).

### 4. GitHub
- Repo: `emirastudio/footballevents`, `gh` авторизован как `emirastudio`.
- **Внимание:** у локального `gh`-токена нет `read/write:packages` — поменять visibility пакета или создать package PAT через `gh` нельзя, только в UI GitHub.

### 5. Telegram bot
- `@FootballEvents_bot`. Токен живёт в Coolify env (`TELEGRAM_BOT_TOKEN`) + в GitHub Secrets для uptime.yml.

---

## GitHub Secrets / Variables (что должно быть настроено)

**Secrets** (`Settings → Secrets and variables → Actions → Secrets`):
- `COOLIFY_WEBHOOK`: `https://coolify.footballevents.eu/api/v1/deploy?uuid=jmg6o7cf7y6o9apc3lrhocta&force=true`
- `COOLIFY_TOKEN`: Bearer для webhook
- `DEPLOY_SSH_HOST`: `178.105.2.89`
- `DEPLOY_SSH_KEY`: приватный ключ с forced-command = `docker pull ghcr.io/.../footballevents:latest`
- `NEXT_PUBLIC_SITE_URL`: `https://footballevents.eu`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_…`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID`: для uptime.yml

**Variables** (`… → Variables`):
- `DEPLOY_ENABLED`: `true` — флаг, который гейтит шаги 4 и 5 в deploy.yml.

**Server-only env** (живёт **только** в Coolify):
`DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, ключи к OpenAI / новостным фидам и т.д.

---

## Как сделать деплой (3 способа)

### Способ 1 — обычный: push в main
```bash
git push origin main
```

### Способ 2 — ручной trigger без коммита
GitHub → Actions → **Build & deploy** → `Run workflow` → ветка `main` → Run.

### Способ 3 — экстренный «передеплоить как есть» (без CI билда)
```bash
ssh fe-prod 'docker pull ghcr.io/emirastudio/footballevents:latest'
curl -fsS -X GET -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "https://coolify.footballevents.eu/api/v1/deploy?uuid=jmg6o7cf7y6o9apc3lrhocta&force=true"
```

### Откат
В GHCR теги `:sha-<commit>` лежат вечно. Откат = в Coolify поменять image tag на нужный `:sha-…` и Redeploy.

---

## Что важно помнить

1. **Никогда не билди Next.js на VPS.** Любая правка CI/Coolify должна сохранять «build в Actions, server только pull».
2. **NEXT_PUBLIC_\* — build-time.** Поменял Stripe pk_live_… в GitHub Secrets → нужен новый билд, рантайм-перезапуск ничего не даст.
3. **`prisma migrate deploy` в entrypoint.** Сломанная миграция = контейнер не стартует = прод остаётся на старом контейнере (это by design, не баг).
4. **Healthcheck = `GET /api/auth/session`.** Если NextAuth ломается, контейнер уходит в unhealthy и Traefik снимает с балансировки.
5. **Uptime-алёрты ≠ Server-error-алёрты.** Первое («🔴 footballevents.eu DOWN», из `uptime.yml`) = GH Actions не достучался; второе («🔴 Server error / URL / message») = клиентский error boundary у юзера в браузере (часто `Failed to fetch` от закрытой вкладки/моргнувшего вайфая). Разные сигналы — не путать.
