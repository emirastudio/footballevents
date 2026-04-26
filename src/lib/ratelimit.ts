import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

function makeLimiter(prefix: string, limit: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix: `fe:${prefix}` });
}

// Tuned per endpoint risk profile.
export const presignLimiter = makeLimiter("presign", 30, "1 m");
export const authLimiter    = makeLimiter("auth",    5,  "1 m");
export const applyLimiter   = makeLimiter("apply",   10, "1 h");

export async function consume(limiter: Ratelimit | null, key: string): Promise<{ ok: boolean; remaining?: number; reset?: number }> {
  if (!limiter) return { ok: true }; // No Redis → unlimited (dev / pre-prod)
  const r = await limiter.limit(key);
  return { ok: r.success, remaining: r.remaining, reset: r.reset };
}

export function clientKey(headers: Headers, fallback = "anon"): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    fallback
  );
}
