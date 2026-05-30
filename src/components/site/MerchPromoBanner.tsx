import { getTranslations } from "next-intl/server";
import { Shirt, ArrowUpRight, Repeat, Gavel, Tag } from "lucide-react";

/**
 * Light, understated promo banner cross-selling Goalbazza (fan-merch platform:
 * trade, auction, sell). Soft gold gradient on a light surface. Links out to
 * goalbazza.com. Drop it onto tournament / World Cup pages.
 */
export async function MerchPromoBanner() {
  const t = await getTranslations("merch");
  const pills = [
    { icon: Repeat, label: t("trade") },
    { icon: Gavel, label: t("auction") },
    { icon: Tag, label: t("sell") },
  ];
  return (
    <a
      href="https://goalbazza.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-gold-300)] p-6 shadow-[var(--shadow-xs)] transition-all hover:border-[var(--color-gold-400)] hover:shadow-[var(--shadow-sm)] sm:p-7"
      style={{ background: "linear-gradient(120deg, #ffffff 0%, #fffaf0 55%, #faf1d8 100%)" }}
    >
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] text-[var(--color-navy-900)] shadow-[var(--shadow-xs)]">
            <Shirt className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gold-700)]">{t("badge")}</span>
            <h2 className="mt-0.5 font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)] sm:text-xl">
              {t("title")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-muted-strong)]">{t("text")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pills.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold-300)] bg-[var(--color-gold-500)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-gold-700)]">
                  <p.icon className="h-3.5 w-3.5" /> {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] px-5 py-2.5 text-sm font-bold text-[var(--color-navy-900)] shadow-[var(--shadow-xs)] transition-transform group-hover:translate-x-0.5">
          {t("cta")} <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}
