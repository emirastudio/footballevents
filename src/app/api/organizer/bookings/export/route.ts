import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseForm, fieldLabel } from "@/lib/forms/types";
import { getOrgForAction, allowedEventIdsForUser } from "@/lib/organizer-access";

function csvCell(v: unknown): string {
  let s: string;
  if (Array.isArray(v)) s = v.join("; ");
  else if (typeof v === "boolean") s = v ? "yes" : "no";
  else s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** GET /api/organizer/bookings/export?eventId=... — CSV of an event's applications. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const access = await getOrgForAction(session.user.id, "bookings");
  if (!access) return new Response("Forbidden", { status: 403 });
  const organizer = access.organizer;

  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) return new Response("Missing eventId", { status: 400 });

  // Per-event ACL: STAFF with explicit grants can only export events they have.
  const scope = await allowedEventIdsForUser(access, session.user.id);
  if (scope !== "all" && !scope.includes(eventId)) {
    return new Response("Not found", { status: 404 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, slug: true, registrationForm: true },
  });
  if (!event || event.organizerId !== organizer.id) return new Response("Not found", { status: 404 });

  // Optional ?ids=a,b,c — narrows the export to a selected subset of bookings
  // (used by the per-event applications table's "Export selected" action).
  const idsParam = url.searchParams.get("ids");
  const idsFilter = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const bookings = await db.booking.findMany({
    where: {
      eventId,
      ...(idsFilter ? { id: { in: idsFilter } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const customFields = parseForm(event.registrationForm).fields.filter(
    (f) => f.type !== "heading" && f.type !== "info",
  );

  const baseCols = ["Date", "Status", "Name", "Team", "Party size", "Email", "Phone", "Comment"];
  const header = [...baseCols, ...customFields.map((f) => fieldLabel(f.label))];

  const rows = bookings.map((b) => {
    const cf = (b.customFields ?? {}) as Record<string, unknown>;
    return [
      b.createdAt.toISOString().slice(0, 16).replace("T", " "),
      b.status,
      b.participantName,
      b.teamName ?? "",
      b.partySize,
      b.contactEmail,
      b.contactPhone ?? "",
      b.comment ?? "",
      ...customFields.map((f) => cf[f.id]),
    ].map(csvCell).join(",");
  });

  const csv = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${event.slug}.csv"`,
    },
  });
}
