import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

type Role = "USER" | "ORGANIZER" | "ADMIN";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      if (user.bannedAt) {
        throw new Error("Account banned. Contact support.");
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        role: user.role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
  interface JWT {
    role?: Role;
    id?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as { id?: string }).id = user.id;
        (token as { role?: Role }).role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      const tokenId = (token as { id?: string }).id;
      const tokenRole = (token as { role?: Role }).role;
      if (tokenId) {
        session.user.id = tokenId;
        // Read role from DB so role flips (e.g. USER → ORGANIZER after onboarding) take effect immediately.
        const fresh = await db.user.findUnique({ where: { id: tokenId }, select: { role: true } });
        session.user.role = fresh?.role ?? tokenRole ?? "USER";
      }
      return session;
    },
  },
  events: {
    // Capture signup forensics for Google OAuth + refresh login metadata on every sign-in.
    async signIn({ user, account, isNewUser }) {
      if (!user?.id) return;
      try {
        const { headers } = await import("next/headers");
        const h = await headers();
        const ip =
          h.get("cf-connecting-ip") ??
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          "";
        const userAgent = h.get("user-agent") ?? "";

        const data: Record<string, unknown> = {
          lastLoginAt: new Date(),
          lastLoginIp: ip || null,
        };
        if (isNewUser) {
          const { getCountryFromIp } = await import("@/lib/signup-meta");
          const country = await getCountryFromIp(ip);
          data.signupIp = ip || null;
          data.signupCountry = country;
          data.signupUserAgent = userAgent || null;
          data.signupMethod = account?.provider === "google" ? "google" : (account?.provider ?? "credentials");
        }
        await db.user.update({ where: { id: user.id }, data: data as never });
      } catch {
        // never fail sign-in because forensics couldn't be saved
      }
    },
  },
});
