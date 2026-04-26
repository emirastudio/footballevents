import { db } from "@/lib/db";

export type InboxThread = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  subject: string | null;
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageSenderId: string | null;
  unreadCount: number;
  other: {
    userId: string;
    name: string;
    image: string | null;
  };
};

export type ThreadDetail = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  subject: string | null;
  bookingId: string | null;
  participants: Array<{
    userId: string;
    name: string;
    image: string | null;
    lastReadAt: Date | null;
  }>;
  other: {
    userId: string;
    name: string;
    image: string | null;
  };
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    createdAt: Date;
    editedAt: Date | null;
  }>;
};

function previewBody(body: string, max = 140): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
}

function pickName(u: { name: string | null; email: string | null }): string {
  return u.name?.trim() || u.email?.split("@")[0] || "User";
}

export async function getInboxThreads(userId: string): Promise<InboxThread[]> {
  const participations = await db.threadParticipant.findMany({
    where: { userId },
    select: {
      lastReadAt: true,
      thread: {
        select: {
          id: true,
          eventId: true,
          subject: true,
          lastMessageAt: true,
          event: { select: { slug: true, translations: { where: { locale: "en" }, select: { title: true } } } },
          participants: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, senderId: true, createdAt: true },
          },
        },
      },
    },
  });

  const threadIds = participations.map((p) => p.thread.id);
  if (threadIds.length === 0) return [];

  // Compute unread counts in a single grouped query.
  const unreadGroups = await Promise.all(
    participations.map(async (p) => {
      const cutoff = p.lastReadAt;
      const count = await db.message.count({
        where: {
          threadId: p.thread.id,
          senderId: { not: userId },
          ...(cutoff ? { createdAt: { gt: cutoff } } : {}),
        },
      });
      return [p.thread.id, count] as const;
    }),
  );
  const unreadByThread = new Map(unreadGroups);

  const result: InboxThread[] = participations.map((p) => {
    const t = p.thread;
    const otherParticipant = t.participants.find((pp) => pp.userId !== userId) ?? t.participants[0];
    const otherUser = otherParticipant.user;
    const last = t.messages[0];
    const enTitle = t.event.translations[0]?.title ?? t.event.slug;
    return {
      id: t.id,
      eventId: t.eventId,
      eventSlug: t.event.slug,
      eventTitle: enTitle,
      subject: t.subject,
      lastMessageAt: t.lastMessageAt,
      lastMessagePreview: last ? previewBody(last.body, 140) : "",
      lastMessageSenderId: last?.senderId ?? null,
      unreadCount: unreadByThread.get(t.id) ?? 0,
      other: {
        userId: otherUser.id,
        name: pickName(otherUser),
        image: otherUser.image,
      },
    };
  });

  result.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  return result;
}

export async function getThreadById(threadId: string, userId: string): Promise<ThreadDetail | null> {
  const thread = await db.thread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      eventId: true,
      bookingId: true,
      subject: true,
      event: { select: { slug: true, translations: { where: { locale: "en" }, select: { title: true } } } },
      participants: {
        select: {
          userId: true,
          lastReadAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, senderId: true, body: true, createdAt: true, editedAt: true },
      },
    },
  });
  if (!thread) return null;

  const me = thread.participants.find((p) => p.userId === userId);
  if (!me) return null;

  // Side-effect: mark thread read for this user.
  await db.threadParticipant.update({
    where: { threadId_userId: { threadId, userId } },
    data: { lastReadAt: new Date() },
  });

  const other = thread.participants.find((p) => p.userId !== userId) ?? thread.participants[0];
  const enTitle = thread.event.translations[0]?.title ?? thread.event.slug;

  return {
    id: thread.id,
    eventId: thread.eventId,
    eventSlug: thread.event.slug,
    eventTitle: enTitle,
    subject: thread.subject,
    bookingId: thread.bookingId,
    participants: thread.participants.map((p) => ({
      userId: p.userId,
      name: pickName(p.user),
      image: p.user.image,
      lastReadAt: p.lastReadAt,
    })),
    other: {
      userId: other.user.id,
      name: pickName(other.user),
      image: other.user.image,
    },
    messages: thread.messages,
  };
}

export async function countUnreadThreads(userId: string): Promise<number> {
  const participations = await db.threadParticipant.findMany({
    where: { userId },
    select: { threadId: true, lastReadAt: true },
  });
  if (participations.length === 0) return 0;

  let unread = 0;
  await Promise.all(
    participations.map(async (p) => {
      const cnt = await db.message.count({
        where: {
          threadId: p.threadId,
          senderId: { not: userId },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      });
      if (cnt > 0) unread += 1;
    }),
  );
  return unread;
}
