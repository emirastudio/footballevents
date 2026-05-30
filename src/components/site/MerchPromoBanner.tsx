import { getTranslations } from "next-intl/server";
import { Shirt, ArrowUpRight } from "lucide-react";

/**
 * Compact (~100px) premium promo banner cross-selling Goalbazza (fan-merch:
 * trade, auction, sell). Light surface with Goalbazza's cyan brand accent.
 */
export async function MerchPromoBanner() {
  const t = await getTranslations("merch");
  return (
    <a
      href="https://goalbazza.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] border border-[#a6e9ee] px-4 py-3.5 shadow-[var(--shadow-xs)] transition-all hover:border-[#5bd3db] hover:shadow-[var(--shadow-sm)]"
      style={{ background: "linear-gradient(120deg, #ffffff 0%, #f1fdfe 55%, #daf6f8 100%)" }}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[#1ec8d2] text-[var(--color-navy-900)]">
        <Shirt className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b8c95]">{t("badge")}</span>
        <p className="truncate font-[family-name:var(--font-manrope)] text-sm font-bold text-[var(--color-foreground)] sm:text-base">
          {t("title")}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-[#1ec8d2] px-4 py-2 text-sm font-bold text-[var(--color-navy-900)] transition-transform group-hover:translate-x-0.5">
        {t("cta")} <ArrowUpRight className="h-4 w-4" />
      </span>
    </a>
  );
}
