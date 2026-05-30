import { getTranslations } from "next-intl/server";
import { Shirt, ArrowUpRight, Repeat, Gavel, Tag } from "lucide-react";

/**
 * Gold promo banner cross-selling Goalbazza (fan-merch platform: trade, auction,
 * sell). Links out to goalbazza.com. Drop it onto tournament / World Cup pages.
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
      className="group relative block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-gold-400)] bg-gradient-to-br from-[var(--color-navy-900)] via-[var(--color-navy-900)] to-[#3a2d0a] p-6 shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] sm:p-8"
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: "radial-gradient(700px 260px at 90% -30%, rgba(212,175,55,0.45), transparent 60%)" }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] text-[var(--color-navy-900)] shadow-[var(--shadow-sm)]">
            <Shirt className="h-6 w-6" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-gold-300)]">{t("badge")}</span>
            <h2 className="mt-0.5 font-[family-name:var(--font-manrope)] text-xl font-bold text-white sm:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/85">{t("text")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pills.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-gold-400)]/40 bg-[var(--color-gold-500)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-gold-200)]">
                  <p.icon className="h-3.5 w-3.5" /> {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-gold-500)] px-5 py-2.5 text-sm font-bold text-[var(--color-navy-900)] transition-transform group-hover:translate-x-0.5">
          {t("cta")} <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}
