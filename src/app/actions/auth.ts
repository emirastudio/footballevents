"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { welcomeEmail } from "@/lib/email";
import { getClientIp, getUserAgent, getCountryFromIp } from "@/lib/signup-meta";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Honeypot — real users never see/fill this field. Bots auto-fill all inputs.
  website: z.string().max(0, "Bot detected").optional().default(""),
  // Form open timestamp — if submitted < 2s after page render, it's a bot.
  startedAt: z.coerce.number().optional(),
});

export type AuthFormState = { error?: string } | null;

const SIGNUP_RATE_LIMIT_PER_IP = 5; // max accounts from same IP per hour

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    website: formData.get("website") ?? "",
    startedAt: formData.get("startedAt") ?? undefined,
  });
  if (!parsed.success) {
    // Honeypot trip — return generic message so bots don't learn.
    if (parsed.error.issues.some((i) => i.path.join(".") === "website")) {
      return { error: "Could not create account. Try again." };
    }
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, startedAt } = parsed.data;

  // Timing check — humans take >= 2s to fill the form.
  if (startedAt && Date.now() - startedAt < 2_000) {
    return { error: "Could not create account. Try again." };
  }

  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  // Rate limit: cap the number of credential signups from the same IP per hour.
  if (ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await db.user.count({
      where: { signupIp: ip, createdAt: { gte: oneHourAgo } },
    });
    if (recent >= SIGNUP_RATE_LIMIT_PER_IP) {
      return { error: "Too many signups from this network. Try again later." };
    }
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already in use" };

  const country = await getCountryFromIp(ip);
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      signupIp: ip || null,
      signupCountry: country,
      signupUserAgent: userAgent || null,
      signupMethod: "credentials",
    },
  });

  void welcomeEmail({ to: email, name });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Could not sign in after registration" };
    throw e;
  }
  redirect("/");
}

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password" };
    throw e;
  }
  redirect("/");
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/");
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/" });
}

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email"),
  website: z.string().max(0, "Bot detected").optional().default(""),
  startedAt: z.coerce.number().optional(),
});

export type MagicLinkState = { error?: string; sent?: boolean } | null;

const MAGIC_LINK_PER_EMAIL_PER_15MIN = 3;
const MAGIC_LINK_PER_IP_PER_HOUR = 10;

export async function magicLinkAction(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") ?? "",
    startedAt: formData.get("startedAt") ?? undefined,
  });
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path.join(".") === "website")) {
      return { error: "Could not send link. Try again." };
    }
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const { email, startedAt } = parsed.data;

  if (startedAt && Date.now() - startedAt < 1_500) {
    return { error: "Could not send link. Try again." };
  }

  const ip = await getClientIp();
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentForEmail = await db.verificationToken.count({
    where: { identifier: email, expires: { gte: fifteenMinAgo } },
  });
  if (recentForEmail >= MAGIC_LINK_PER_EMAIL_PER_15MIN) {
    return { error: "Too many sign-in links requested. Check your inbox or try again later." };
  }

  if (ip) {
    const recentByIp = await db.user.count({
      where: { lastLoginIp: ip, lastLoginAt: { gte: hourAgo } },
    });
    if (recentByIp >= MAGIC_LINK_PER_IP_PER_HOUR) {
      return { error: "Too many requests from this network. Try again later." };
    }
  }

  try {
    // redirect: false — we render our own "check your inbox" UI via the form state.
    await signIn("email", { email, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Could not send sign-in link. Try again." };
    throw e;
  }
  return { sent: true };
}
