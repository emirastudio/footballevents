"use server";

import { db } from "@/lib/db";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email(),
  role: z.enum(["PARENT", "COACH", "CLUB_MANAGER", "PLAYER", "OTHER"]),
  countryCode: z.string().optional(),
  cityId: z.string().optional(),
});

export async function joinWaitlist(data: z.infer<typeof waitlistSchema>) {
  const parsed = waitlistSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  try {
    await db.waitlist.create({
      data: parsed.data,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to join waitlist:", error);
    return { error: "Failed to join waitlist" };
  }
}
