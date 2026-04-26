"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const onboardSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  countryCode: z.string().length(2),
  city: z.string().trim().optional(),
  tagline: z.string().trim().min(1, "Tagline is required"),
  about: z.string().trim().min(20, "Tell us a bit more (20+ characters)"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  tier: z.enum(["FREE", "PRO", "PREMIUM"]).default("FREE"),
});

export type OrganizerFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

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
    tagline: formData.get("tagline"),
    about: formData.get("about"),
    logoUrl: formData.get("logoUrl") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    tier: (formData.get("tier") as string) || "FREE",
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
        translations: {
          create: { locale: "en", tagline: data.tagline, about: data.about },
        },
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
