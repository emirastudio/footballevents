import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key, { apiVersion: "2025-09-30.clover" as never }) : null;

export const STRIPE_ENABLED = !!key;

// Subscription price IDs from Stripe dashboard. Use Test-mode IDs in dev, swap in prod.
export const PRICE_IDS = {
  pro_monthly:     process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:      process.env.STRIPE_PRICE_PRO_ANNUAL,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  premium_annual:  process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
} as const;

// Boost prices stored as inline price_data so we don't need to manage them in Stripe dashboard.
// (Subscriptions still need recurring Prices configured in Stripe.)
export const BOOST_PRICES_CENTS = {
  basic:    900,    // €9
  featured: 3900,   // €39
  premium:  11900,  // €119
  bundle31: 8900,   // 3 Featured + 1 Premium bundle
  bundle52: 19900,  // 5 Featured + 2 Premium bundle
} as const;

export type BoostKind = keyof typeof BOOST_PRICES_CENTS;

export function planFromPriceId(priceId: string | null | undefined): { tier: "PRO" | "PREMIUM" | null; cycle: "monthly" | "annual" | null } {
  if (!priceId) return { tier: null, cycle: null };
  if (priceId === PRICE_IDS.pro_monthly)     return { tier: "PRO",     cycle: "monthly" };
  if (priceId === PRICE_IDS.pro_annual)      return { tier: "PRO",     cycle: "annual" };
  if (priceId === PRICE_IDS.premium_monthly) return { tier: "PREMIUM", cycle: "monthly" };
  if (priceId === PRICE_IDS.premium_annual)  return { tier: "PREMIUM", cycle: "annual" };
  return { tier: null, cycle: null };
}
