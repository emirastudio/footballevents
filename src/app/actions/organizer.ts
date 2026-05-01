"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const websiteField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.replace(/^[Hh][Tt][Tt][Pp][Ss]?:\/\//, "https://").toLowerCase() : ""))
  .transform((v) => {
    if (!v) return "";
    return /^https?:\/\//.test(v) ? v : `https://${v}`;
  })
  .refine((v) => !v || /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(v), {
    message: "Invalid URL — example: example.com or https://example.com",
  });

const onboardSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  countryCode: z.string().length(2),
  city: z.string().trim().optional(),
  taglineEn: z.string().trim().min(1, "English tagline is required"),
  aboutEn: z.string().trim().min(20, "English about must be at least 20 characters"),
  secondLocale: z.enum(["ru", "de", "es"]).optional().nullable(),
  taglineSecond: z.string().trim().optional(),
  aboutSecond: z.string().trim().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  website: websiteField,
  phone: z.string().optional(),
  tier: z.enum(["FREE", "PRO", "PREMIUM"]).default("FREE"),
  activityTypes: z.array(z.enum([
    "TOURNAMENT","CAMP","FESTIVAL","MASTERCLASS","MATCH_TOUR","CLINIC","SHOWCASE","TRAINING_CAMP","TRYOUT",
  ])).default([]),
});

export type OrganizerFormState = { error?: string; fieldErrors?: Record<string, string> } | null;
export type OrganizerSettingsState = { ok?: true; error?: string; fieldErrors?: Record<string, string> } | null;

const EVENT_TYPES = ["TOURNAMENT","CAMP","FESTIVAL","MASTERCLASS","MATCH_TOUR","CLINIC","SHOWCASE","TRAINING_CAMP","TRYOUT"] as const;

const socialUrl = z.string().trim().optional().transform((v) => v || "").refine(
  (v) => !v || /^https?:\/\/.+/.test(v),
  { message: "Must be a full URL starting with https://" },
);

const settingsSchema = z.object({
  name:       z.string().trim().min(2, "Name must be at least 2 characters"),
  legalName:  z.string().trim().optional(),
  email:      z.string().email("Invalid email"),
  phone:      z.string().trim().optional(),
  website:    websiteField,
  countryCode: z.string().length(2).optional().or(z.literal("")),
  city:       z.string().trim().optional(),
  activityTypes: z.array(z.enum(EVENT_TYPES)).default([]),
  logoUrl:    z.string().url().optional().or(z.literal("")),
  coverUrl:   z.string().url().optional().or(z.literal("")),
  taglineEn:  z.string().trim().min(1, "English tagline is required"),
  aboutEn:    z.string().trim().min(20, "English about must be at least 20 characters"),
  secondLocale: z.enum(["ru","de","es"]).optional().nullable(),
  taglineSecond: z.string().trim().optional(),
  aboutSecond:   z.string().trim().optional(),
  instagramUrl: socialUrl,
  facebookUrl:  socialUrl,
  xUrl:         socialUrl,
  tiktokUrl:    socialUrl,
  youtubeUrl:   socialUrl,
  whatsappUrl:  socialUrl,
});

