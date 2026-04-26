import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const providers = [
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
      role: "USER" | "ORGANIZER" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    role?: "USER" | "ORGANIZER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ORGANIZER" | "ADMIN";
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
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
        // Read role from DB so role flips (e.g. USER → ORGANIZER after onboarding) take effect immediately.
        const fresh = await db.user.findUnique({ where: { id: token.id }, select: { role: true } });
        session.user.role = fresh?.role ?? token.role ?? "USER";
      }
      return session;
    },
  },
});
