import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Trophy, MapPin, CalendarDays } from "lucide-react";
import { WC2026 } from "@/content/world-cup-2026";
import type { Locale } from "@/i18n/config";

/** Gold "featured tournament" card for the FIFA World Cup 2026 → /world-cup-2026. */
export async function WorldCupCard({ locale }: { locale: string }) {
  const t = await getTranslations("worldCup");
  const c = WC2026.locales[locale as Locale] ?? WC2026.locales.en;

  return (
    <Link
      href="/world-cup-2026"
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-gold-400)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] ring-1 ring-[var(--color-gold-400)]/30 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-navy-900)]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(420px 200px at 50% 0%, rgba(212,175,55,0.5), transparent 65%)" }} aria-hidden />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-gold-500)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-navy-900)]">
          <Trophy className="h-3 w-3 fill-current" /> {t("badge")}
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="h-12 w-12 text-[var(--color-gold-400)]" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-gold-700)]">
          {c.h1}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{c.facts.hosts}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <CalendarDays className="h-3 w-3 shrink-0" /><span className="truncate">{c.facts.dates}</span>
        </div>
        <div className="mt-auto border-t border-[var(--color-border)] pt-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold-700)]">{t("bannerCta")}</span>
        </div>
      </div>
    </Link>
  );
}
