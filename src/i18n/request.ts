import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale;

  // Load locale messages with EN fallback for missing keys
  const [base, current] = await Promise.all([
    import(`../../messages/en.json`).then((m) => m.default),
    locale === "en"
      ? Promise.resolve(null)
      : import(`../../messages/${locale}.json`).then((m) => m.default),
  ]);

  const messages = current ? deepMerge(base, current) : base;
  return { locale, messages };
});

function deepMerge<T extends Record<string, unknown>>(base: T, override: T): T {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const a = base[key];
    const b = override[key];
    if (
      a && b &&
      typeof a === "object" && typeof b === "object" &&
      !Array.isArray(a) && !Array.isArray(b)
    ) {
      result[key] = deepMerge(a as Record<string, unknown>, b as Record<string, unknown>);
    } else {
      result[key] = b ?? a;
    }
  }
  return result as T;
}
