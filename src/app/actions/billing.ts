"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe, STRIPE_ENABLED, PRICE_IDS, BOOST_PRICES_CENTS, type BoostKind } from "@/lib/stripe";
import type { Tier } from "@/lib/tier";
import { currentQuotaPeriod, getIncludedBoostsRemaining, includedKindAllowed, includedSentinel } from "@/lib/included-boosts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

async function ensureCustomer(organizerId: string) {
  if (!stripe) throw new Error("Stripe not configured");
  const org = await db.organizer.findUnique({ where: { id: organizerId } });
  if (!org) throw new Error("Organizer not found");
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: org.email,
    name: org.name,
    metadata: { organizerId },
  });
  await db.organizer.update({ where: { id: organizerId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function startSubscriptionCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  if (!STRIPE_ENABLED || !stripe) {
    redirect("/pricing?stripe=not-configured");
  }

  const plan = formData.get("plan") as "pro" | "premium";
  const cycle = (formData.get("cycle") as "monthly" | "annual") ?? "monthly";
  const priceId = PRICE_IDS[`${plan}_${cycle}` as keyof typeof PRICE_IDS];
  if (!priceId) redirect("/pricing?stripe=missing-price");

  const customerId = await ensureCustomer(organizer.id);

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE}/organizer/dashboard?checkout=success`,
    cancel_url: `${SITE}/pricing?checkout=cancelled`,
    automatic_tax: { enabled: false },
    subscription_data: { metadata: { organizerId: organizer.id, plan, cycle } },
    metadata: { organizerId: organizer.id, kind: "subscription", plan, cycle },
  });
  if (!checkout.url) throw new Error("No checkout URL");
  redirect(checkout.url);
}

export async function startBoostCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  if (!STRIPE_ENABLED || !stripe) {
    redirect("/pricing?stripe=not-configured");
  }

  const eventId = formData.get("eventId") as string;
  const kind = formData.get("kind") as BoostKind;
  if (!eventId || !(kind in BOOST_PRICES_CENTS)) redirect("/pricing");

  const ev = await db.event.findUnique({ where: { id: eventId } });
  if (!ev || ev.organizerId !== organizer.id) redirect("/organizer/events");

  const customerId = await ensureCustomer(organizer.id);
  const amount = BOOST_PRICES_CENTS[kind];

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: amount,
        product_data: { name: `Boost (${kind}) — ${ev.slug}` },
      },
    }],
    success_url: `${SITE}/organizer/events/${ev.id}?boost=success`,
    cancel_url: `${SITE}/organizer/events/${ev.id}?boost=cancelled`,
    metadata: { organizerId: organizer.id, eventId: ev.id, kind, kindGroup: "boost" },
  });
  if (!checkout.url) throw new Error("No checkout URL");
  redirect(checkout.url);
}

// Applies one of the included monthly boosts (no Stripe charge). Quota is
// derived by counting Boost rows with paymentId starting `included:<orgId>:<period>:`.
export async function applyIncludedBoost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const eventId = formData.get("eventId") as string;
  const kind = formData.get("kind") as BoostKind;
  if (!eventId || !(kind in BOOST_PRICES_CENTS)) redirect("/organizer/events");

  if (!includedKindAllowed(organizer.subscriptionTier as Tier, kind)) {
    redirect(`/organizer/events/${eventId}?included=not-allowed`);
  }

  const ev = await db.event.findUnique({ where: { id: eventId } });
  if (!ev || ev.organizerId !== organizer.id) redirect("/organizer/events");

  const remaining = await getIncludedBoostsRemaining(organizer.id, organizer.subscriptionTier);
  if (remaining <= 0) redirect(`/organizer/events/${eventId}?included=exhausted`);

  const days = kind === "featured" ? 14 : 7;
  const tier: "BASIC" | "FEATURED" | "PREMIUM" =
    kind === "featured" ? "FEATURED" : kind === "premium" ? "PREMIUM" : "BASIC";
  // Stack instead of overwrite: if the event already has an active boost,
  // start the new period at the current end (or now if expired). 3× BASIC
  // applied in one sitting → 21 days total, not 7.
  const now = new Date();
  const baseFrom = ev.boostUntil && ev.boostUntil > now ? ev.boostUntil : now;
  const endsAt = new Date(baseFrom.getTime() + days * 24 * 60 * 60 * 1000);
  // Don't downgrade an existing higher tier (e.g. running FEATURED + applying
  // BASIC) — keep the higher tier active, just extend the window.
  const TIER_RANK: Record<string, number> = { BASIC: 1, FEATURED: 2, PREMIUM: 3 };
  const effectiveTier = ev.boostTier && TIER_RANK[ev.boostTier] > TIER_RANK[tier] ? ev.boostTier : tier;
  const period = currentQuotaPeriod();

  await db.boost.create({
    data: {
      eventId: ev.id,
      tier,
      startsAt: now,
      endsAt,
      priceCents: 0,
      currency: "EUR",
      paymentId: includedSentinel(organizer.id, period, kind),
    },
  });
  await db.event.update({
    where: { id: ev.id },
    data: {
      boostTier: effectiveTier,
      boostUntil: endsAt,
      isFeatured: effectiveTier !== "BASIC" ? true : undefined,
      featuredUntil: effectiveTier !== "BASIC" ? endsAt : undefined,
    },
  });

  revalidatePath(`/organizer/events/${ev.id}`);
  revalidatePath(`/organizer/dashboard`);
  redirect(`/organizer/events/${ev.id}?included=success`);
}

export async function openBillingPortal() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer?.stripeCustomerId) redirect("/pricing");
  if (!STRIPE_ENABLED || !stripe) redirect("/pricing?stripe=not-configured");

  const portal = await stripe.billingPortal.sessions.create({
    customer: organizer.stripeCustomerId,
    return_url: `${SITE}/organizer/dashboard`,
  });
  redirect(portal.url);
}
