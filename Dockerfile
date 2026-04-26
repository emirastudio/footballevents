# syntax=docker/dockerfile:1.7
# Multi-stage Next.js standalone build for production.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=9.15.4

# ─── deps: install only production-ish deps with pnpm ────────────
FROM node:${NODE_VERSION} AS deps
ENV CI=true
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

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
# Prisma engine binaries the standalone runtime doesn't always pick up
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+client* ./node_modules/.pnpm/

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/auth/session > /dev/null || exit 1

CMD ["node", "server.js"]
