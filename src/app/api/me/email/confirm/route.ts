import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/en/me/settings?email=${reason}`, req.url));

  if (!token) return fail("invalid");

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const request = await db.emailChangeRequest.findUnique({ where: { tokenHash } });

  if (!request) return fail("invalid");
  if (request.expires < new Date()) {
    await db.emailChangeRequest.delete({ where: { id: request.id } }).catch(() => {});
    return fail("expired");
  }

  // Race: another user could have claimed this email in the meantime.
  const taken = await db.user.findUnique({ where: { email: request.newEmail } });
  if (taken && taken.id !== request.userId) {
    await db.emailChangeRequest.delete({ where: { id: request.id } }).catch(() => {});
    return fail("taken");
  }

  await db.$transaction([
    db.user.update({
      where: { id: request.userId },
      data: { email: request.newEmail, emailVerified: new Date() },
    }),
    db.emailChangeRequest.delete({ where: { id: request.id } }),
  ]);

  return NextResponse.redirect(new URL(`/en/me/settings?email=changed`, req.url));
}
