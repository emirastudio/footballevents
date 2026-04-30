import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_ENABLED, planFromPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { paymentFailedEmail } from "@/lib/email";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function tierToBoost(kind: string): "BASIC" | "FEATURED" | "PREMIUM" | null {
  if (kind === "basic" || kind === "bundle31" || kind === "bundle52") return "BASIC";
  if (kind === "featured") return "FEATURED";
  if (kind === "premium") return "PREMIUM";
  return null;
}

function durationDays(kind: string): number {
  if (kind === "basic" || kind === "bundle31" || kind === "bundle52") return 7;
  if (kind === "featured") return 14;
  if (kind === "premium") return 7;
  return 7;
}

function tierLabel(t: string) {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED || !stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed", err);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  // Idempotency: claim this event.id; duplicate POSTs from Stripe see the
  // unique-constraint failure and return 200 without re-running side effects.
  try {
    await db.webhookEvent.create({
      data: { id: event.id, provider: "stripe", type: event.type },
    });
  } catch {
    // Already seen
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe] handler error", event.type, event.id, err);
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { error: msg.slice(0, 1000) },
    }).catch(() => {});
    // Return 500 so Stripe retries; we'll process on retry because the row
    // has no processedAt yet — but the unique-constraint guard above means
    // we'll skip if the same event id is delivered twice in parallel.
    // To allow retry we delete the marker so the next attempt re-tries.
    await db.webhookEvent.delete({ where: { id: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const md = s.metadata ?? {};

      // Bundle purchases: credit N BoostCredit rows to the organizer.
      if (md.kindGroup === "bundle" && md.organizerId && md.kind) {
        const composition: Record<string, Array<"BASIC" | "FEATURED" | "PREMIUM">> = {
          bundle31: ["FEATURED", "FEATURED", "FEATURED", "PREMIUM"],
          bundle52: ["FEATURED", "FEATURED", "FEATURED", "FEATURED", "FEATURED", "PREMIUM", "PREMIUM"],
        };
        const items = composition[md.kind];
        if (items) {
          const paymentId = (s.payment_intent as string | null) ?? `bundle:${s.id}`;
          await db.boostCredit.createMany({
            data: items.map((tier) => ({
              organizerId: md.organizerId!,
              tier,
              paymentId,
              source: md.kind!,
            })),
            skipDuplicates: true,
          });
        }
        break;
      }

      if (md.kindGroup === "boost" && md.eventId && md.kind) {
        const tier = tierToBoost(md.kind);
        if (tier) {
          const days = durationDays(md.kind);
          const ev = await db.event.findUnique({ where: { id: md.eventId }, select: { boostTier: true, boostUntil: true } });
          const now = new Date();
          const baseFrom = ev?.boostUntil && ev.boostUntil > now ? ev.boostUntil : now;
          const endsAt = new Date(baseFrom.getTime() + days * 24 * 60 * 60 * 1000);
          const TIER_RANK: Record<string, number> = { BASIC: 1, FEATURED: 2, PREMIUM: 3 };
          const effectiveTier = ev?.boostTier && TIER_RANK[ev.boostTier] > TIER_RANK[tier] ? ev.boostTier : tier;
          await db.boost.create({
            data: {
              eventId: md.eventId,
              tier,
              startsAt: now,
              endsAt,
              priceCents: s.amount_total ?? 0,
              currency: (s.currency ?? "eur").toUpperCase(),
              paymentId: s.payment_intent as string | null,
            },
          });
          await db.event.update({
            where: { id: md.eventId },
            data: {
              boostTier: effectiveTier,
              boostUntil: endsAt,
              isFeatured: effectiveTier !== "BASIC" ? true : undefined,
              featuredUntil: effectiveTier !== "BASIC" ? endsAt : undefined,
            },
          });
        }
      }
      // Subscriptions are confirmed via subscription.created/updated below.
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const organizer = await db.organizer.findUnique({ where: { stripeCustomerId: customerId } });
      if (!organizer) break;
      const item = sub.items.data[0];
      const priceId = item?.price?.id ?? null;
      const { tier } = planFromPriceId(priceId);

      // If status is canceled / unpaid / incomplete_expired → drop to FREE
      if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
        await db.organizer.update({
          where: { id: organizer.id },
          data: { subscriptionTier: "FREE", subscriptionId: null, subscriptionEndsAt: null },
        });
        break;
      }

      if (!tier) break;

      await db.organizer.update({
        where: { id: organizer.id },
        data: {
          subscriptionTier: tier,
          subscriptionId: sub.id,
          subscriptionEndsAt: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
        },
      });

      // Welcome boost: only on first activation, only for paid tiers.
      if (event.type === "customer.subscription.created" && (tier === "PRO" || tier === "PREMIUM" || tier === "ENTERPRISE")) {
        const sentinel = `welcome:${sub.id}`;
        const already = await db.boost.findFirst({ where: { paymentId: sentinel } });
        if (!already) {
          const target = await db.event.findFirst({
            where: {
              organizerId: organizer.id,
              status: "PUBLISHED",
              startDate: { gte: new Date() },
            },
            orderBy: { startDate: "asc" },
          });
          if (target) {
            const startsAt = new Date();
            const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await db.boost.create({
              data: {
                eventId: target.id,
                tier: "BASIC",
                startsAt,
                endsAt,
                priceCents: 0,
                currency: "EUR",
                paymentId: sentinel,
              },
            });
            await db.event.update({
              where: { id: target.id },
              data: { boostTier: "BASIC", boostUntil: endsAt },
            });
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const organizer = await db.organizer.findUnique({ where: { stripeCustomerId: customerId } });
      if (!organizer) break;
      await db.organizer.update({
        where: { id: organizer.id },
        data: { subscriptionTier: "FREE", subscriptionId: null, subscriptionEndsAt: null },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) break;
      const organizer = await db.organizer.findUnique({ where: { stripeCustomerId: customerId } });
      if (!organizer) break;
      // Persist a Payment row for audit (idempotency comes from the
      // outer WebhookEvent dedup, so a plain create is safe here).
      await db.payment.create({
        data: {
          organizerId: organizer.id,
          amountCents: inv.amount_paid ?? 0,
          currency: (inv.currency ?? "eur").toUpperCase(),
          status: "SUCCEEDED",
          provider: "stripe",
          providerRef: inv.id,
          description: `Subscription invoice ${inv.number ?? ""}`,
        },
      }).catch((e) => { console.error("[stripe] payment row create failed", e); });
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) break;
      const organizer = await db.organizer.findUnique({ where: { stripeCustomerId: customerId } });
      if (!organizer) break;

      // Audit row
      await db.payment.create({
        data: {
          organizerId: organizer.id,
          amountCents: inv.amount_due ?? 0,
          currency: (inv.currency ?? "eur").toUpperCase(),
          status: "FAILED",
          provider: "stripe",
          providerRef: inv.id,
          description: `Failed invoice ${inv.number ?? ""}`,
        },
      }).catch(() => null);

      // Notify organizer with retry info
      const nextAttemptAt = inv.next_payment_attempt
        ? new Date(inv.next_payment_attempt * 1000)
        : null;
      try {
        await paymentFailedEmail({
          to: organizer.email,
          organizerName: organizer.name,
          tierName: tierLabel(organizer.subscriptionTier),
          amountCents: inv.amount_due ?? 0,
          currency: inv.currency ?? "eur",
          attemptCount: inv.attempt_count ?? 1,
          nextAttemptAt,
        });
      } catch (e) {
        console.error("[stripe] paymentFailedEmail failed", e);
      }
      break;
    }

    default:
      break;
  }
}
