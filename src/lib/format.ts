// Locale-aware formatters
const monthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthNamesRu = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
const monthNamesDe = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const monthNamesEs = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const monthMap: Record<string, string[]> = {
  en: monthNamesEn, ru: monthNamesRu, de: monthNamesDe, es: monthNamesEs,
};

export function formatDateRange(start: string, end: string, locale: string = "en") {
  const s = new Date(start), e = new Date(end);
  const months = monthMap[locale] ?? monthNamesEn;
  const sM = months[s.getMonth()], eM = months[e.getMonth()];
  const sameMonth = s.getMonth() === e.getMonth();
  if (s.toDateString() === e.toDateString())
    return `${s.getDate()} ${sM} ${s.getFullYear()}`;
  if (sameMonth)
    return `${s.getDate()}–${e.getDate()} ${sM} ${s.getFullYear()}`;
  return `${s.getDate()} ${sM} – ${e.getDate()} ${eM} ${s.getFullYear()}`;
}

export function formatPrice(amount: number | null | undefined, currency = "EUR", locale = "en") {
  if (amount === null || amount === undefined) return "";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `€${amount}`;
  }
}
