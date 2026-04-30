import { db } from "@/lib/db";

export async function recalcEventRating(eventId: string) {
  const stats = await db.review.aggregate({
    where: { eventId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await db.event.update({
    where: { id: eventId },
    data: {
      ratingAvg: stats._avg.rating ?? 0,
      ratingCount: stats._count._all,
    },
  });
}
