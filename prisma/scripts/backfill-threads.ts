// Run once via tsx in the seed environment: pnpm tsx prisma/scripts/backfill-threads.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const bookings = await db.booking.findMany({
    where: { thread: { is: null } },
    include: { event: { include: { organizer: true, translations: { where: { locale: "en" } } } } },
  });

  let created = 0;
  let skipped = 0;

  for (const booking of bookings) {
    const applicantUserId = booking.userId;
    const organizerUserId = booking.event.organizer.userId;
    if (applicantUserId === organizerUserId) {
      skipped += 1;
      continue;
    }
    const existing = await db.thread.findUnique({ where: { bookingId: booking.id } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await db.thread.create({
      data: {
        eventId: booking.eventId,
        bookingId: booking.id,
        subject: booking.event.translations[0]?.title ?? booking.event.slug,
        lastMessageAt: booking.createdAt,
        participants: {
          create: [
            { userId: applicantUserId },
            { userId: organizerUserId },
          ],
        },
      },
    });
    created += 1;
  }

  console.info(`[backfill-threads] created=${created} skipped=${skipped} totalSeen=${bookings.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
