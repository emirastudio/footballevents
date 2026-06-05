"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EventType } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rfqNewToOrganizerEmail } from "@/lib/email";

const EVENT_TYPES = [
  "TOURNAMENT", "CAMP", "FESTIVAL", "MASTERCLASS", "MATCH_TOUR",
  "CLINIC", "SHOWCASE", "TRAINING_CAMP", "TRYOUT",
] as const;

// ISO 3166-1 alpha-2 — 2 letters, uppercased before save. Accepts multiple
// via repeated form fields (`targetCountries` checkbox group on the form).
const countryCodeArray = z.array(z.string().length(2).toUpperCase()).default([]);

const rfqSchema = z.object({
  eventType:       z.enum(EVENT_TYPES),
  teamId:          z.string().min(1).optional().or(z.literal("").transform(() => undefined)),
  ageGroup:        z.string().trim().max(20).optional().or(z.literal("")),
  format:          z.string().trim().max(20).optional().or(z.literal("")),
  skillLevel:      z.enum(["AMATEUR", "SEMI_PRO", "PROFESSIONAL", "ALL_LEVELS"]).optional().nullable(),
  gender:          z.enum(["MALE", "FEMALE", "MIXED"]).optional().nullable(),
  targetCountries: countryCodeArray,
  targetRegion:    z.string().trim().max(80).optional().or(z.literal("")),
  dateFrom:        z.string().trim().optional().or(z.literal("")),
  dateTo:          z.string().trim().optional().or(z.literal("")),
  durationDays:    z.coerce.number().int().min(1).max(60).optional().or(z.literal("").transform(() => undefined)),
  budgetPerTeamCents: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  currency:        z.enum(["EUR", "USD", "GBP", "RUB"]).optional().nullable(),
  comment:         z.string().trim().max(500).optional().or(z.literal("")),
});

export type RfqFormState = { error?: string; fieldErrors?: Record<string, string> } | null;

// Default expiry: 60 days. Past that, the dashboard moves it to EXPIRED.
// Plenty of lead time for cross-Europe planning; tweak per data later.
const DEFAULT_EXPIRY_DAYS = 60;

async function getCallerClubId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, slug: true, email: true, userId: true },
  });
  if (!club) redirect("/onboarding/club");
  return { club, session };
}

