# syntax=docker/dockerfile:1.7
# Multi-stage Next.js standalone build for production.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=10.4.1

# ─── deps: install only production-ish deps with pnpm ────────────
FROM node:${NODE_VERSION} AS deps
ENV CI=true
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
# Allow native builds (sharp, prisma engines, esbuild, swc) — CI mode otherwise errors with ERR_PNPM_IGNORED_BUILDS
RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts && pnpm rebuild

# ─── build: prisma generate + next build ─────────────────────────
FROM node:${NODE_VERSION} AS builder
ENV CI=true
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN pnpm build

# ─── runner: minimal runtime ─────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Prisma CLI + engines for `migrate deploy` at container startup.
# We tried cherry-picking pnpm packages (@prisma+client*, @prisma+engines*, ...)
# but BuildKit kept choking on pnpm's symlink layout ("cannot copy to non-
# directory", "cannot replace to directory ... with file"). Copying the whole
# node_modules from the builder stage is heavier (~500MB extra in the image)
# but reliably preserves pnpm's symlink graph in one atomic operation.
# Numeric --chown is required because --link layers are merged in isolation
# and don't see the runner stage's /etc/passwd.
COPY --link --from=builder --chown=1001:1001 /app/node_modules ./node_modules

# Run pending migrations before the app boots — fails the container if migrations
# are broken, which is the correct behaviour (don't serve traffic on wrong schema).
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/auth/session > /dev/null || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
