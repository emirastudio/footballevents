"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export type VenueFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

const schema = z.object({
  id:           z.string().optional(),
  name:         z.string().trim().min(2, "nameRequired"),
  countryCode:  z.string().length(2, "countryRequired"),
  city:         z.string().trim().optional(),
  address:      z.string().trim().optional(),
  capacity:     z.coerce.number().int().positive().optional(),
  surfaceType:  z.string().optional(),
  website:      z.string().url().optional().or(z.literal("")),
  isStadium:    z.coerce.boolean().default(false),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

export async function saveVenueAction(_prev: VenueFormState, formData: FormData): Promise<VenueFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const parsed = schema.safeParse({
    id:          formData.get("id") || undefined,
    name:        formData.get("name"),
    countryCode: formData.get("countryCode"),
    city:        formData.get("city") || undefined,
    address:     formData.get("address") || undefined,
    capacity:    formData.get("capacity") || undefined,
    surfaceType: formData.get("surfaceType") || undefined,
    website:     formData.get("website") || undefined,
    isStadium:   formData.get("isStadium") === "on" || formData.get("isStadium") === "true",
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[i.path.join(".")] = i.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors: fe };
  }
  const d = parsed.data;

  if (d.id) {
    // Update — any organizer that has events at this venue can edit it.
    const existing = await db.venue.findUnique({ where: { id: d.id }, include: { events: { where: { organizerId: organizer.id }, take: 1 } } });
    if (!existing) return { error: "notFound" };
    if (existing.events.length === 0) return { error: "notYourVenue" };
    await db.venue.update({
      where: { id: d.id },
      data: {
        name: d.name,
        countryCode: d.countryCode,
        address: d.address || null,
        capacity: d.capacity ?? null,
        surfaceType: d.surfaceType || null,
        website: d.website || null,
        isStadium: d.isStadium,
      },
    });
  } else {
    // Create — slug needs to be unique.
    let baseSlug = slugify(d.name) || "venue";
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const taken = await db.venue.findUnique({ where: { slug } });
      if (!taken) break;
      slug = `${baseSlug}-${nanoid(4).toLowerCase()}`;
    }
    await db.venue.create({
      data: {
        slug,
        name: d.name,
        countryCode: d.countryCode,
        address: d.address || null,
        capacity: d.capacity ?? null,
        surfaceType: d.surfaceType || null,
        website: d.website || null,
        isStadium: d.isStadium,
      },
    });
  }

  revalidatePath("/organizer/venues");
  revalidatePath("/stadiums");
  redirect("/organizer/venues");
}
