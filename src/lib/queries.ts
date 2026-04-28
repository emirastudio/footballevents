import { db } from "./db";
import type { MockEvent, MockOrganizer, MockVenue, MockReview } from "./mock-data";
import { Prisma, type EventType } from "@prisma/client";

const eventInclude = {
  category: true,
  organizer: true,
  venue: true,
  translations: true,
  divisions: { orderBy: { order: "asc" } },
  _count: { select: { saves: true } },
} satisfies Prisma.EventInclude;

type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

/** For values stored as `{ en: [...], ru: [...] }` (or legacy plain array) — return the array for the requested locale, falling back to EN. */
function pickLocalizedArray(value: unknown, locale: string): unknown[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as unknown[]; // legacy plain array
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const got = obj[locale] ?? obj.en;
    if (Array.isArray(got)) return got as unknown[];
  }
  return undefined;
}

/** For included/notIncluded which have a JSONB I18n column + a legacy String[] EN mirror. */
function pickLocalizedLines(i18n: unknown, legacy: string[], locale: string): string[] {
  if (i18n && typeof i18n === "object" && !Array.isArray(i18n)) {
    const obj = i18n as Record<string, unknown>;
    const wanted = obj[locale];
    if (Array.isArray(wanted)) return wanted.filter((x): x is string => typeof x === "string");
    const en = obj.en;
    if (Array.isArray(en)) return en.filter((x): x is string => typeof x === "string");
  }
  return legacy;
}

function toMockEvent(e: EventRow, preferredLocale: string = "en"): MockEvent {
  // Pick the best available translation: requested locale → English fallback → first available.
  const wanted = e.translations.find((t) => t.locale === preferredLocale);
  const en     = e.translations.find((t) => t.locale === "en");
  const picked = wanted ?? en ?? e.translations[0];
  const usedLocale = (picked?.locale ?? "en") as MockEvent["titleLocale"];
  // True only when the picked translation isn't in the requested language.
  const fallback = !!preferredLocale && usedLocale !== preferredLocale;
  return {
    id: e.id,
    slug: e.slug,
    title: picked?.title ?? e.slug,
    shortDescription: picked?.shortDescription ?? "",
    description: picked?.description ?? "",
    titleLocale: usedLocale,
    titleFallback: fallback,
    type: e.type as MockEvent["type"],
    categorySlug: e.category.slug,
    organizerSlug: e.organizer.slug,
    venueSlug: e.venue?.slug,
    countryCode: e.countryCode ?? "",
    city: e.venue?.address?.split(",").pop()?.trim() ?? e.organizer.city ?? "",
    startDate: e.startDate?.toISOString() ?? "",
    endDate: e.endDate?.toISOString() ?? "",
    ageGroups: e.ageGroups as unknown as string[],
    gender: e.gender as MockEvent["gender"],
    format: e.format ?? undefined,
    skillLevel: e.skillLevel as MockEvent["skillLevel"],
    priceFrom: e.priceFrom ? Number(e.priceFrom) : 0,
    priceTo: e.priceTo ? Number(e.priceTo) : undefined,
    currency: e.currency,
    isFree: e.isFree,
    coverUrl: e.coverUrl ?? "",
    galleryUrls: e.galleryUrls,
    rating: e.ratingAvg,
    reviewsCount: e.ratingCount,
    isPremium: e.boostTier === "PREMIUM",
    isFeatured: e.isFeatured,
    logoUrl: e.logoUrl ?? e.organizer.logoUrl ?? undefined,
    savesCount: e._count.saves,
    program: pickLocalizedArray(e.program, preferredLocale) as MockEvent["program"],
    included:    pickLocalizedLines(e.includedI18n,    e.included,    preferredLocale),
    notIncluded: pickLocalizedLines(e.notIncludedI18n, e.notIncluded, preferredLocale),
    faq: pickLocalizedArray(e.faq, preferredLocale) as MockEvent["faq"],
    divisions: e.divisions.length === 0 ? undefined : e.divisions.map((d) => ({
      id: d.id,
      name: d.name,
      ageGroup: d.ageGroup as unknown as string,
      gender: d.gender as "MALE" | "FEMALE" | "MIXED",
      format: d.format,
      priceFrom: d.priceFrom ? Number(d.priceFrom) : undefined,
      priceTo: d.priceTo ? Number(d.priceTo) : undefined,
      currency: d.currency,
      isFree: d.isFree,
      maxTeams: d.maxTeams ?? undefined,
      spotsLeft: d.spotsLeft ?? undefined,
      startDate: d.startDate?.toISOString(),
      endDate: d.endDate?.toISOString(),
      externalUrl: d.externalUrl ?? undefined,
    })),
  };
}

