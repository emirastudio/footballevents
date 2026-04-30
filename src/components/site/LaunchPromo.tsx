import { Link } from "@/i18n/navigation";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

type Props = {
  label: string;
  title: string;
  subtitle: string;
  remainingLabel: string;
  cta: string;
  // mock — in production comes from DB count
  spotsLeft?: number;
  spotsTotal?: number;
};

export function LaunchPromo({
  label, title, subtitle, remainingLabel, cta,
  spotsLeft = 42, spotsTotal = 50,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(((spotsTotal - spotsLeft) / spotsTotal) * 100)));

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-gold-400)] bg-gradient-to-br from-[var(--color-gold-300)]/15 via-white to-white shadow-[var(--shadow-md)]">
      {/* Decorative shimmer — pure gold */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 90% 10%, rgba(212,175,55,0.30), transparent 40%), radial-gradient(circle at 10% 90%, rgba(236,209,121,0.20), transparent 45%)",
        }}
      />

      <div className="relative grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-premium)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
            <Sparkles className="h-3 w-3" />
            {label}
          </div>
          <h2 className="text-balance font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-muted-strong)]">{subtitle}</p>

          {/* Progress */}
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-[var(--color-foreground)]">
                {remainingLabel}: <span className="text-[var(--color-premium)]">{spotsLeft}</span> / {spotsTotal}
              </span>
              <span className="text-[var(--color-muted)]">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold-300)] via-[var(--color-premium)] to-[var(--color-gold-600)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          href="/sign-up?role=organizer&promo=launch100"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-premium)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-gold-600)] hover:shadow-[var(--shadow-md)]"
        >
          <Zap className="h-4 w-4 fill-current" />
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
