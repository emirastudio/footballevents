"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { welcomeEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AuthFormState = { error?: string } | null;

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already in use" };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: { name, email, passwordHash, role: "USER" },
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
