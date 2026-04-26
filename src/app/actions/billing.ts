"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe, STRIPE_ENABLED, PRICE_IDS, BOOST_PRICES_CENTS, type BoostKind } from "@/lib/stripe";

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
