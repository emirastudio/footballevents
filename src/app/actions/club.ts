"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Reused URL coercion — same shape as organizer.ts; lower-cases scheme,
// adds https:// if missing, and validates the final form.
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
  foundedYear: z.coerce.number().int().min(1800).max(new Date(2999, 0).getFullYear()).optional().or(z.literal("").transform(() => undefined)),
  taglineEn: z.string().trim().min(1, "English tagline is required"),
  aboutEn: z.string().trim().min(20, "English about must be at least 20 characters"),
  secondLocale: z.enum(["ru", "de", "es"]).optional().nullable(),
  taglineSecond: z.string().trim().optional(),
  aboutSecond: z.string().trim().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  website: websiteField,
  phone: z.string().optional(),
});

export type ClubFormState = { error?: string; fieldErrors?: Record<string, string> } | null;
export type ClubSettingsState = { ok?: true; error?: string; fieldErrors?: Record<string, string> } | null;

const socialUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || "")
  .refine((v) => !v || /^https?:\/\/.+/.test(v), { message: "Must be a full URL starting with https://" });

const settingsSchema = z.object({
  name:        z.string().trim().min(2, "Name must be at least 2 characters"),
  legalName:   z.string().trim().optional(),
  email:       z.string().email("Invalid email").optional().or(z.literal("")),
  phone:       z.string().trim().optional(),
  website:     websiteField,
  countryCode: z.string().length(2).optional().or(z.literal("")),
  city:        z.string().trim().optional(),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional().or(z.literal("").transform(() => undefined)),
  logoUrl:     z.string().url().optional().or(z.literal("")),
  coverUrl:    z.string().url().optional().or(z.literal("")),
  taglineEn:   z.string().trim().min(1, "English tagline is required"),
  aboutEn:     z.string().trim().min(20, "English about must be at least 20 characters"),
  secondLocale: z.enum(["ru", "de", "es"]).optional().nullable(),
  taglineSecond: z.string().trim().optional(),
  aboutSecond:   z.string().trim().optional(),
  instagramUrl: socialUrl,
  facebookUrl:  socialUrl,
  xUrl:         socialUrl,
  tiktokUrl:    socialUrl,
  youtubeUrl:   socialUrl,
  whatsappUrl:  socialUrl,
});

