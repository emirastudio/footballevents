import { db } from "@/lib/db";

export type CapacitySnapshot = {
  confirmed: number; // sum of partySize for ACCEPTED + COMPLETED
  pending: number;   // sum of partySize for NEW
  waitlist: number;  // sum of partySize for WAITLIST
  max: number | null;
  isFull: boolean;
  spotsLeft: number | null; // null if no max
  pctFilled: number;        // 0..100, only meaningful if max != null
};

export async function getEventCapacity(eventId: string, max: number | null): Promise<CapacitySnapshot> {
  const grouped = await db.booking.groupBy({
    by: ["status"],
    where: { eventId },
    _sum: { partySize: true },
  });

  let confirmed = 0;
  let pending = 0;
  let waitlist = 0;
  for (const g of grouped) {
    const sum = g._sum.partySize ?? 0;
    if (g.status === "ACCEPTED" || g.status === "COMPLETED") confirmed += sum;
    else if (g.status === "NEW") pending += sum;
    else if (g.status === "WAITLIST") waitlist += sum;
  }

  const isFull = max != null && confirmed >= max;
  const spotsLeft = max != null ? Math.max(0, max - confirmed) : null;
  const pctFilled = max != null && max > 0 ? Math.min(100, Math.round((confirmed / max) * 100)) : 0;

  return { confirmed, pending, waitlist, max, isFull, spotsLeft, pctFilled };
}
