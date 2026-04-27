# Stripe setup

End-to-end checklist to enable subscriptions, boosts and the webhook flow.
**~30 min total**, most of which is clicking around the Stripe dashboard.

---

## 0. Prerequisites

- A Stripe account ([dashboard.stripe.com](https://dashboard.stripe.com)).
- Local dev: install the Stripe CLI ([instructions](https://docs.stripe.com/stripe-cli)).
- Production: a public HTTPS URL for the webhook (e.g. `https://footballevents.eu`).

> Start in **Test mode** first. Once everything works, repeat for Live mode.

---

## 1. Get the API keys

Dashboard → Developers → **API keys**.

Copy these into `.env`:

| Variable | What it is | Where to find |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` / `pk_live_…` | "Publishable key" |
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` | "Secret key" — click **Reveal** |

The publishable key is safe to ship to the browser. The **secret key must never** be committed or exposed client-side. `.env*` is already in `.gitignore`.

---

## 2. Create the four subscription products

Dashboard → Products → **Add product**. Create one product per row:

| Product name | Pricing model | Price | Billing period | Env var |
|---|---|---|---|---|
| Pro | Recurring | €29.00 | Monthly | `STRIPE_PRICE_PRO_MONTHLY` |
| Pro (annual) | Recurring | €290.00 | Yearly | `STRIPE_PRICE_PRO_ANNUAL` |
| Premium | Recurring | €99.00 | Monthly | `STRIPE_PRICE_PREMIUM_MONTHLY` |
| Premium (annual) | Recurring | €990.00 | Yearly | `STRIPE_PRICE_PREMIUM_ANNUAL` |

After saving each product, copy the **Price ID** (starts with `price_…`) — *not* the product ID — into the matching env var.

> Boosts are charged via inline `price_data`, so they need **no** product setup in the dashboard. Pricing is in [`src/lib/stripe.ts`](src/lib/stripe.ts).

---

## 3. Configure the webhook endpoint

The webhook tells our server when a Stripe payment finishes, so we can flip the organizer's tier or activate a boost.

### 3a. Local development

Run in a separate terminal while the dev server is up:

```bash
stripe listen --forward-to localhost:6969/api/stripe/webhook
```

The CLI prints a signing secret like `whsec_abc123…`. Paste it into `.env` as `STRIPE_WEBHOOK_SECRET` and restart the dev server.

### 3b. Production

Dashboard → Developers → **Webhooks** → **Add endpoint**.

- **Endpoint URL:** `https://footballevents.eu/api/stripe/webhook`
- **Events to send:** select these four:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Save, then click the new endpoint → reveal the **Signing secret** (`whsec_…`). Paste into your prod env as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Configure the Customer Portal (cancellation flow)

Dashboard → Settings → **Billing** → **Customer portal**.

Enable at minimum:
- **Update payment method**
- **View invoice history**
- **Cancel subscriptions** (set to "End of billing period" — the [refund policy](content/legal/refund.md) does not allow mid-cycle refunds)

The portal is opened from the organizer dashboard via [`openBillingPortal`](src/app/actions/billing.ts).

---

## 5. Verify

With keys filled in and dev server restarted:

1. Open `/pricing` → click **Subscribe to Pro**. You should be redirected to a Stripe Checkout page (test cards: `4242 4242 4242 4242`, any future date, any CVC, any postal code).
2. Complete checkout → redirected back to `/organizer/dashboard?checkout=success`.
3. The webhook fires → organizer's `subscriptionTier` becomes `PRO` and the **welcome boost** is auto-applied to their nearest event.
4. Open any published event → bottom of the page → click **Apply free Basic** in the gold "Included with your plan" panel. Boost activates instantly with no payment.

Watch `stripe listen` output — every webhook event should show `→ 200 OK`.

---

## 6. Going live

When you switch to Live mode:

1. Re-create the 4 products in Live mode (Test and Live are separate).
2. Replace all `..._test_…` keys with `..._live_…`.
3. Replace the dev webhook (`stripe listen`) with the production endpoint signing secret.
4. Set `NEXT_PUBLIC_SITE_URL=https://footballevents.eu` in prod env.
5. Test once with a real card and a €0.50 throwaway boost (then refund it manually in the Dashboard if you want — note that this is a Stripe-side refund, not user-initiated).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/pricing` redirects to `?stripe=not-configured` | `STRIPE_SECRET_KEY` is empty |
| `?stripe=missing-price` after clicking subscribe | One of the four `STRIPE_PRICE_*` vars is empty |
| Webhook returns 400 "Bad signature" | `STRIPE_WEBHOOK_SECRET` is wrong or missing |
| Webhook returns 503 | Stripe not configured at all (no secret key) |
| Subscription paid but tier stayed FREE | Webhook didn't reach the server — check `stripe listen` is running, or that the prod endpoint is registered |
| Welcome boost did not apply | Organizer had no published future event at the moment of activation. Boost is one-time per subscription — applies again only on a new `subscription.created` event |

---

## What is **not** in Stripe (yet)

- **Banner ads** (`AdCampaign`) — currently admin-managed, no Stripe flow.
- **Ticketing fees** — placeholder for v3 once Stripe Connect is wired.
- **EU VAT collection** — enable Stripe Tax in Dashboard → Settings → Tax when ready.