const organizerInclude = {
  translations: true,
  events: { select: { id: true } },
  _count: { select: { followers: true } },
} satisfies Prisma.OrganizerInclude;

type OrganizerRow = Prisma.OrganizerGetPayload<{ include: typeof organizerInclude }>;

function toMockOrganizer(o: OrganizerRow): MockOrganizer {
  const en = o.translations.find((t) => t.locale === "en") ?? o.translations[0];
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    tagline: en?.tagline ?? "",
    about: en?.about ?? "",
    countryCode: o.countryCode ?? "",
    city: o.city ?? "",
    logoUrl: o.logoUrl ?? "",
    coverUrl: o.coverUrl ?? "",
    isVerified: o.isVerified,
    subscriptionTier: o.subscriptionTier as MockOrganizer["subscriptionTier"],
    eventsCount: o.events.length,
    rating: 0,
    reviewsCount: 0,
    followersCount: o._count.followers,
    website: o.website ?? undefined,
    socials: {
      instagram: o.instagramUrl ?? undefined,
      facebook: o.facebookUrl ?? undefined,
      x: o.xUrl ?? undefined,
      tiktok: o.tiktokUrl ?? undefined,
      youtube: o.youtubeUrl ?? undefined,
      whatsapp: o.whatsappUrl ?? undefined,
    },
  };
}

const venueInclude = {
  translations: true,
  events: { select: { id: true } },
} satisfies Prisma.VenueInclude;

type VenueRow = Prisma.VenueGetPayload<{ include: typeof venueInclude }>;

function toMockVenue(v: VenueRow): MockVenue {
  const en = v.translations.find((t) => t.locale === "en") ?? v.translations[0];
  return {
    id: v.id,
    slug: v.slug,
    name: v.name,
    countryCode: v.countryCode,
    city: v.address?.split(",").pop()?.trim() ?? "",
    address: v.address ?? "",
    capacity: v.capacity ?? undefined,
    surfaceType: v.surfaceType ?? undefined,
    coverUrl: v.coverUrl ?? "",
    galleryUrls: v.galleryUrls,
    description: en?.description ?? "",
    eventsCount: v.events.length,
    lat: v.lat ?? undefined,
    lng: v.lng ?? undefined,
  };
}

// Boost-aware ordering applied to every catalog list. PREMIUM tops, then
// FEATURED, then BASIC, then everything else, ties broken by start date.
// "Active" = boostUntil is in the future; expired boosts naturally drop out
// because we partition them in JS below — Prisma orderBy can't combine
// "is-active" + custom enum rank in a single SQL ORDER BY without raw SQL.
const BOOST_RANK: Record<string, number> = { PREMIUM: 3, FEATURED: 2, BASIC: 1 };
function sortByBoostThenDate<T extends { boostTier: string | null; boostUntil: Date | null; startDate: Date | null }>(rows: T[]): T[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const ar = a.boostUntil && a.boostUntil.getTime() > now ? (BOOST_RANK[a.boostTier ?? ""] ?? 0) : 0;
    const br = b.boostUntil && b.boostUntil.getTime() > now ? (BOOST_RANK[b.boostTier ?? ""] ?? 0) : 0;
    if (ar !== br) return br - ar;
    const ad = a.startDate?.getTime() ?? Infinity;
    const bd = b.startDate?.getTime() ?? Infinity;
    return ad - bd;
  });
}

// ─── Events ───────────────────────────────────────────
export async function getEvents(locale: string = "en"): Promise<MockEvent[]> {
  const rows = await db.event.findMany({
    where: { status: "PUBLISHED", ...(process.env.HIDE_DEMO === "1" ? { isDemo: false } : {}) },
    include: eventInclude,
  });
  return sortByBoostThenDate(rows).map((r) => toMockEvent(r, locale));
}

