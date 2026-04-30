import { Prisma } from "@prisma/client";

// Filter shape — matches the URL params used by /events listing.
// All fields optional; missing means "any".
export type SearchFilters = {
  q?: string;
  country?: string; // ISO 3166-1 alpha-2
  category?: string; // category slug
  age?: string; // e.g. "U10"
  format?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  free?: boolean;
  priceMax?: number;
};

const ALLOWED_KEYS: (keyof SearchFilters)[] = [
  "q", "country", "category", "age", "format", "gender", "free", "priceMax",
];

export function parseSearchFilters(input: unknown): SearchFilters {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const out: SearchFilters = {};
  for (const key of ALLOWED_KEYS) {
    const v = obj[key];
    if (v == null || v === "") continue;
    if (key === "free") out.free = Boolean(v);
    else if (key === "priceMax") {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out.priceMax = n;
    } else if (key === "gender") {
      if (v === "MALE" || v === "FEMALE" || v === "MIXED") out.gender = v;
    } else {
      out[key] = String(v).slice(0, 100);
    }
  }
  return out;
}

export function filtersFromSearchParams(sp: URLSearchParams | Record<string, string | string[] | undefined>): SearchFilters {
  const get = (k: string): string => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? "";
    const v = sp[k];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  return parseSearchFilters({
    q:        get("q"),
    country:  get("country"),
    category: get("category"),
    age:      get("age"),
    format:   get("format"),
    gender:   get("gender"),
    free:     get("free") === "1",
    priceMax: get("priceMax") || undefined,
  });
}

export function filtersToSearchParams(f: SearchFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q)        sp.set("q", f.q);
  if (f.country)  sp.set("country", f.country);
  if (f.category) sp.set("category", f.category);
  if (f.age)      sp.set("age", f.age);
  if (f.format)   sp.set("format", f.format);
  if (f.gender)   sp.set("gender", f.gender);
  if (f.free)     sp.set("free", "1");
  if (f.priceMax) sp.set("priceMax", String(f.priceMax));
  return sp;
}

export function isEmptyFilters(f: SearchFilters): boolean {
  return Object.values(f).every((v) => v == null || v === "" || v === false);
}

// Build a Prisma where clause that matches events for the given filter set.
// Translation-based search (q) uses 'contains' across event translations.
export function filtersToPrismaWhere(
  f: SearchFilters,
  baseWhere: Prisma.EventWhereInput = {},
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { ...baseWhere };
  const AND: Prisma.EventWhereInput[] = [];

  if (f.country) AND.push({ countryCode: f.country });
  if (f.category) AND.push({ category: { slug: f.category } });
  if (f.age) AND.push({ ageGroups: { has: f.age as never } });
  if (f.format) AND.push({ format: f.format });
  if (f.gender) AND.push({ gender: f.gender });
  if (f.free) AND.push({ isFree: true });
  if (f.priceMax) AND.push({ OR: [{ isFree: true }, { priceFrom: { lte: f.priceMax } }] });

  if (f.q) {
    const q = f.q.trim();
    if (q) {
      AND.push({
        OR: [
          { translations: { some: { title: { contains: q, mode: "insensitive" } } } },
          { translations: { some: { shortDescription: { contains: q, mode: "insensitive" } } } },
          { customLocation: { contains: q, mode: "insensitive" } },
        ],
      });
    }
  }

  if (AND.length > 0) where.AND = AND;
  return where;
}

// Auto-derive a human-readable label from the filters when no explicit name.
// e.g. "Camps in Estonia for U12" / "Free events in Spain".
export function summarizeFilters(
  f: SearchFilters,
  lookups: {
    countryName?: (code: string) => string | null;
    categoryName?: (slug: string) => string | null;
  } = {},
): string {
  const parts: string[] = [];
  if (f.category) {
    const name = lookups.categoryName?.(f.category) ?? f.category;
    parts.push(name);
  } else {
    parts.push("Events");
  }
  if (f.country) {
    const name = lookups.countryName?.(f.country) ?? f.country;
    parts.push(`in ${name}`);
  }
  if (f.age) parts.push(`for ${f.age}`);
  if (f.format) parts.push(`(${f.format})`);
  if (f.gender) parts.push(`· ${f.gender.toLowerCase()}`);
  if (f.free) parts.push("· free");
  if (f.priceMax) parts.push(`· up to €${f.priceMax}`);
  if (f.q) parts.push(`· "${f.q}"`);
  return parts.join(" ").slice(0, 100);
}
