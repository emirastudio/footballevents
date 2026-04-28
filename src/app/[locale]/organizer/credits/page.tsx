import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Gift, Sparkles, Star } from "lucide-react";
import { redeemBoostCredit } from "@/app/actions/billing";

export default async function OrganizerCreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer.credits");
  const tCommon = await getTranslations("common");

  const [credits, events] = await Promise.all([
    db.boostCredit.findMany({
      where: { organizerId: organizer.id },
      orderBy: [{ redeemedAt: "asc" }, { purchasedAt: "desc" }],
    }),
    db.event.findMany({
      where: { organizerId: organizer.id, status: "PUBLISHED" },
      include: { translations: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const unused = credits.filter((c) => !c.redeemedAt);
  const used = credits.filter((c) => c.redeemedAt);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("subtitle")}</p>

      <section className="mt-8">
        <h2 className="mb-3 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
          {t("availableTitle")} <span className="text-[var(--color-muted)]">({unused.length})</span>
        </h2>
        {unused.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
            {t("emptyAvailable")}{" "}
            <Link href="/pricing" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
              {t("buyBundleCta")}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unused.map((c) => (
              <li key={c.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    c.tier === "PREMIUM"
                      ? "bg-[var(--color-premium)]/15 text-[var(--color-premium)]"
                      : c.tier === "FEATURED"
                      ? "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                      : "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]"
                  }`}>
                    {c.tier === "PREMIUM" ? <Star className="h-3 w-3 fill-current" /> : c.tier === "FEATURED" ? <Sparkles className="h-3 w-3" /> : <Gift className="h-3 w-3" />}
                    {c.tier}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">{c.purchasedAt.toISOString().slice(0, 10)}</span>
                </div>
                {events.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)]">{t("needPublishedEvent")}</p>
                ) : (
                  <form action={redeemBoostCredit} className="flex gap-2">
                    <input type="hidden" name="creditId" value={c.id} />
                    <select name="eventId" className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1.5 text-xs">
                      {events.map((ev) => {
                        const en = ev.translations.find((tr) => tr.locale === "en") ?? ev.translations[0];
                        return <option key={ev.id} value={ev.id}>{en?.title ?? ev.slug}</option>;
                      })}
                    </select>
                    <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]">
                      {t("apply")}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {used.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
            {t("historyTitle")} <span className="text-[var(--color-muted)]">({used.length})</span>
          </h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {used.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">{c.tier}</span>
                <span className="text-xs text-[var(--color-muted)]">{tCommon("used")} {c.redeemedAt!.toISOString().slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
