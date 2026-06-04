// URL slug from arbitrary text. Strips Cyrillic/Latin diacritics, drops
// non-ASCII, collapses whitespace and dashes, caps to 60 chars.
//
// Same algorithm previously duplicated in app/actions/event.ts and
// app/actions/venue.ts — keep behaviour identical so existing slugs stay
// stable across renames.

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// Find a free slug by appending -2, -3, … up to `maxAttempts`. `exists` is the
// per-table existence probe (event vs venue vs article use different unique
// indexes, so the caller owns the lookup).
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
  maxAttempts = 99,
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let i = 2; i <= maxAttempts; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${Date.now()}`;
}
