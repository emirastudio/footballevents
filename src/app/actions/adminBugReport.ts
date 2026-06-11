"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "WONT_FIX"]),
  adminNote: z.string().max(4000).optional(),
});

/** Admin-only: update a bug report's triage status and optional note. */
export async function updateBugReportAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/");

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") ?? undefined,
  });
  if (!parsed.success) return;

  const { id, status, adminNote } = parsed.data;
  const resolved = status === "RESOLVED" || status === "WONT_FIX";

  await db.bugReport.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote || null,
      resolvedAt: resolved ? new Date() : null,
      resolvedBy: resolved ? session.user.id : null,
    },
  });
  revalidatePath("/admin/bug-reports");
  revalidatePath(`/admin/bug-reports/${id}`);
}
