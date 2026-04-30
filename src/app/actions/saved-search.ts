"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseSearchFilters, isEmptyFilters, type SearchFilters } from "@/lib/saved-search";

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const MAX_PER_USER = 20;
const NAME_MAX = 80;

export async function createSavedSearchAction(formData: FormData): Promise<Result<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "signin_required" };

  const name = String(formData.get("name") ?? "").trim().slice(0, NAME_MAX) || null;

  // Filters can come either as individual fields or as a `filters` JSON string.
  let filters: SearchFilters;
  const filtersJson = formData.get("filters");
  if (typeof filtersJson === "string" && filtersJson) {
    try {
      filters = parseSearchFilters(JSON.parse(filtersJson));
    } catch {
      return { ok: false, error: "Invalid filters" };
    }
  } else {
    filters = parseSearchFilters({
      q: formData.get("q"),
      country: formData.get("country"),
      category: formData.get("category"),
      age: formData.get("age"),
      format: formData.get("format"),
      gender: formData.get("gender"),
      free: formData.get("free") === "1",
      priceMax: formData.get("priceMax"),
    });
  }

  if (isEmptyFilters(filters)) {
    return { ok: false, error: "Add at least one filter to save a search." };
  }

  const count = await db.savedSearch.count({ where: { userId: session.user.id } });
  if (count >= MAX_PER_USER) {
    return { ok: false, error: `You can save up to ${MAX_PER_USER} searches.` };
  }

  // Light dedup: if a search with the exact same filters already exists, return it.
  const all = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    select: { id: true, filters: true },
  });
  const same = all.find((s) => JSON.stringify(s.filters) === JSON.stringify(filters));
  if (same) return { ok: true, data: { id: same.id } };

  const created = await db.savedSearch.create({
    data: {
      userId: session.user.id,
      name,
      filters: filters as never,
      isActive: true,
      lastRun: new Date(), // first email goes out for events created AFTER save
    },
  });

  revalidatePath("/me/alerts");
  return { ok: true, data: { id: created.id } };
}

export async function deleteSavedSearchAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "signin_required" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing id" };

  const search = await db.savedSearch.findUnique({ where: { id }, select: { userId: true } });
  if (!search || search.userId !== session.user.id) {
    return { ok: false, error: "Not found" };
  }

  await db.savedSearch.delete({ where: { id } });
  revalidatePath("/me/alerts");
  return { ok: true };
}

export async function toggleSavedSearchAction(formData: FormData): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "signin_required" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing id" };

  const search = await db.savedSearch.findUnique({
    where: { id },
    select: { userId: true, isActive: true },
  });
  if (!search || search.userId !== session.user.id) {
    return { ok: false, error: "Not found" };
  }

  await db.savedSearch.update({
    where: { id },
    data: { isActive: !search.isActive },
  });
  revalidatePath("/me/alerts");
  return { ok: true };
}
