"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Match Event.ageGroups conventions — free-string with UI presets.
// Validated only as "non-empty short string" here; UI provides the picker.
const teamSchema = z.object({
  name:          z.string().trim().min(2, "Name is required"),
  ageGroup:      z.string().trim().min(1, "Age group is required").max(20),
  gender:        z.enum(["MALE", "FEMALE", "MIXED"]).default("MIXED"),
  format:        z.string().trim().max(20).optional().or(z.literal("")),
  skillLevel:    z.enum(["AMATEUR", "SEMI_PRO", "PROFESSIONAL", "ALL_LEVELS"]).default("ALL_LEVELS"),
  birthYearFrom: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("").transform(() => undefined)),
  birthYearTo:   z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("").transform(() => undefined)),
  notes:         z.string().trim().max(500).optional().or(z.literal("")),
});

export type ClubTeamFormState = { ok?: true; teamId?: string; error?: string; fieldErrors?: Record<string, string> } | null;

// Shared auth + ownership check — every action below redirects on missing
// session and returns null when the team doesn't belong to the caller's club.
async function getCallerClubId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!club) redirect("/onboarding/club");
  return club.id;
}

function parseTeamForm(formData: FormData) {
  return teamSchema.safeParse({
    name:          formData.get("name"),
    ageGroup:      formData.get("ageGroup"),
    gender:        (formData.get("gender") as string) || "MIXED",
    format:        formData.get("format") || undefined,
    skillLevel:    (formData.get("skillLevel") as string) || "ALL_LEVELS",
    birthYearFrom: formData.get("birthYearFrom") || undefined,
    birthYearTo:   formData.get("birthYearTo") || undefined,
    notes:         formData.get("notes") || undefined,
  });
}

function flattenFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fe: Record<string, string> = {};
  for (const i of issues) fe[i.path.join(".")] = i.message;
  return fe;
}

export async function createClubTeamAction(_prev: ClubTeamFormState, formData: FormData): Promise<ClubTeamFormState> {
  const clubId = await getCallerClubId();
  const parsed = parseTeamForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors: flattenFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;

  const team = await db.clubTeam.create({
    data: {
      clubId,
      name: d.name,
      ageGroup: d.ageGroup,
      gender: d.gender,
      format: d.format || null,
      skillLevel: d.skillLevel,
      birthYearFrom: d.birthYearFrom ?? null,
      birthYearTo: d.birthYearTo ?? null,
      notes: d.notes || null,
    },
    select: { id: true },
  });

  revalidatePath("/club/dashboard");
  revalidatePath("/club/teams");
  redirect("/club/teams");
}

export async function updateClubTeamAction(teamId: string, _prev: ClubTeamFormState, formData: FormData): Promise<ClubTeamFormState> {
  const clubId = await getCallerClubId();
  // Ownership check — never trust the URL param.
  const owned = await db.clubTeam.findFirst({ where: { id: teamId, clubId }, select: { id: true } });
  if (!owned) return { error: "Team not found" };

  const parsed = parseTeamForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors: flattenFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;

  await db.clubTeam.update({
    where: { id: teamId },
    data: {
      name: d.name,
      ageGroup: d.ageGroup,
      gender: d.gender,
      format: d.format || null,
      skillLevel: d.skillLevel,
      birthYearFrom: d.birthYearFrom ?? null,
      birthYearTo: d.birthYearTo ?? null,
      notes: d.notes || null,
    },
  });

  revalidatePath("/club/teams");
  revalidatePath(`/club/teams/${teamId}/edit`);
  return { ok: true, teamId };
}

// Soft-delete via isActive=false. Hard-delete would orphan Booking.clubTeamId
// (set-null cascade) and lose the team's tournament history.
export async function archiveClubTeamAction(teamId: string): Promise<void> {
  const clubId = await getCallerClubId();
  const owned = await db.clubTeam.findFirst({ where: { id: teamId, clubId }, select: { id: true } });
  if (!owned) return;
  await db.clubTeam.update({ where: { id: teamId }, data: { isActive: false } });
  revalidatePath("/club/teams");
  revalidatePath("/club/dashboard");
}

export async function restoreClubTeamAction(teamId: string): Promise<void> {
  const clubId = await getCallerClubId();
  const owned = await db.clubTeam.findFirst({ where: { id: teamId, clubId }, select: { id: true } });
  if (!owned) return;
  await db.clubTeam.update({ where: { id: teamId }, data: { isActive: true } });
  revalidatePath("/club/teams");
}
