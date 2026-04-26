"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newMessageNotification } from "@/lib/email";

export type SendMessageState = { ok?: boolean; error?: string } | null;

const sendSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(10000),
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";
const NOTIFICATION_DEBOUNCE_MS = 60 * 60 * 1000;

export async function sendMessageAction(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = sendSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { threadId, body } = parsed.data;

  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      participants: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      event: { select: { slug: true, translations: { where: { locale: "en" }, select: { title: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, senderId: true },
      },
    },
  });
  if (!thread) return { error: "Thread not found" };

  const isParticipant = thread.participants.some((p) => p.userId === session.user!.id);
  if (!isParticipant) return { error: "Not authorized" };

  const senderId = session.user.id!;
  const now = new Date();

  await db.$transaction([
    db.message.create({
      data: { threadId, senderId, body },
    }),
    db.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: now },
    }),
    db.threadParticipant.update({
      where: { threadId_userId: { threadId, userId: senderId } },
      data: { lastReadAt: now },
    }),
  ]);

  revalidatePath(`/me/messages/${threadId}`);
  revalidatePath(`/organizer/messages/${threadId}`);
  revalidatePath(`/me/messages`);
  revalidatePath(`/organizer/messages`);

  // Fire-and-forget notification with debounce.
  const lastMsg = thread.messages[0];
  const sinceLast = lastMsg ? now.getTime() - lastMsg.createdAt.getTime() : Number.POSITIVE_INFINITY;
  const shouldNotify = sinceLast >= NOTIFICATION_DEBOUNCE_MS;

  if (shouldNotify) {
    const sender = thread.participants.find((p) => p.userId === senderId);
    const recipient = thread.participants.find((p) => p.userId !== senderId);
    if (recipient?.user.email) {
      const senderName = sender?.user.name?.trim() || sender?.user.email?.split("@")[0] || "Someone";
      const recipientName = recipient.user.name?.trim() || recipient.user.email.split("@")[0];
      const eventTitle = thread.event.translations[0]?.title ?? thread.event.slug;
      // Recipient role guess: link both inbox endpoints — we don't know which they use, so pick /me as the safe default.
      const threadUrl = `${SITE}/en/me/messages/${threadId}`;
      void newMessageNotification({
        recipientEmail: recipient.user.email,
        recipientName,
        senderName,
        eventTitle,
        threadUrl,
        bodyPreview: body.slice(0, 200),
      });
    }
  }

  return { ok: true };
}

export async function markThreadReadAction(threadId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.threadParticipant.updateMany({
    where: { threadId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });
  revalidatePath(`/me/messages`);
  revalidatePath(`/organizer/messages`);
}
