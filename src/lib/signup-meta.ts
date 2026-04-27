import { headers } from "next/headers";

/** Pull the client IP from common forwarding headers. Falls back to "" if unknown. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Order matters — Cloudflare > generic forwarders > peer.
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xreal = h.get("x-real-ip");
  if (xreal) return xreal.trim();
  return "";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "";
}

/** Best-effort country lookup via the free ip-api.com service. Skips on private IPs. */
export async function getCountryFromIp(ip: string): Promise<string | null> {
  if (!ip) return null;
  // Skip RFC1918 / loopback / link-local — they'd hit the rate-limit for nothing.
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.|::1$|fc00:|fd00:)/.test(ip)) return null;
  // Cloudflare header takes precedence if present (set in fetch headers up the chain).
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`, {
      // Free service: keep the timeout tight and don't cache (per-IP).
      signal: AbortSignal.timeout(2_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status === "success" && typeof data.countryCode === "string") return data.countryCode.toUpperCase();
    return null;
  } catch {
    return null;
  }
}
