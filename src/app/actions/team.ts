"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOrgForAction } from "@/lib/organizer-access";
import { teamInviteEmail } from "@/lib/email";

export type TeamState = { error?: string; ok?: boolean } | null;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MANAGER", "STAFF"]),
});

/** OWNER invites a teammate by email. Creates a pending invite + emails a link. */
export async function inviteTeamMemberAction(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };
  const access = await getOrgForAction(session.user.id, "team");
  if (!access) return { error: "forbidden" };

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Enter a valid email and role" };
  const { email, role } = parsed.data;

  // Already the owner?
  const ownerUser = await db.user.findUnique({ where: { id: access.organizer.userId }, select: { email: true } });
  if (ownerUser?.email?.toLowerCase() === email) return { error: "This is the owner's email" };

  // Already a member?
  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const member = await db.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId: access.organizer.id, userId: existingUser.id } },
    });
    if (member) return { error: "This person is already on the team" };
  }

  // Reuse a pending invite for the same email, else create one.
  const token = nanoid(32);
  const existingInvite = await db.organizerInvite.findFirst({
    where: { organizerId: access.organizer.id, email, acceptedAt: null },
  });
  const invite = existingInvite
    ? await db.organizerInvite.update({ where: { id: existingInvite.id }, data: { role, token } })
    : await db.organizerInvite.create({
        data: { organizerId: access.organizer.id, email, role, token, invitedById: session.user.id },
      });

  void teamInviteEmail({
    to: email,
    organizerName: access.organizer.name,
    inviterName: session.user.name ?? access.organizer.name,
    role,
    url: `${SITE}/en/join/${invite.token}`,
  });

  revalidatePath("/organizer/settings");
  return { ok: true };
}

const idSchema = z.object({ id: z.string().min(1) });

export async function removeTeamMemberAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await getOrgForAction(session.user.id, "team");
  if (!access) redirect("/organizer/dashboard");
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  await db.organizerMember.deleteMany({ where: { id: parsed.data.id, organizerId: access.organizer.id } });
  revalidatePath("/organizer/settings");
}

export async function cancelInviteAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await getOrgForAction(session.user.id, "team");
  if (!access) redirect("/organizer/dashboard");
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  await db.organizerInvite.deleteMany({ where: { id: parsed.data.id, organizerId: access.organizer.id } });
  revalidatePath("/organizer/settings");
}

const roleSchema = z.object({ id: z.string().min(1), role: z.enum(["MANAGER", "STAFF"]) });

export async function changeMemberRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const access = await getOrgForAction(session.user.id, "team");
  if (!access) redirect("/organizer/dashboard");
  const parsed = roleSchema.safeParse({ id: formData.get("id"), role: formData.get("role") });
  if (!parsed.success) return;
  await db.organizerMember.updateMany({
    where: { id: parsed.data.id, organizerId: access.organizer.id },
    data: { role: parsed.data.role },
  });
  revalidatePath("/organizer/settings");
}

/** The invited person clicks the link and joins. Requires being signed in. */
export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/");
  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?next=/join/${token}`);

  const invite = await db.organizerInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) redirect("/organizer/bookings");

  // The owner joining their own org is a no-op.
  const org = await db.organizer.findUnique({ where: { id: invite.organizerId }, select: { userId: true } });
  if (org && org.userId !== session.user.id) {
    await db.organizerMember.upsert({
      where: { organizerId_userId: { organizerId: invite.organizerId, userId: session.user.id } },
      create: { organizerId: invite.organizerId, userId: session.user.id, role: invite.role },
      update: { role: invite.role },
    });
  }
  await db.organizerInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  redirect("/organizer/bookings");
}
