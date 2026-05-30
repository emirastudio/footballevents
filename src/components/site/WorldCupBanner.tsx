import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Trophy, ArrowRight } from "lucide-react";

/** Gold promo banner/card for the FIFA World Cup 2026 landing page. */
export async function WorldCupBanner() {
  const t = await getTranslations("worldCup");
  return (
    <Link
      href="/world-cup-2026"
      className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-gold-400)] bg-[var(--color-navy-900)] p-6 shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] sm:p-8"
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: "radial-gradient(900px 300px at 85% -20%, rgba(212,175,55,0.4), transparent 60%)" }}
        aria-hidden
      />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] text-[var(--color-navy-900)] shadow-[var(--shadow-sm)]">
            <Trophy className="h-6 w-6 fill-current" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gold-300)]">{t("badge")}</span>
            <h2 className="mt-0.5 font-[family-name:var(--font-manrope)] text-xl font-bold text-white sm:text-2xl">
              {t("bannerTitle")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/85">{t("bannerText")}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] px-5 py-2.5 text-sm font-bold text-[var(--color-navy-900)] transition-transform group-hover:translate-x-0.5">
          {t("bannerCta")} <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
