import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Resend signs webhooks with Svix. The secret is `whsec_<base64>` — the actual
// HMAC key is the base64-decoded portion after the prefix. We verify manually
// (no svix npm dep) because it's ~30 lines and one less thing to keep updated.
//
// Signature header format: `v1,<sig1> v1,<sig2> ...` (multiple sigs during key
// rotation). Signed payload is `${svix-id}.${svix-timestamp}.${rawBody}`.
const RAW_SECRET = process.env.RESEND_WEBHOOK_SECRET ?? "";

function verifySvix(rawBody: string, headers: Headers): boolean {
  if (!RAW_SECRET.startsWith("whsec_")) return false;
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;

  // Reject replays older than 5 minutes.
  const now = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > 5 * 60) return false;

  const key = Buffer.from(RAW_SECRET.slice("whsec_".length), "base64");
  const signed = `${id}.${ts}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signed).digest();

  return sigHeader.split(" ").some((entry) => {
    const [version, b64] = entry.split(",");
    if (version !== "v1" || !b64) return false;
    let got: Buffer;
    try {
      got = Buffer.from(b64, "base64");
    } catch {
      return false;
    }
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

// Map Resend event type → the EmailLog column we bump. Any type we don't
// recognise is stored via WebhookEvent (for audit) and otherwise ignored.
type ResendEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string | string[];
    subject?: string;
    bounce?: { message?: string; subType?: string; type?: string };
    reason?: string;
  };
};

function tsFromEvent(ev: ResendEvent): Date {
  const t = ev.created_at ? Date.parse(ev.created_at) : NaN;
  return Number.isFinite(t) ? new Date(t) : new Date();
}

export async function POST(req: NextRequest) {
  if (!RAW_SECRET) {
    return NextResponse.json({ error: "Resend webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (!verifySvix(raw, req.headers)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let ev: ResendEvent;
  try {
    ev = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const svixId = req.headers.get("svix-id")!;
  // Idempotency: claim this delivery attempt. A duplicate POST from Svix hits
  // the unique constraint and returns 200 without re-running side effects.
  try {
    await db.webhookEvent.create({
      data: { id: svixId, provider: "resend", type: ev.type },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(ev);
    await db.webhookEvent.update({
      where: { id: svixId },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[resend] handler error", ev.type, svixId, err);
    await db.webhookEvent.update({
      where: { id: svixId },
      data: { error: msg.slice(0, 1000) },
    }).catch(() => {});
    // Delete the marker so Svix retries this delivery successfully next time.
    await db.webhookEvent.delete({ where: { id: svixId } }).catch(() => {});
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(ev: ResendEvent) {
  const emailId = ev.data?.email_id;
  if (!emailId) return; // Nothing to correlate against.

  const at = tsFromEvent(ev);

  // Some events (delivery_delayed, sent) don't change our terminal status —
  // we still store the timestamp so operators can audit the full lifecycle.
  switch (ev.type) {
    case "email.sent":
      await bumpLog(emailId, ev, { status: "SENT", sentAt: at });
      return;
    case "email.delivered":
      await bumpLog(emailId, ev, { status: "DELIVERED", deliveredAt: at });
      return;
    case "email.opened":
      await bumpLog(emailId, ev, { openedAt: at });
      return;
    case "email.clicked":
      await bumpLog(emailId, ev, { clickedAt: at });
      return;
    case "email.bounced":
      await bumpLog(emailId, ev, {
        status: "BOUNCED",
        bouncedAt: at,
        bounceType: ev.data?.bounce?.type ?? ev.data?.bounce?.subType ?? null,
      });
      return;
    case "email.complained":
      await bumpLog(emailId, ev, { status: "COMPLAINED", complainedAt: at });
      return;
    case "email.failed":
    case "email.delivery_delayed":
      // `delivery_delayed` is not terminal but often precedes a bounce; record
      // it so we can distinguish "still trying" from "silently dropped".
      await bumpLog(emailId, ev, {
        status: ev.type === "email.failed" ? "FAILED" : undefined,
        failedAt: ev.type === "email.failed" ? at : undefined,
        failReason: ev.data?.reason ?? null,
      });
      return;
    default:
      // Unknown event type — WebhookEvent already logged it for audit.
      console.warn("[resend] unhandled event type", ev.type);
  }
}

type BumpFields = {
  status?: "SENT" | "DELIVERED" | "BOUNCED" | "COMPLAINED" | "FAILED";
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceType?: string | null;
  complainedAt?: Date;
  failedAt?: Date;
  failReason?: string | null;
};

async function bumpLog(emailId: string, ev: ResendEvent, fields: BumpFields) {
  // Upsert — the webhook can arrive before our own EmailLog insert lands in
  // rare timing edges, so we create-on-miss with best-effort recipient data.
  const to = Array.isArray(ev.data?.to) ? ev.data?.to[0] : ev.data?.to;
  await db.emailLog.upsert({
    where: { id: emailId },
    create: {
      id: emailId,
      toEmail: to ?? "unknown",
      subject: ev.data?.subject ?? null,
      status: fields.status ?? "SENT",
      sentAt: fields.sentAt ?? new Date(),
      deliveredAt: fields.deliveredAt,
      openedAt: fields.openedAt,
      clickedAt: fields.clickedAt,
      bouncedAt: fields.bouncedAt,
      bounceType: fields.bounceType ?? undefined,
      complainedAt: fields.complainedAt,
      failedAt: fields.failedAt,
      failReason: fields.failReason ?? undefined,
    },
    update: {
      // Only update status when the new event is a terminal signal — don't
      // clobber DELIVERED with a later OPENED event, for example.
      ...(fields.status ? { status: fields.status } : {}),
      ...(fields.sentAt ? { sentAt: fields.sentAt } : {}),
      ...(fields.deliveredAt ? { deliveredAt: fields.deliveredAt } : {}),
      ...(fields.openedAt ? { openedAt: fields.openedAt } : {}),
      ...(fields.clickedAt ? { clickedAt: fields.clickedAt } : {}),
      ...(fields.bouncedAt ? { bouncedAt: fields.bouncedAt } : {}),
      ...(fields.bounceType ? { bounceType: fields.bounceType } : {}),
      ...(fields.complainedAt ? { complainedAt: fields.complainedAt } : {}),
      ...(fields.failedAt ? { failedAt: fields.failedAt } : {}),
      ...(fields.failReason ? { failReason: fields.failReason } : {}),
    },
  });
}