export async function updateClubSettingsAction(_prev: ClubSettingsState, formData: FormData): Promise<ClubSettingsState> {
  try {
    return await _updateClubSettingsActionInner(_prev, formData);
  } catch (err: unknown) {
    const digest = (err as { digest?: string })?.digest ?? "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[updateClubSettingsAction] unhandled error:", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function _updateClubSettingsActionInner(_prev: ClubSettingsState, formData: FormData): Promise<ClubSettingsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({ where: { userId: session.user.id }, select: { id: true, slug: true } });
  if (!club) redirect("/onboarding/club");

  const parsed = settingsSchema.safeParse({
    name:        formData.get("name"),
    legalName:   formData.get("legalName") || undefined,
    email:       formData.get("email") || undefined,
    phone:       formData.get("phone") || undefined,
    website:     formData.get("website") || undefined,
    countryCode: formData.get("countryCode") || undefined,
    city:        formData.get("city") || undefined,
    foundedYear: formData.get("foundedYear") || undefined,
    logoUrl:     formData.get("logoUrl") || undefined,
    coverUrl:    formData.get("coverUrl") || undefined,
    taglineEn:   formData.get("taglineEn"),
    aboutEn:     formData.get("aboutEn"),
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

  // Resolve cityId from name + countryCode if a country is set. Same lookup as
  // onboarding — if the city isn't in our City table, we silently leave it null
  // rather than block the save.
  let cityId: string | null | undefined = undefined;
  if (d.countryCode && d.city) {
    const row = await db.city.findFirst({
      where: { nameEn: d.city, countryCode: d.countryCode },
      select: { id: true },
    });
    cityId = row?.id ?? null;
  } else if (d.city === "" || d.countryCode === "") {
    cityId = null;
  }

  await db.$transaction(async (tx) => {
    await tx.club.update({
      where: { id: club.id },
      data: {
        name: d.name,
        legalName: d.legalName || null,
        email: d.email || null,
        phone: d.phone || null,
        website: d.website || null,
        countryCode: d.countryCode || undefined, // required column; preserve existing if blank
        ...(cityId !== undefined ? { cityId } : {}),
        foundedYear: d.foundedYear ?? null,
        logoUrl: d.logoUrl || null,
        coverUrl: d.coverUrl || null,
        instagramUrl: d.instagramUrl || null,
        facebookUrl:  d.facebookUrl || null,
        xUrl:         d.xUrl || null,
        tiktokUrl:    d.tiktokUrl || null,
        youtubeUrl:   d.youtubeUrl || null,
        whatsappUrl:  d.whatsappUrl || null,
      },
    });
    await tx.clubTranslation.upsert({
      where: { clubId_locale: { clubId: club.id, locale: "en" } },
      create: { clubId: club.id, locale: "en", tagline: d.taglineEn, about: d.aboutEn },
      update: { tagline: d.taglineEn, about: d.aboutEn },
    });
    if (d.secondLocale && d.taglineSecond && d.aboutSecond && d.aboutSecond.length >= 20) {
      await tx.clubTranslation.upsert({
        where: { clubId_locale: { clubId: club.id, locale: d.secondLocale } },
        create: { clubId: club.id, locale: d.secondLocale, tagline: d.taglineSecond, about: d.aboutSecond },
        update: { tagline: d.taglineSecond, about: d.aboutSecond },
      });
    }
  });

  revalidatePath("/club/settings");
  revalidatePath(`/club/${club.slug}`);
  revalidatePath("/club", "layout");
  return { ok: true };
}

export async function createClubAction(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Idempotent: if a club already exists for this user, bounce to dashboard.
  // Note: ORGANIZER + CLUB dual-hat is allowed; we DO NOT modify User.role.
  const existing = await db.club.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/club/dashboard");

  const parsed = onboardSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    countryCode: formData.get("countryCode"),
    city: formData.get("city") || undefined,
    foundedYear: formData.get("foundedYear") || undefined,
    taglineEn: formData.get("taglineEn"),
    aboutEn: formData.get("aboutEn"),
    secondLocale: (formData.get("secondLocale") as string) || undefined,
    taglineSecond: (formData.get("taglineSecond") as string) || undefined,
    aboutSecond: (formData.get("aboutSecond") as string) || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const data = parsed.data;

  // Slug uniqueness (organizer and club slugs share no namespace — distinct tables).
  const slugTaken = await db.club.findUnique({ where: { slug: data.slug } });
  if (slugTaken) {
    return { error: "This URL slug is already taken — try another.", fieldErrors: { slug: "Already taken" } };
  }

  // CityCombobox sends the city NAME. Resolve to a City row if we can; otherwise
  // store nothing and let the user pick later in settings (form has a free-text
  // fallback so onboarding never blocks on missing-city).
  let cityId: string | null = null;
  if (data.city) {
    const cityRow = await db.city.findFirst({
      where: { nameEn: data.city, countryCode: data.countryCode },
      select: { id: true },
    });
    cityId = cityRow?.id ?? null;
  }

  const translations: { locale: "en" | "ru" | "de" | "es"; tagline: string; about: string }[] = [
    { locale: "en", tagline: data.taglineEn, about: data.aboutEn },
  ];
  if (data.secondLocale && data.taglineSecond && data.aboutSecond && data.aboutSecond.length >= 20) {
    translations.push({ locale: data.secondLocale, tagline: data.taglineSecond, about: data.aboutSecond });
  }

  try {
    await db.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          userId: session.user.id,
          slug: data.slug,
          name: data.name,
          email: session.user.email ?? null,
          countryCode: data.countryCode,
          cityId,
          foundedYear: data.foundedYear ?? null,
          logoUrl: data.logoUrl || null,
          coverUrl: data.coverUrl || null,
          website: data.website || null,
          phone: data.phone || null,
          translations: { create: translations },
        },
        select: { id: true },
      });
      // Pre-create the usage row so quota checks never race on first application.
      await tx.clubUsage.create({ data: { clubId: club.id } });
      // Intentionally NOT touching User.role — clubs and organizers can coexist
      // on the same User. Capability checks read presence of Club/Organizer
      // relations, not role. See docs/architecture/0001-clubs.md §D1.
    });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Race between two simultaneous submits.
      return { error: "This URL slug is already taken — try another.", fieldErrors: { slug: "Already taken" } };
    }
    console.error("[createClubAction] unhandled error:", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }

  revalidatePath("/", "layout");
  redirect("/club/dashboard");
}