export async function getEventBySlug(slug: string, locale: string = "en"): Promise<MockEvent | null> {
  const e = await db.event.findUnique({ where: { slug }, include: eventInclude });
  return e ? toMockEvent(e, locale) : null;
}

export async function getEventSlugs(): Promise<string[]> {
  const rows = await db.event.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getEventsByCategory(slug: string, locale: string = "en"): Promise<MockEvent[]> {
  const rows = await db.event.findMany({
    where: { status: "PUBLISHED", category: { slug }, ...(process.env.HIDE_DEMO === "1" ? { isDemo: false } : {}) },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  });
  return rows.map((r) => toMockEvent(r, locale));
}

export async function getEventsByOrganizer(slug: string, locale: string = "en"): Promise<MockEvent[]> {
  const rows = await db.event.findMany({
    where: { status: "PUBLISHED", organizer: { slug }, ...(process.env.HIDE_DEMO === "1" ? { isDemo: false } : {}) },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  });
  return rows.map((r) => toMockEvent(r, locale));
}

export async function getEventsByVenue(slug: string, locale: string = "en"): Promise<MockEvent[]> {
  const rows = await db.event.findMany({
    where: { status: "PUBLISHED", venue: { slug }, ...(process.env.HIDE_DEMO === "1" ? { isDemo: false } : {}) },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  });
  return rows.map((r) => toMockEvent(r, locale));
}

// ─── Organizers ───────────────────────────────────────
export type OrganizerFilters = {
  countryCode?: string;
  tier?: "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";
  verified?: boolean;
  q?: string;
  activityType?: string; // EventType enum value
};

export async function getOrganizers(filters: OrganizerFilters = {}): Promise<MockOrganizer[]> {
  const where: Prisma.OrganizerWhereInput = {};
  if (filters.countryCode) where.countryCode = filters.countryCode;
  if (filters.tier) where.subscriptionTier = filters.tier;
  if (filters.verified) where.isVerified = true;
  if (filters.activityType) where.activityTypes = { has: filters.activityType as EventType };
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await db.organizer.findMany({ where, include: organizerInclude, orderBy: { name: "asc" } });
  return rows.map(toMockOrganizer);
}

/** Country codes that have at least one organizer in the DB. */
export async function getOrganizerCountryCodes(): Promise<string[]> {
  const rows = await db.organizer.findMany({
    where: { countryCode: { not: null } },
    distinct: ["countryCode"],
    select: { countryCode: true },
  });
  return rows
    .map((r) => r.countryCode)
    .filter((c): c is string => !!c)
    .sort();
}

export async function getOrganizerBySlug(slug: string): Promise<MockOrganizer | null> {
  const o = await db.organizer.findUnique({ where: { slug }, include: organizerInclude });
  return o ? toMockOrganizer(o) : null;
}

export async function getOrganizerSlugs(): Promise<string[]> {
  const rows = await db.organizer.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

// ─── Venues ───────────────────────────────────────────
export async function getVenues(): Promise<MockVenue[]> {
  const rows = await db.venue.findMany({ include: venueInclude, orderBy: { name: "asc" } });
  return rows.map(toMockVenue);
}

export async function getVenueBySlug(slug: string): Promise<MockVenue | null> {
  const v = await db.venue.findUnique({ where: { slug }, include: venueInclude });
  return v ? toMockVenue(v) : null;
}

export async function getVenueSlugs(): Promise<string[]> {
  const rows = await db.venue.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getStadiumsByCountry(): Promise<Record<string, MockVenue[]>> {
  const all = await getVenues();
  const grouped: Record<string, MockVenue[]> = {};
  for (const v of all) (grouped[v.countryCode] ??= []).push(v);
  return grouped;
}

// ─── Reviews ──────────────────────────────────────────
export async function getReviewsByEvent(eventId: string): Promise<MockReview[]> {
  const rows = await db.review.findMany({
    where: { eventId, status: "APPROVED" },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    authorName: r.author.name ?? "Anonymous",
    authorAvatar: r.author.image ?? undefined,
    rating: r.rating,
    title: r.title ?? undefined,
    body: r.body,
    createdAt: r.createdAt.toISOString().slice(0, 10),
    organizerReply: r.organizerReply ?? undefined,
  }));
}
