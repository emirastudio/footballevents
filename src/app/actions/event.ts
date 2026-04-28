"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { tierAllows, ACTIVE_EVENTS_LIMIT, type Tier } from "@/lib/tier";

// Returns null if creation is allowed, or the limit number when reached.
async function activeEventsLimitReached(organizerId: string, tier: Tier | string): Promise<number | null> {
  const limit = ACTIVE_EVENTS_LIMIT[(tier as Tier) ?? "FREE"];
  if (limit === null) return null; // unlimited
  const count = await db.event.count({
    where: { organizerId, status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] } },
  });
  return count >= limit ? limit : null;
}

const VIDEO_HOSTS = /^https?:\/\/([a-z0-9.-]+\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//i;

const baseSchema = z.object({
  categoryId:        z.string().min(1, "categoryRequired"),
  titleEn:           z.string().trim().min(2, "titleRequired"),
  shortDescEn:       z.string().trim().optional(),
  descriptionEn:     z.string().trim().min(20, "descriptionRequired"),
  startDate:         z.string().min(8),
  endDate:           z.string().min(8),
  registrationDeadline: z.string().optional(),
  timezone:          z.string().default("UTC"),
  countryCode:       z.string().length(2, "countryRequired"),
  city:              z.string().optional(),
  venueName:         z.string().trim().min(2, "venueNameRequired"),
  venueAddress:      z.string().trim().optional(),
  ageGroups:         z.array(z.string()).default([]),
  gender:            z.enum(["MALE", "FEMALE", "MIXED"]).default("MIXED"),
  skillLevel:        z.enum(["AMATEUR", "SEMI_PRO", "PROFESSIONAL", "ALL_LEVELS"]).default("ALL_LEVELS"),
  format:            z.string().optional(),
  maxParticipants:   z.coerce.number().int().positive().optional(),
  isFree:            z.coerce.boolean().default(false),
  priceFrom:         z.coerce.number().nonnegative().optional(),
  priceTo:           z.coerce.number().nonnegative().optional(),
  currency:          z.string().default("EUR"),
  externalUrl:       z.string().url().optional().or(z.literal("")),
  contactEmail:      z.string().email().optional().or(z.literal("")),
  contactPhone:      z.string().optional(),
  acceptsBookings:   z.coerce.boolean().default(true),
  videoUrl:          z.string().optional(),
  logoUrl:           z.string().optional(),
  coverUrl:          z.string().optional(),
  included:          z.string().optional(),       // raw textarea, one per line
  notIncluded:       z.string().optional(),
  programme:         z.string().optional(),
  faq:               z.string().optional(),
  intent:            z.enum(["draft", "review"]).default("draft"),
  secondLocale:      z.enum(["ru", "de", "es"]).optional().nullable(),
  titleSecond:       z.string().trim().optional(),
  shortDescSecond:   z.string().trim().optional(),
  descriptionSecond: z.string().trim().optional(),
});

export type EventFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

type ParsedEventInput = {
  titleEn: string; shortDescEn?: string; descriptionEn?: string;
  secondLocale?: "ru" | "de" | "es" | null;
  titleSecond?: string; shortDescSecond?: string; descriptionSecond?: string;
};

function buildEventTranslations(d: ParsedEventInput) {
  const rows: { locale: "en" | "ru" | "de" | "es"; title: string; shortDescription: string | null; description: string }[] = [
    { locale: "en", title: d.titleEn, shortDescription: d.shortDescEn || null, description: d.descriptionEn ?? "" },
  ];
  if (d.secondLocale && d.titleSecond && d.descriptionSecond && d.descriptionSecond.length >= 20) {
    rows.push({
      locale: d.secondLocale,
      title: d.titleSecond,
      shortDescription: d.shortDescSecond || null,
      description: d.descriptionSecond,
    });
  }
  return rows;
}

async function ensureCountry(code: string): Promise<boolean> {
  const exists = await db.country.findUnique({ where: { code } });
  if (exists) return true;
  // Use world-countries data (same source as the catalog UI) to backfill the row.
  const { findCountry } = await import("@/lib/countries");
  const c = findCountry(code);
  if (!c) return false;
  await db.country.upsert({
    where: { code },
    update: {},
    create: { code, nameEn: c.name, flagEmoji: c.flag },
  });
  return true;
}

async function upsertVenue(v: { name: string; countryCode: string; city: string | null; address: string | null }): Promise<string> {
  await ensureCountry(v.countryCode);
  const trimmedName = v.name.trim();
  // Match existing venue case-insensitively within the same country.
  const existing = await db.venue.findFirst({
    where: {
      countryCode: v.countryCode,
      name: { equals: trimmedName, mode: "insensitive" },
    },
    select: { id: true, address: true },
  });
  if (existing) {
    // Backfill address if it was missing.
    if (!existing.address && v.address) {
      await db.venue.update({ where: { id: existing.id }, data: { address: v.address } });
    }
    return existing.id;
  }
  // Create a new venue with a unique slug.
  let baseSlug = slugify(trimmedName) || "venue";
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const taken = await db.venue.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${baseSlug}-${nanoid(4).toLowerCase()}`;
  }
  const created = await db.venue.create({
    data: {
      slug,
      name: trimmedName,
      countryCode: v.countryCode,
      address: v.address,
      isStadium: false,
    },
  });
  return created.id;
}

function slugify(s: string) {
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

function parseProgramme(raw?: string): { day: number; title: string; items: string[] }[] | null {
  if (!raw?.trim()) return null;
  // Wizard sends JSON (array of {title, items[]}). Legacy form sent text. Accept both.
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const days = parsed
          .map((d) => {
            const obj = d as { title?: unknown; items?: unknown };
            const title = typeof obj.title === "string" ? obj.title.trim() : "";
            const items = Array.isArray(obj.items)
              ? obj.items.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
              : [];
            return { title, items };
          })
          .filter((d) => d.title || d.items.length)
          .map((d, i) => ({ day: i + 1, ...d }));
        return days.length ? days : null;
      }
    } catch { /* fall through to text */ }
  }
  const days: { day: number; title: string; items: string[] }[] = [];
  let current: { title: string; items: string[] } | null = null;
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) {
      if (current) { days.push({ day: days.length + 1, ...current }); current = null; }
      continue;
    }
    if (!current) current = { title: line, items: [] };
    else current.items.push(line);
  }
  if (current) days.push({ day: days.length + 1, ...current });
  return days.length ? days : null;
}

function parseFaq(raw?: string): { q: string; a: string }[] | null {
  if (!raw?.trim()) return null;
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const items = parsed
          .map((p) => {
            const o = p as { q?: unknown; a?: unknown };
            return { q: typeof o.q === "string" ? o.q.trim() : "", a: typeof o.a === "string" ? o.a.trim() : "" };
          })
          .filter((x) => x.q && x.a);
        return items.length ? items : null;
      }
    } catch { /* fall through to text */ }
  }
  const out: { q: string; a: string }[] = [];
  let q: string | null = null;
  let a: string[] = [];
  for (const lineRaw of raw.split("\n")) {
    const line = lineRaw.trim();
    if (!line) {
      if (q) { out.push({ q, a: a.join(" ").trim() }); q = null; a = []; }
      continue;
    }
    const qMatch = line.match(/^Q\s*[:.\-]\s*(.+)$/i);
    const aMatch = line.match(/^A\s*[:.\-]\s*(.+)$/i);
    if (qMatch) { if (q) { out.push({ q, a: a.join(" ").trim() }); a = []; } q = qMatch[1]; }
    else if (aMatch) a.push(aMatch[1]);
    else if (q) a.push(line);
  }
  if (q) out.push({ q, a: a.join(" ").trim() });
  return out.length ? out : null;
}

function splitLines(raw?: string): string[] {
  if (!raw) return [];
  return raw.split("\n").map((s) => s.trim()).filter(Boolean);
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const limit = await activeEventsLimitReached(organizer.id, organizer.subscriptionTier);
  if (limit !== null) return { error: `eventLimitReached:${limit}:${organizer.subscriptionTier}` };

  const ageGroupsRaw = formData.getAll("ageGroups").map((v) => String(v));
  const parsed = baseSchema.safeParse({
    categoryId:        formData.get("categoryId"),
    titleEn:           formData.get("titleEn"),
    shortDescEn:       formData.get("shortDescEn") || undefined,
    descriptionEn:     formData.get("descriptionEn"),
    startDate:         formData.get("startDate"),
    endDate:           formData.get("endDate"),
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    timezone:          (formData.get("timezone") as string) || "UTC",
    countryCode:       formData.get("countryCode"),
    city:              formData.get("city") || undefined,
    venueName:         formData.get("venueName"),
    venueAddress:      formData.get("venueAddress") || undefined,
    ageGroups:         ageGroupsRaw,
    gender:            formData.get("gender") || "MIXED",
    skillLevel:        formData.get("skillLevel") || "ALL_LEVELS",
    format:            formData.get("format") || undefined,
    maxParticipants:   formData.get("maxParticipants") || undefined,
    isFree:            formData.get("isFree") === "on" || formData.get("isFree") === "true",
    priceFrom:         formData.get("priceFrom") || undefined,
    priceTo:           formData.get("priceTo") || undefined,
    currency:          (formData.get("currency") as string) || "EUR",
    externalUrl:       formData.get("externalUrl") || "",
    contactEmail:      formData.get("contactEmail") || "",
    contactPhone:      formData.get("contactPhone") || undefined,
    acceptsBookings:   formData.get("acceptsBookings") === "on" || formData.get("acceptsBookings") === "true",
    videoUrl:          formData.get("videoUrl") || undefined,
    logoUrl:           formData.get("logoUrl") || undefined,
    coverUrl:          formData.get("coverUrl") || undefined,
    included:          formData.get("included") || undefined,
    notIncluded:       formData.get("notIncluded") || undefined,
    programme:         formData.get("programme") || undefined,
    faq:               formData.get("faq") || undefined,
    intent:            formData.get("intent") || "draft",
    secondLocale:      (formData.get("secondLocale") as string) || undefined,
    titleSecond:       (formData.get("titleSecond") as string) || undefined,
    shortDescSecond:   (formData.get("shortDescSecond") as string) || undefined,
    descriptionSecond: (formData.get("descriptionSecond") as string) || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const d = parsed.data;

  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  if (end < start) return { error: "datesInvalid", fieldErrors: { endDate: "datesInvalid" } };

  if (!d.isFree && d.priceFrom !== undefined && d.priceTo !== undefined && d.priceTo <= d.priceFrom) {
    return { error: "priceRange", fieldErrors: { priceTo: "priceRange" } };
  }

  if (d.videoUrl && !VIDEO_HOSTS.test(d.videoUrl)) {
    return { error: "videoNotAllowed", fieldErrors: { videoUrl: "videoNotAllowed" } };
  }

  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return { error: "categoryRequired", fieldErrors: { categoryId: "categoryRequired" } };

  // Tier-gating: silently drop fields the tier doesn't allow (no error — they shouldn't have been visible).
  const tier = organizer.subscriptionTier;
  const includedClean    = tierAllows(tier, "included")  ? splitLines(d.included)    : [];
  const notIncludedClean = tierAllows(tier, "included")  ? splitLines(d.notIncluded) : [];
  const faqParsed        = tierAllows(tier, "faq")       ? parseFaq(d.faq)           : null;
  const videoUrlClean    = tierAllows(tier, "videoEmbed") ? (d.videoUrl ?? null)     : null;

  // Slug — title-based with random suffix to avoid collisions.
  const baseSlug = slugify(d.titleEn) || "event";
  const slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;

  // Upsert Venue by (countryCode + lowercased name) — auto-publishes to /stadiums catalog.
  const venueId = await upsertVenue({
    name: d.venueName,
    countryCode: d.countryCode,
    city: d.city ?? null,
    address: d.venueAddress ?? null,
  });

  const created = await db.event.create({
    data: {
      slug,
      organizerId: organizer.id,
      categoryId: category.id,
      type: category.type,
      status: d.intent === "review" ? "PENDING_REVIEW" : "DRAFT",
      startDate: start,
      endDate: end,
      registrationDeadline: d.registrationDeadline ? new Date(d.registrationDeadline) : null,
      timezone: d.timezone,
      countryCode: d.countryCode,
      venueId,
      customLocation: d.venueAddress || null,
      ageGroups: d.ageGroups as never,
      gender: d.gender,
      skillLevel: d.skillLevel,
      format: d.format || null,
      maxParticipants: d.maxParticipants ?? null,
      priceFrom: d.isFree ? null : d.priceFrom ?? null,
      priceTo:   d.isFree ? null : d.priceTo   ?? null,
      currency: d.currency,
      isFree: d.isFree,
      coverUrl: d.coverUrl || null,
      logoUrl:  d.logoUrl  || null,
      videoUrl: videoUrlClean,
      externalUrl: d.externalUrl || null,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone || null,
      acceptsBookings: d.acceptsBookings,
      included: includedClean,
      notIncluded: notIncludedClean,
      program: parseProgramme(d.programme) as never,
      faq: faqParsed as never,
      translations: {
        create: buildEventTranslations(d),
      },
    },
  });

  revalidatePath("/organizer/dashboard");
  revalidatePath("/organizer/events");
  if (d.intent === "review") revalidatePath("/admin/events");
  redirect(`/organizer/events/${created.id}`);
}

const updateSchema = baseSchema.extend({ id: z.string().min(1) });

export async function updateEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing event id" };
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== organizer.id) return { error: "Not found" };

  const ageGroupsRaw = formData.getAll("ageGroups").map((v) => String(v));
  const parsed = updateSchema.safeParse({
    id,
    categoryId:        formData.get("categoryId"),
    titleEn:           formData.get("titleEn"),
    shortDescEn:       formData.get("shortDescEn") || undefined,
    descriptionEn:     formData.get("descriptionEn"),
    startDate:         formData.get("startDate"),
    endDate:           formData.get("endDate"),
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    timezone:          (formData.get("timezone") as string) || "UTC",
    countryCode:       formData.get("countryCode"),
    city:              formData.get("city") || undefined,
    venueName:         formData.get("venueName"),
    venueAddress:      formData.get("venueAddress") || undefined,
    ageGroups:         ageGroupsRaw,
    gender:            formData.get("gender") || "MIXED",
    skillLevel:        formData.get("skillLevel") || "ALL_LEVELS",
    format:            formData.get("format") || undefined,
    maxParticipants:   formData.get("maxParticipants") || undefined,
    isFree:            formData.get("isFree") === "on" || formData.get("isFree") === "true",
    priceFrom:         formData.get("priceFrom") || undefined,
    priceTo:           formData.get("priceTo") || undefined,
    currency:          (formData.get("currency") as string) || "EUR",
    externalUrl:       formData.get("externalUrl") || "",
    contactEmail:      formData.get("contactEmail") || "",
    contactPhone:      formData.get("contactPhone") || undefined,
    acceptsBookings:   formData.get("acceptsBookings") === "on" || formData.get("acceptsBookings") === "true",
    videoUrl:          formData.get("videoUrl") || undefined,
    logoUrl:           formData.get("logoUrl") || undefined,
    coverUrl:          formData.get("coverUrl") || undefined,
    included:          formData.get("included") || undefined,
    notIncluded:       formData.get("notIncluded") || undefined,
    programme:         formData.get("programme") || undefined,
    faq:               formData.get("faq") || undefined,
    intent:            formData.get("intent") || "draft",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const d = parsed.data;
  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  if (end < start) return { error: "datesInvalid", fieldErrors: { endDate: "datesInvalid" } };
  if (!d.isFree && d.priceFrom !== undefined && d.priceTo !== undefined && d.priceTo <= d.priceFrom) {
    return { error: "priceRange", fieldErrors: { priceTo: "priceRange" } };
  }
  if (d.videoUrl && !VIDEO_HOSTS.test(d.videoUrl)) {
    return { error: "videoNotAllowed", fieldErrors: { videoUrl: "videoNotAllowed" } };
  }
  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return { error: "categoryRequired", fieldErrors: { categoryId: "categoryRequired" } };

  const tier = organizer.subscriptionTier;
  const includedClean    = tierAllows(tier, "included")  ? splitLines(d.included)    : [];
  const notIncludedClean = tierAllows(tier, "included")  ? splitLines(d.notIncluded) : [];
  const faqParsed        = tierAllows(tier, "faq")       ? parseFaq(d.faq)           : null;
  const videoUrlClean    = tierAllows(tier, "videoEmbed") ? (d.videoUrl ?? null)     : null;

  // Status transition rules: editing a PUBLISHED event keeps it PUBLISHED unless intent=review (re-moderation).
  let nextStatus = existing.status;
  if (d.intent === "review" && existing.status === "DRAFT") nextStatus = "PENDING_REVIEW";
  if (d.intent === "review" && existing.status === "REJECTED") nextStatus = "PENDING_REVIEW";

  await db.event.update({
    where: { id },
    data: {
      categoryId: category.id,
      type: category.type,
      status: nextStatus,
      startDate: start,
      endDate: end,
      registrationDeadline: d.registrationDeadline ? new Date(d.registrationDeadline) : null,
      timezone: d.timezone,
      countryCode: d.countryCode,
      venueId: await upsertVenue({
        name: d.venueName,
        countryCode: d.countryCode,
        city: d.city ?? null,
        address: d.venueAddress ?? null,
      }),
      customLocation: d.venueAddress || null,
      ageGroups: d.ageGroups as never,
      gender: d.gender,
      skillLevel: d.skillLevel,
      format: d.format || null,
      maxParticipants: d.maxParticipants ?? null,
      priceFrom: d.isFree ? null : d.priceFrom ?? null,
      priceTo:   d.isFree ? null : d.priceTo   ?? null,
      currency: d.currency,
      isFree: d.isFree,
      coverUrl: d.coverUrl || null,
      logoUrl:  d.logoUrl  || null,
      videoUrl: videoUrlClean,
      externalUrl: d.externalUrl || null,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone || null,
      acceptsBookings: d.acceptsBookings,
      included: includedClean,
      notIncluded: notIncludedClean,
      program: parseProgramme(d.programme) as never,
      faq: faqParsed as never,
    },
  });

  // Upsert each translation (en + optional second locale).
  for (const tr of buildEventTranslations(d)) {
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: id, locale: tr.locale } },
      create: { eventId: id, locale: tr.locale, title: tr.title, shortDescription: tr.shortDescription, description: tr.description },
      update: { title: tr.title, shortDescription: tr.shortDescription, description: tr.description },
    });
  }

  revalidatePath("/organizer/events");
  revalidatePath(`/events/${existing.slug}`);
  redirect(`/organizer/events/${id}`);
}

export async function deleteEventAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");
  const id = formData.get("id") as string;
  if (!id) return;
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== organizer.id) return;
  await db.event.delete({ where: { id } });
  revalidatePath("/organizer/events");
  redirect("/organizer/events");
}

export async function archiveEventAction(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");
  const id = formData.get("id") as string;
  if (!id) return;
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== organizer.id) return;
  await db.event.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/organizer/events");
  redirect("/organizer/events");
}

// ─────────────────────────────────────────────────────────────
// WIZARD — incremental draft save, one step at a time
// ─────────────────────────────────────────────────────────────

const STEPS = [1, 2, 3, 4, 5] as const;
type WizardStep = (typeof STEPS)[number];

export type WizardState = { error?: string; fieldErrors?: Record<string, string>; eventId?: string } | null;

const stepSchemas = {
  1: z.object({
    categoryId:        z.string().min(1, "categoryRequired"),
    titleEn:           z.string().trim().min(2, "titleRequired"),
    shortDescEn:       z.string().trim().optional(),
    descriptionEn:     z.string().trim().optional(),
    secondLocale:      z.enum(["ru", "de", "es"]).optional().nullable(),
    titleSecond:       z.string().trim().optional(),
    shortDescSecond:   z.string().trim().optional(),
    descriptionSecond: z.string().trim().optional(),
  }),
  2: z.object({
    startDate:            z.string().optional(),
    endDate:              z.string().optional(),
    registrationDeadline: z.string().optional(),
    countryCode:          z.string().optional(),
    city:                 z.string().optional(),
    venueName:            z.string().trim().optional(),
    venueAddress:         z.string().trim().optional(),
  }),
  3: z.object({
    ageGroups:       z.array(z.string()).default([]),
    gender:          z.enum(["MALE", "FEMALE", "MIXED"]).default("MIXED"),
    skillLevel:      z.enum(["AMATEUR", "SEMI_PRO", "PROFESSIONAL", "ALL_LEVELS"]).default("ALL_LEVELS"),
    format:          z.string().optional(),
    maxParticipants: z.coerce.number().int().positive().optional(),
  }),
  4: z.object({
    isFree:          z.coerce.boolean().default(false),
    priceFrom:       z.coerce.number().nonnegative().optional(),
    priceTo:         z.coerce.number().nonnegative().optional(),
    currency:        z.string().default("EUR"),
    externalUrl:     z.string().url().optional().or(z.literal("")),
    contactEmail:    z.string().email().optional().or(z.literal("")),
    contactPhone:    z.string().optional(),
    acceptsBookings: z.coerce.boolean().default(true),
  }),
  5: z.object({
    logoUrl:           z.string().optional(),
    coverUrl:          z.string().optional(),
    videoUrl:          z.string().optional(),
    // Per-locale JSON blobs from the wizard. Keys: locale ("en" | "ru" | "de" | "es").
    includedI18n:      z.string().optional(),    // { en: "line1\nline2", ru: "…" }
    notIncludedI18n:   z.string().optional(),
    programmeI18n:     z.string().optional(),    // { en: Day[], ru: Day[] }
    faqI18n:           z.string().optional(),    // { en: Qa[], ru: Qa[] }
  }),
} as const;

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const fe: Record<string, string> = {};
  for (const issue of err.issues) fe[issue.path.join(".")] = issue.message;
  return fe;
}

function isWizardStep(n: number): n is WizardStep {
  return n >= 1 && n <= 5;
}

/** Save one step of the wizard. `direction`: "next" / "prev" / "publish". */
export async function wizardSaveAction(_prev: WizardState, formData: FormData): Promise<WizardState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const step = Number(formData.get("step") ?? 1);
  const eventId = (formData.get("eventId") as string) || null;
  const direction = (formData.get("direction") as string) || "next"; // "next" | "prev" | "publish"

  if (!isWizardStep(step)) return { error: "invalidStep" };

  // Load existing event if any.
  const existing = eventId
    ? await db.event.findUnique({ where: { id: eventId } })
    : null;
  if (eventId && (!existing || existing.organizerId !== organizer.id)) {
    return { error: "notFound" };
  }

  // Parse current step's fields.
  const schema = stepSchemas[step];
  const parsed = schema.safeParse(parseStepInput(step, formData));
  if (!parsed.success) {
    return { error: "validation", fieldErrors: fieldErrorsFromZod(parsed.error), eventId: eventId ?? undefined };
  }
  const d = parsed.data as never as Record<string, unknown>;

  // Step 1 with no event yet → create a fresh DRAFT.
  if (!existing) {
    if (step !== 1) return { error: "stepRequiresEvent" };
    const data = parsed.data as z.infer<typeof stepSchemas[1]>;
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) return { error: "categoryRequired", fieldErrors: { categoryId: "categoryRequired" } };

    const limit = await activeEventsLimitReached(organizer.id, organizer.subscriptionTier);
    if (limit !== null) return { error: `eventLimitReached:${limit}:${organizer.subscriptionTier}` };

    const baseSlug = slugify(data.titleEn) || "event";
    const slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;

    const created = await db.event.create({
      data: {
        slug,
        organizerId: organizer.id,
        categoryId: category.id,
        type: category.type,
        status: "DRAFT",
        wizardStep: 2, // moving to step 2 next
        translations: { create: buildEventTranslations(data) },
      },
    });
    revalidatePath("/organizer/events");
    redirect(`/organizer/events/${created.id}/setup?step=2`);
  }

  // Update existing event with this step's fields.
  const update: Record<string, unknown> = {};
  switch (step) {
    case 1: {
      const data = parsed.data as z.infer<typeof stepSchemas[1]>;
      const category = await db.category.findUnique({ where: { id: data.categoryId } });
      if (!category) return { error: "categoryRequired", fieldErrors: { categoryId: "categoryRequired" } };
      update.categoryId = category.id;
      update.type = category.type;
      // Upsert translations
      for (const tr of buildEventTranslations(data)) {
        await db.eventTranslation.upsert({
          where: { eventId_locale: { eventId: existing.id, locale: tr.locale } },
          create: { eventId: existing.id, locale: tr.locale, title: tr.title, shortDescription: tr.shortDescription, description: tr.description },
          update: { title: tr.title, shortDescription: tr.shortDescription, description: tr.description },
        });
      }
      // Drop secondary translation if user cleared the picker.
      if (!data.secondLocale) {
        await db.eventTranslation.deleteMany({ where: { eventId: existing.id, locale: { not: "en" } } });
      }
      break;
    }
    case 2: {
      const data = parsed.data as z.infer<typeof stepSchemas[2]>;
      if (data.countryCode) await ensureCountry(data.countryCode);
      update.startDate = data.startDate ? new Date(data.startDate) : null;
      update.endDate = data.endDate ? new Date(data.endDate) : null;
      update.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
      update.countryCode = data.countryCode || null;
      if (data.venueName && data.countryCode) {
        update.venueId = await upsertVenue({
          name: data.venueName,
          countryCode: data.countryCode,
          city: data.city ?? null,
          address: data.venueAddress ?? null,
        });
      } else {
        update.venueId = null;
      }
      update.customLocation = data.venueAddress || null;
      break;
    }
    case 3: {
      const data = parsed.data as z.infer<typeof stepSchemas[3]>;
      update.ageGroups = data.ageGroups as never;
      update.gender = data.gender;
      update.skillLevel = data.skillLevel;
      update.format = data.format || null;
      update.maxParticipants = data.maxParticipants ?? null;
      break;
    }
    case 4: {
      const data = parsed.data as z.infer<typeof stepSchemas[4]>;
      update.isFree = data.isFree;
      update.priceFrom = data.isFree ? null : data.priceFrom ?? null;
      update.priceTo   = data.isFree ? null : data.priceTo   ?? null;
      update.currency = data.currency;
      update.externalUrl = data.externalUrl || null;
      update.contactEmail = data.contactEmail || null;
      update.contactPhone = data.contactPhone || null;
      update.acceptsBookings = data.acceptsBookings;
      break;
    }
    case 5: {
      const data = parsed.data as z.infer<typeof stepSchemas[5]>;
      const tier = organizer.subscriptionTier;
      update.logoUrl = data.logoUrl || null;
      update.coverUrl = data.coverUrl || null;
      update.videoUrl = tierAllows(tier, "videoEmbed") && data.videoUrl ? data.videoUrl : null;
      if (data.videoUrl && !VIDEO_HOSTS.test(data.videoUrl)) {
        return { error: "videoNotAllowed", fieldErrors: { videoUrl: "videoNotAllowed" }, eventId: existing.id };
      }

      // Per-locale rich content. Form sends JSON {locale: text} for textareas, JSON {locale: array} for editors.
      const includedByLocale    = parseLocaleStringMap(data.includedI18n);
      const notIncludedByLocale = parseLocaleStringMap(data.notIncludedI18n);
      const programmeByLocale   = parseLocaleArrayMap(data.programmeI18n, parseProgramme);
      const faqByLocale         = parseLocaleArrayMap(data.faqI18n, parseFaq);

      const allowIncluded  = tierAllows(tier, "included");
      const allowProgramme = tierAllows(tier, "programme");
      const allowFaq       = tierAllows(tier, "faq");

      // Legacy mirrors (EN only) so older readers still work.
      update.included    = allowIncluded ? splitLines(includedByLocale.en)    : [];
      update.notIncluded = allowIncluded ? splitLines(notIncludedByLocale.en) : [];

      update.includedI18n    = allowIncluded ? buildLocalizedLines(includedByLocale)    : null;
      update.notIncludedI18n = allowIncluded ? buildLocalizedLines(notIncludedByLocale) : null;
      update.program         = allowProgramme ? (programmeByLocale as never) : null;
      update.faq             = allowFaq       ? (faqByLocale       as never) : null;
      break;
    }
  }

  // Decide the next step / status.
  let nextStep = step;
  // Editing a PUBLISHED / PENDING_REVIEW event keeps its status — moderators don't need to re-approve every typo.
  // DRAFT stays DRAFT until the user explicitly hits "Publish" (publish direction).
  let nextStatus: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" =
    existing.status === "PUBLISHED"
      ? "PUBLISHED"
      : existing.status === "PENDING_REVIEW"
        ? "PENDING_REVIEW"
        : "DRAFT";
  if (direction === "next" && step < 5) nextStep = (step + 1) as WizardStep;
  if (direction === "prev" && step > 1) nextStep = (step - 1) as WizardStep;
  if (direction === "publish") {
    // Validate publishability — required fields must be set.
    const publishErrors = collectPublishErrors({ ...existing, ...update });
    if (publishErrors) {
      return { error: "publishIncomplete", fieldErrors: publishErrors, eventId: existing.id };
    }
    // First-time submit: DRAFT/REJECTED → PENDING_REVIEW. Re-clicking "publish" on already-live event keeps PUBLISHED.
    if (existing.status === "DRAFT" || existing.status === "REJECTED") nextStatus = "PENDING_REVIEW";
  }

  update.wizardStep = Math.max(existing.wizardStep, nextStep);
  update.status = nextStatus;

  await db.event.update({ where: { id: existing.id }, data: update as never });

  revalidatePath("/organizer/events");
  revalidatePath(`/events/${existing.slug}`);
  // Admin moderation queue must reflect a freshly submitted event right away.
  if (nextStatus === "PENDING_REVIEW") revalidatePath("/admin/events");

  if (direction === "publish") {
    // After "Save changes" on a live event — bounce to the public page so the organizer can verify.
    if (existing.status === "PUBLISHED") redirect(`/events/${existing.slug}`);
    redirect(`/organizer/events`);
  }
  redirect(`/organizer/events/${existing.id}/setup?step=${nextStep}`);
}

function parseStepInput(step: WizardStep, formData: FormData) {
  switch (step) {
    case 1: return {
      categoryId:        formData.get("categoryId"),
      titleEn:           formData.get("titleEn"),
      shortDescEn:       formData.get("shortDescEn") || undefined,
      descriptionEn:     formData.get("descriptionEn") || undefined,
      secondLocale:      (formData.get("secondLocale") as string) || undefined,
      titleSecond:       (formData.get("titleSecond") as string) || undefined,
      shortDescSecond:   (formData.get("shortDescSecond") as string) || undefined,
      descriptionSecond: (formData.get("descriptionSecond") as string) || undefined,
    };
    case 2: return {
      startDate:            formData.get("startDate") || undefined,
      endDate:              formData.get("endDate") || undefined,
      registrationDeadline: formData.get("registrationDeadline") || undefined,
      countryCode:          formData.get("countryCode") || undefined,
      city:                 formData.get("city") || undefined,
      venueName:            formData.get("venueName") || undefined,
      venueAddress:         formData.get("venueAddress") || undefined,
    };
    case 3: return {
      ageGroups:        formData.getAll("ageGroups").map(String),
      gender:           formData.get("gender") || "MIXED",
      skillLevel:       formData.get("skillLevel") || "ALL_LEVELS",
      format:           formData.get("format") || undefined,
      maxParticipants:  formData.get("maxParticipants") || undefined,
    };
    case 4: return {
      isFree:           formData.get("isFree") === "on" || formData.get("isFree") === "true",
      priceFrom:        formData.get("priceFrom") || undefined,
      priceTo:          formData.get("priceTo") || undefined,
      currency:         (formData.get("currency") as string) || "EUR",
      externalUrl:      formData.get("externalUrl") || "",
      contactEmail:     formData.get("contactEmail") || "",
      contactPhone:     formData.get("contactPhone") || undefined,
      acceptsBookings:  formData.get("acceptsBookings") === "on" || formData.get("acceptsBookings") === "true",
    };
    case 5: {
      // Form sends per-locale fields (included_en, included_ru, programme_en, programme_ru, …).
      // We assemble JSON maps here and feed them through the same parsers downstream.
      const locales = ["en", "ru", "de", "es"] as const;
      const collect = (prefix: string) => {
        const out: Record<string, string> = {};
        for (const l of locales) {
          const v = formData.get(`${prefix}_${l}`);
          if (typeof v === "string" && v.trim()) out[l] = v;
        }
        return Object.keys(out).length ? JSON.stringify(out) : undefined;
      };
      return {
        logoUrl:         formData.get("logoUrl") || undefined,
        coverUrl:        formData.get("coverUrl") || undefined,
        videoUrl:        formData.get("videoUrl") || undefined,
        includedI18n:    collect("included"),
        notIncludedI18n: collect("notIncluded"),
        programmeI18n:   collect("programme"),
        faqI18n:         collect("faq"),
      };
    }
  }
}

type LocaleStringMap = Partial<Record<"en" | "ru" | "de" | "es", string>>;
type LocaleAnyMap<T> = Partial<Record<"en" | "ru" | "de" | "es", T>>;

/** Parse `{ "en": "line1\nline2", "ru": "..." }` JSON string from the form. */
function parseLocaleStringMap(raw?: string): LocaleStringMap {
  if (!raw?.trim()) return {};
  try {
    const obj = JSON.parse(raw) as unknown;
    if (obj && typeof obj === "object") {
      const out: LocaleStringMap = {};
      for (const k of ["en", "ru", "de", "es"] as const) {
        const v = (obj as Record<string, unknown>)[k];
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch { /* ignore */ }
  return {};
}

/** Parse `{ "en": [Day], "ru": [Day] }` and run each per-locale array through `parser` (parseProgramme / parseFaq). */
function parseLocaleArrayMap<T>(raw: string | undefined, parser: (s: string) => T[] | null): LocaleAnyMap<T[]> | null {
  if (!raw?.trim()) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return null;
    const out: LocaleAnyMap<T[]> = {};
    for (const k of ["en", "ru", "de", "es"] as const) {
      const v = (obj as Record<string, unknown>)[k];
      if (!v) continue;
      // The form serializes the editor's array as JSON; pass through parser to normalize.
      const inner = typeof v === "string" ? parser(v) : parser(JSON.stringify(v));
      if (inner && inner.length) out[k] = inner;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function buildLocalizedLines(map: LocaleStringMap): LocaleAnyMap<string[]> | null {
  const out: LocaleAnyMap<string[]> = {};
  for (const k of ["en", "ru", "de", "es"] as const) {
    const lines = splitLines(map[k]);
    if (lines.length) out[k] = lines;
  }
  return Object.keys(out).length ? out : null;
}

function collectPublishErrors(ev: { titleEn?: string; descriptionEn?: string; startDate?: Date | null; endDate?: Date | null; countryCode?: string | null; venueId?: string | null }): Record<string, string> | null {
  const fe: Record<string, string> = {};
  // titleEn/descriptionEn live in EventTranslation — we trust they were set in step 1; leave that to the form-side check.
  if (!ev.startDate) fe.startDate = "datesRequired";
  if (!ev.endDate) fe.endDate = "datesRequired";
  if (!ev.countryCode) fe.countryCode = "countryRequired";
  if (!ev.venueId) fe.venueName = "venueNameRequired";
  return Object.keys(fe).length ? fe : null;
}
