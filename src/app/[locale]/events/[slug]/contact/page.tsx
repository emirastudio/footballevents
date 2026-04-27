import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// "Contact organizer" entrypoint. Finds (or creates) a Thread between the
// signed-in user and the event's organizer, then redirects into the inbox UI
// at /me/messages/<threadId>. Anonymous users get bounced to /sign-in with a
// next= back to here so the click doesn't lose its target.
export default async function ContactOrganizerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    const next = encodeURIComponent(`/${locale}/events/${slug}/contact`);
    redirect(`/${locale}/sign-in?next=${next}`);
  }
  const userId = session.user.id;

  const event = await db.event.findUnique({
    where: { slug },
    select: { id: true, organizer: { select: { userId: true } } },
  });
  if (!event) redirect(`/${locale}/events`);

  const organizerUserId = event.organizer.userId;
  if (organizerUserId === userId) {
    // Own event — no point chatting with yourself; send to organizer cabinet.
    redirect(`/${locale}/organizer/events`);
  }

  // Reuse the existing event-level thread (no booking attached) between these
  // two participants if one already exists. Otherwise create it.
  const existing = await db.thread.findFirst({
    where: {
      eventId: event.id,
      bookingId: null,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: organizerUserId } } },
      ],
    },
    select: { id: true },
  });

  let threadId = existing?.id;
  if (!threadId) {
    const thread = await db.thread.create({
      data: {
        eventId: event.id,
        participants: { create: [{ userId }, { userId: organizerUserId }] },
      },
      select: { id: true },
    });
    threadId = thread.id;
  }

  redirect(`/${locale}/me/messages/${threadId}`);
}
