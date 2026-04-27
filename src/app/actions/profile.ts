"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth, signOut } from "@/auth";
import { emailChangeVerifyEmail } from "@/lib/email";

export type ProfileState = { error?: string; ok?: boolean } | null;

// ─── Edit name / locale / image ─────────────────────────────
const profileSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80, "Name too long"),
  preferredLocale: z.enum(["en", "ru", "de", "es"]),
  image: z.string().url().max(500).optional().or(z.literal("")),
});

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    preferredLocale: formData.get("preferredLocale"),
    image: formData.get("image") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { name, preferredLocale, image } = parsed.data;
  await db.user.update({
    where: { id: session.user.id },
    data: { name, preferredLocale, image: image || null },
  });
  revalidatePath("/[locale]/me", "layout");
  return { ok: true };
}

// ─── Set / change password ──────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().optional().default(""),
  newPassword: z.string().min(8, "At least 8 characters"),
});

export async function updatePasswordAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  if (user.passwordHash) {
    if (!parsed.data.currentPassword) return { error: "Current password required" };
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect" };
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  return { ok: true };
}

// ─── Request email change ───────────────────────────────────
const emailChangeSchema = z.object({ newEmail: z.string().email("Invalid email") });

const EMAIL_CHANGE_TTL_MINUTES = 60;

export async function requestEmailChangeAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = emailChangeSchema.safeParse({ newEmail: formData.get("newEmail") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };

  const newEmail = parsed.data.newEmail.toLowerCase();
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (user.email.toLowerCase() === newEmail) return { error: "That's already your email" };

  const taken = await db.user.findUnique({ where: { email: newEmail } });
  if (taken) return { error: "Email already in use" };

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + EMAIL_CHANGE_TTL_MINUTES * 60 * 1000);

  await db.emailChangeRequest.upsert({
    where: { userId: user.id },
    create: { userId: user.id, newEmail, tokenHash, expires },
    update: { newEmail, tokenHash, expires },
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
  const url = `${site}/api/me/email/confirm?token=${rawToken}`;
  await emailChangeVerifyEmail({ to: newEmail, url, expiresMinutes: EMAIL_CHANGE_TTL_MINUTES });
  return { ok: true };
}

// ─── Delete (anonymize) account ─────────────────────────────
const deleteSchema = z.object({ confirm: z.string() });

export async function deleteAccountAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = deleteSchema.safeParse({ confirm: formData.get("confirm") });
  if (!parsed.success || parsed.data.confirm.trim().toUpperCase() !== "DELETE") {
    return { error: 'Type "DELETE" to confirm' };
  }

  const userId = session.user.id;

  // Anonymize: keep reviews/bookings/messages so organizers don't lose history,
  // but strip all PII and revoke every login method.
  await db.$transaction(async (tx) => {
    await tx.account.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.emailChangeRequest.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.local`,
        name: "Deleted user",
        image: null,
        passwordHash: null,
        bannedAt: new Date(),
        banReason: "user_self_delete",
        signupIp: null,
        signupCountry: null,
        signupUserAgent: null,
        lastLoginIp: null,
      },
    });
  });

  await signOut({ redirect: false });
  redirect("/");
}
