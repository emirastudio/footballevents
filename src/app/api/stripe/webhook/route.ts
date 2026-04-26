import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_ENABLED, planFromPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const md = s.metadata ?? {};
        if (md.kindGroup === "boost" && md.eventId && md.kind) {
          const tier = tierToBoost(md.kind);
          if (tier) {
            const days = durationDays(md.kind);
            const startsAt = new Date();
            const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            await db.boost.create({
              data: {
                eventId: md.eventId,
                tier,
                startsAt,
                endsAt,
                priceCents: s.amount_total ?? 0,
                currency: (s.currency ?? "eur").toUpperCase(),
                paymentId: s.payment_intent as string | null,
              },
            });
            await db.event.update({
              where: { id: md.eventId },
              data: {
                boostTier: tier,
                boostUntil: endsAt,
                isFeatured: tier !== "BASIC" ? true : undefined,
                featuredUntil: tier !== "BASIC" ? endsAt : undefined,
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
        if (!tier) break;

        await db.organizer.update({
          where: { id: organizer.id },
          data: {
            subscriptionTier: tier,
            subscriptionId: sub.id,
            subscriptionEndsAt: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
          },
        });
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

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