export async function createRfqAction(_prev: RfqFormState, formData: FormData): Promise<RfqFormState> {
  const { club } = await getCallerClubId();

  const parsed = rfqSchema.safeParse({
    eventType:       formData.get("eventType"),
    teamId:          formData.get("teamId") || undefined,
    ageGroup:        formData.get("ageGroup") || undefined,
    format:          formData.get("format") || undefined,
    skillLevel:      (formData.get("skillLevel") as string) || undefined,
    gender:          (formData.get("gender") as string) || undefined,
    targetCountries: formData.getAll("targetCountries").map(String),
    targetRegion:    formData.get("targetRegion") || undefined,
    dateFrom:        formData.get("dateFrom") || undefined,
    dateTo:          formData.get("dateTo") || undefined,
    durationDays:    formData.get("durationDays") || undefined,
    budgetPerTeamCents: formData.get("budgetPerTeamCents") || undefined,
    currency:        (formData.get("currency") as string) || undefined,
    comment:         formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] = i.message;
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", fieldErrors };
  }
  const d = parsed.data;

  // Validate team ownership if a team was picked.
  if (d.teamId) {
    const owned = await db.clubTeam.findFirst({
      where: { id: d.teamId, clubId: club.id, isActive: true },
      select: { id: true },
    });
    if (!owned) return { error: "Team not found", fieldErrors: { teamId: "Invalid team" } };
  }

  // Quota check + atomic increment. ClubQuotaError surfaces as a user error.
  const { ensureCanRfqAndCount, ClubQuotaError } = await import("@/lib/permissions/club");
  try {
    await ensureCanRfqAndCount(club.id);
  } catch (err) {
    if (err instanceof ClubQuotaError) {
      return { error: "Monthly RFQ quota exceeded. Upgrade or wait for next month." };
    }
    throw err;
  }

  const parseDate = (s: string | null | undefined): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const rfq = await db.rfq.create({
    data: {
      clubId: club.id,
      teamId: d.teamId ?? null,
      eventType: d.eventType,
      ageGroup: d.ageGroup || null,
      format: d.format || null,
      skillLevel: d.skillLevel ?? null,
      gender: d.gender ?? null,
      targetCountries: d.targetCountries,
      targetRegion: d.targetRegion || null,
      dateFrom: parseDate(d.dateFrom),
      dateTo: parseDate(d.dateTo),
      durationDays: d.durationDays ?? null,
      budgetPerTeamCents: d.budgetPerTeamCents ?? null,
      currency: d.currency ?? null,
      comment: d.comment || null,
      expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
    select: { id: true, eventType: true, targetCountries: true, ageGroup: true, format: true, durationDays: true, targetRegion: true, dateFrom: true, dateTo: true },
  });

  // Dispatch emails to matching organizers in parallel, best-effort.
  // Match = (activityTypes ∋ eventType) AND (org country in targetCountries OR targetCountries empty).
  // Skip the requesting user's own Organizer hat to avoid emailing yourself.
  void dispatchRfqToOrganizers(rfq.id, {
    requestingUserId: club.userId,
    clubName: club.name,
    eventType: rfq.eventType as EventType,
    ageGroup: rfq.ageGroup,
    format: rfq.format,
    targetCountries: rfq.targetCountries,
    targetRegion: rfq.targetRegion,
    durationDays: rfq.durationDays,
    dateFrom: rfq.dateFrom,
    dateTo: rfq.dateTo,
  });

  revalidatePath("/club/rfqs");
  revalidatePath("/club/dashboard");
  revalidatePath("/rfqs");
  redirect("/club/rfqs");
}

async function dispatchRfqToOrganizers(
  rfqId: string,
  ctx: {
    requestingUserId: string;
    clubName: string;
    eventType: EventType;
    ageGroup: string | null;
    format: string | null;
    targetCountries: string[];
    targetRegion: string | null;
    durationDays: number | null;
    dateFrom: Date | null;
    dateTo: Date | null;
  },
) {
  try {
    const recipients = await db.organizer.findMany({
      where: {
        activityTypes: { has: ctx.eventType },
        userId: { not: ctx.requestingUserId },
        ...(ctx.targetCountries.length > 0 ? { countryCode: { in: ctx.targetCountries } } : {}),
      },
      select: {
        email: true,
        name: true,
        user: { select: { preferredLocale: true } },
      },
      take: 200, // safety cap; real volume tracked in telemetry later
    });

    // Localized one-liner for the email subject/body. We can't import the
    // i18n catalog server-side cheaply for arbitrary recipients, so build a
    // simple human string from the structured fields.
    const TYPE_L: Record<string, Record<EventType, string>> = {
      en: { TOURNAMENT: "tournament", CAMP: "camp", FESTIVAL: "festival", MASTERCLASS: "masterclass", MATCH_TOUR: "match tour", CLINIC: "clinic", SHOWCASE: "showcase", TRAINING_CAMP: "training camp", TRYOUT: "tryout" },
      ru: { TOURNAMENT: "турнир", CAMP: "сборы", FESTIVAL: "фестиваль", MASTERCLASS: "мастер-класс", MATCH_TOUR: "матч-тур", CLINIC: "клиника", SHOWCASE: "шоукейс", TRAINING_CAMP: "тренировочный лагерь", TRYOUT: "просмотр" },
      de: { TOURNAMENT: "Turnier", CAMP: "Camp", FESTIVAL: "Festival", MASTERCLASS: "Masterclass", MATCH_TOUR: "Match-Tour", CLINIC: "Clinic", SHOWCASE: "Showcase", TRAINING_CAMP: "Trainingscamp", TRYOUT: "Sichtung" },
      es: { TOURNAMENT: "torneo", CAMP: "campamento", FESTIVAL: "festival", MASTERCLASS: "masterclass", MATCH_TOUR: "gira de partidos", CLINIC: "clinic", SHOWCASE: "showcase", TRAINING_CAMP: "campus de entrenamiento", TRYOUT: "prueba" },
    };
    const whatBits = (locale: string) => {
      const L = (["en", "ru", "de", "es"] as const).includes(locale as never) ? (locale as "en" | "ru" | "de" | "es") : "en";
      const parts = [
        ctx.ageGroup,
        TYPE_L[L][ctx.eventType],
        ctx.format,
        ctx.durationDays ? (L === "ru" ? `${ctx.durationDays} дн.` : L === "de" ? `${ctx.durationDays} Tg.` : L === "es" ? `${ctx.durationDays} días` : `${ctx.durationDays} days`) : null,
      ];
      return parts.filter(Boolean).join(", ");
    };
    const dateRange = ctx.dateFrom && ctx.dateTo
      ? `${ctx.dateFrom.toISOString().slice(0, 10)} – ${ctx.dateTo.toISOString().slice(0, 10)}`
      : ctx.dateFrom
      ? ctx.dateFrom.toISOString().slice(0, 10)
      : undefined;
    const region = ctx.targetRegion || (ctx.targetCountries.length > 0 ? ctx.targetCountries.join(", ") : undefined);

    await Promise.allSettled(
      recipients.map((r) =>
        rfqNewToOrganizerEmail({
          organizerEmail: r.email,
          organizerName: r.name,
          clubName: ctx.clubName,
          rfqId,
          what: whatBits(r.user?.preferredLocale ?? "en"),
          region,
          dateRange,
          locale: r.user?.preferredLocale ?? "en",
        }),
      ),
    );
  } catch (e) {
    console.error("[rfq] dispatch failed", e);
  }
}

export async function closeRfqAction(rfqId: string): Promise<void> {
  const { club } = await getCallerClubId();
  const owned = await db.rfq.findFirst({ where: { id: rfqId, clubId: club.id }, select: { id: true } });
  if (!owned) return;
  await db.rfq.update({ where: { id: rfqId }, data: { status: "CLOSED" } });
  revalidatePath("/club/rfqs");
  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${rfqId}`);
  revalidatePath("/club/dashboard");
}

export async function reopenRfqAction(rfqId: string): Promise<void> {
  const { club } = await getCallerClubId();
  const owned = await db.rfq.findFirst({ where: { id: rfqId, clubId: club.id }, select: { id: true, expiresAt: true } });
  if (!owned) return;
  // If the previous expiry already passed, give the RFQ a fresh window;
  // otherwise keep its original deadline so reopen doesn't extend it by accident.
  const stillFutureExpiry = owned.expiresAt && owned.expiresAt.getTime() > Date.now();
  await db.rfq.update({
    where: { id: rfqId },
    data: {
      status: "OPEN",
      expiresAt: stillFutureExpiry ? undefined : new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath("/club/rfqs");
  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${rfqId}`);
}
