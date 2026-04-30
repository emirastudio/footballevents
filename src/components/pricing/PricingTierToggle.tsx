"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startSubscriptionCheckout, changeSubscriptionPlan } from "@/app/actions/billing";

type Tier = {
  key: "free" | "pro" | "premium" | "enterprise";
  name: string;
  tagline: string;
  popular: boolean;
  popularLabel: string;
  monthly: string;
  annual: string;
  annualEq: string;
  ctaHref: string;
  ctaLabel: string;
};

export function PricingTierToggle({
  monthlyLabel,
  annualLabel,
  billedMonthlyLabel,
  billedAnnuallyLabel,
  tiers,
  monthlySuffix,
  annualSuffix,
  locale,
  hasActiveSubscription = false,
  currentTier = "FREE",
}: {
  monthlyLabel: string;
  annualLabel: string;
  billedMonthlyLabel: string;
  billedAnnuallyLabel: string;
  tiers: Tier[];
  monthlySuffix: string;
  annualSuffix: string;
  locale: string;
  hasActiveSubscription?: boolean;
  currentTier?: "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";
}) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <div className="mb-8 flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-xs)]">
          <ToggleBtn active={!annual} onClick={() => setAnnual(false)}>{monthlyLabel}</ToggleBtn>
          <ToggleBtn active={annual} onClick={() => setAnnual(true)}>
            {annualLabel}
            <span className="ml-1.5 rounded-full bg-[var(--color-pitch-50)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-pitch-700)]">−17%</span>
          </ToggleBtn>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((p) => {
          const price = annual ? p.annual : p.monthly;
          const isText = /[A-Za-zА-Яа-я]/.test(price); // "Talk to us" — no $ suffix
          const isCurrent = currentTier !== "FREE" && p.key === currentTier.toLowerCase();
          return (
            <div
              key={p.key}
              className={`relative flex flex-col rounded-[var(--radius-2xl)] border bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xs)] transition ${
                isCurrent ? "border-blue-500 ring-2 ring-blue-500/20" :
                p.popular ? "border-[var(--color-pitch-500)] ring-2 ring-[var(--color-pitch-500)]/20" :
                "border-[var(--color-border)]"
              }`}
            >
              {isCurrent ? (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
                  Current plan
                </span>
              ) : p.popular && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--color-pitch-500)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
                  <Star className="h-3 w-3 fill-current" /> {p.popularLabel}
                </span>
              )}
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{p.name}</h3>
              <p className="mt-1.5 text-sm text-[var(--color-muted-strong)]">{p.tagline}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">{price}</span>
                {!isText && (
                  <span className="pb-1 text-sm text-[var(--color-muted)]">
                    {annual ? annualSuffix : monthlySuffix}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {annual && p.annualEq ? `${billedAnnuallyLabel} · ≈ ${p.annualEq}` : annual ? "" : billedMonthlyLabel}
              </p>
              {p.key === "pro" || p.key === "premium" ? (
                <form action={hasActiveSubscription ? changeSubscriptionPlan : startSubscriptionCheckout} className="mt-7">
                  <input type="hidden" name="plan" value={p.key} />
                  <input type="hidden" name="cycle" value={annual ? "annual" : "monthly"} />
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant={p.popular ? "accent" : "outline"} size="lg" className="w-full">
                    {p.ctaLabel}
                  </Button>
                </form>
              ) : (
                <Button asChild variant={p.popular ? "accent" : "outline"} size="lg" className="mt-7 w-full">
                  <Link href={p.ctaHref}>{p.ctaLabel}</Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-[var(--color-foreground)] text-white shadow-[var(--shadow-sm)]"
          : "text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
