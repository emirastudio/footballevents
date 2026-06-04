// Co-organizers & partners shown on the public event page (display-only).
// Stored on Event.partners as a JSON array; authored in the event form.

export type PartnerKind = "coorganizer" | "partner";
export type Partner = { kind: PartnerKind; name: string; logoUrl?: string; url?: string; organizerId?: string };

/** Parse Event.partners (JSON value or stringified) into a safe, capped list. */
export function parsePartners(raw: unknown): Partner[] {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  const out: Partner[] = [];
  for (const x of arr) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!name) continue;
    const kind: PartnerKind = o.kind === "coorganizer" ? "coorganizer" : "partner";
    const logoUrl = typeof o.logoUrl === "string" && o.logoUrl.trim() ? o.logoUrl.trim() : undefined;
    let url = typeof o.url === "string" && o.url.trim() ? o.url.trim() : undefined;
    // Leave internal links (/org/…) alone; only external URLs get an https:// prefix.
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/")) url = `https://${url}`;
    const organizerId = typeof o.organizerId === "string" && o.organizerId.trim() ? o.organizerId.trim() : undefined;
    out.push({ kind, name: name.slice(0, 120), logoUrl, url, organizerId });
  }
  return out.slice(0, 30);
}
