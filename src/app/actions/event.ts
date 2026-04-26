"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { tierAllows } from "@/lib/tier";

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
  customLocation:    z.string().optional(),
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
});

export type EventFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

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
    customLocation:    formData.get("customLocation") || undefined,
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

  let venueId: string | null = null;
  if (d.city) {
    // Optional: try to match a known venue by city — skipped here, can add later.
  }

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
      customLocation: d.customLocation || null,
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
        create: {
          locale: "en",
          title: d.titleEn,
          shortDescription: d.shortDescEn || null,
          description: d.descriptionEn,
        },
      },
    },
  });

  revalidatePath("/organizer/dashboard");
  revalidatePath("/organizer/events");
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
    customLocation:    formData.get("customLocation") || undefined,
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
      customLocation: d.customLocation || null,
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
        upsert: {
          where: { eventId_locale: { eventId: id, locale: "en" } },
          create: { locale: "en", title: d.titleEn, shortDescription: d.shortDescEn || null, description: d.descriptionEn },
          update: { title: d.titleEn, shortDescription: d.shortDescEn || null, description: d.descriptionEn },
        },
      },
    },
  });

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