export async function updateOrganizerSettingsAction(_prev: OrganizerSettingsState, formData: FormData): Promise<OrganizerSettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const parsed = settingsSchema.safeParse({
    name:       formData.get("name"),
    legalName:  formData.get("legalName") || undefined,
    email:      formData.get("email"),
    phone:      formData.get("phone") || undefined,
    website:    formData.get("website") || undefined,
    countryCode: formData.get("countryCode") || undefined,
    city:       formData.get("city") || undefined,
    activityTypes: formData.getAll("activityTypes").map(String),
    logoUrl:    formData.get("logoUrl") || undefined,
    coverUrl:   formData.get("coverUrl") || undefined,
    taglineEn:  formData.get("taglineEn"),
    aboutEn:    formData.get("aboutEn"),
    secondLocale: (formData.get("secondLocale") as string) || undefined,
    taglineSecond: formData.get("taglineSecond") || undefined,
    aboutSecond:   formData.get("aboutSecond") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    facebookUrl:  formData.get("facebookUrl") || undefined,
    xUrl:         formData.get("xUrl") || undefined,
    tiktokUrl:    formData.get("tiktokUrl") || undefined,
    youtubeUrl:   formData.get("youtubeUrl") || undefined,
    whatsappUrl:  formData.get("whatsappUrl") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }

  const d = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.organizer.update({
      where: { id: organizer.id },
      data: {
        name:       d.name,
        legalName:  d.legalName || null,
        email:      d.email,
        phone:      d.phone || null,
        website:    d.website || null,
        countryCode: d.countryCode || null,
        city:       d.city || null,
        activityTypes: d.activityTypes,
        logoUrl:    d.logoUrl || null,
        coverUrl:   d.coverUrl || null,
        instagramUrl: d.instagramUrl || null,
        facebookUrl:  d.facebookUrl || null,
        xUrl:         d.xUrl || null,
        tiktokUrl:    d.tiktokUrl || null,
        youtubeUrl:   d.youtubeUrl || null,
        whatsappUrl:  d.whatsappUrl || null,
      },
    });
    await tx.organizerTranslation.upsert({
      where: { organizerId_locale: { organizerId: organizer.id, locale: "en" } },
      create: { organizerId: organizer.id, locale: "en", tagline: d.taglineEn, about: d.aboutEn },
      update: { tagline: d.taglineEn, about: d.aboutEn },
    });
    if (d.secondLocale && d.taglineSecond && d.aboutSecond && d.aboutSecond.length >= 20) {
      await tx.organizerTranslation.upsert({
        where: { organizerId_locale: { organizerId: organizer.id, locale: d.secondLocale } },
        create: { organizerId: organizer.id, locale: d.secondLocale, tagline: d.taglineSecond, about: d.aboutSecond },
        update: { tagline: d.taglineSecond, about: d.aboutSecond },
      });
    }
  });

  revalidatePath("/organizer/settings");
  revalidatePath(`/org/${organizer.slug}`);
  revalidatePath("/organizer", "layout");
  return { ok: true };
}

export async function createOrganizerAction(_prev: OrganizerFormState, formData: FormData): Promise<OrganizerFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const existing = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (existing) return { error: "You already have an organizer profile." };

  const parsed = onboardSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    countryCode: formData.get("countryCode"),
    city: formData.get("city") || undefined,
    taglineEn: formData.get("taglineEn"),
    aboutEn: formData.get("aboutEn"),
    secondLocale: (formData.get("secondLocale") as string) || undefined,
    taglineSecond: (formData.get("taglineSecond") as string) || undefined,
    aboutSecond: (formData.get("aboutSecond") as string) || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    tier: (formData.get("tier") as string) || "FREE",
    activityTypes: formData.getAll("activityTypes").map(String),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }

  const data = parsed.data;
  const slugTaken = await db.organizer.findUnique({ where: { slug: data.slug } });
  if (slugTaken) return { error: "This URL slug is already taken — try another.", fieldErrors: { slug: "Already taken" } };

  // Launch promo: first 50 organizers get PREMIUM free for 90 days.
  const LAUNCH_PROMO_LIMIT = 50;
  const LAUNCH_PROMO_DAYS = 90;
  const totalOrganizers = await db.organizer.count();
  const eligibleForLaunchPromo = totalOrganizers < LAUNCH_PROMO_LIMIT;
  const subscriptionTier = eligibleForLaunchPromo ? "PREMIUM" : data.tier;
  const subscriptionEndsAt = eligibleForLaunchPromo
    ? new Date(Date.now() + LAUNCH_PROMO_DAYS * 24 * 60 * 60 * 1000)
    : null;

  const translations: { locale: "en" | "ru" | "de" | "es"; tagline: string; about: string }[] = [
    { locale: "en", tagline: data.taglineEn, about: data.aboutEn },
  ];
  if (data.secondLocale && data.taglineSecond && data.aboutSecond && data.aboutSecond.length >= 20) {
    translations.push({ locale: data.secondLocale, tagline: data.taglineSecond, about: data.aboutSecond });
  }

  await db.$transaction(async (tx) => {
    await tx.organizer.create({
      data: {
        userId: session.user.id,
        slug: data.slug,
        name: data.name,
        email: session.user.email!,
        countryCode: data.countryCode,
        city: data.city,
        logoUrl: data.logoUrl || null,
        coverUrl: data.coverUrl || null,
        website: data.website || null,
        phone: data.phone || null,
        subscriptionTier,
        subscriptionEndsAt,
        activityTypes: data.activityTypes,
        translations: { create: translations },
      },
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZER" },
    });
  });

  revalidatePath("/", "layout");
  redirect("/organizer/dashboard");
}
