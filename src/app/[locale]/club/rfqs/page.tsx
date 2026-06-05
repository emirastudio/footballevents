import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Send, Plus, Calendar, MapPin } from "lucide-react";
import { ClubRfqStatusButton } from "@/components/club/ClubRfqStatusButton";

const STATUS_STYLE: Record<string, string> = {
  OPEN:    "bg-emerald-100 text-emerald-800",
  CLOSED:  "bg-zinc-100 text-zinc-700",
  EXPIRED: "bg-amber-100 text-amber-800",
};

export default async function ClubRfqsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!club) redirect("/onboarding/club");

  const rfqs = await db.rfq.findMany({
    where: { clubId: club.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, status: true, eventType: true, ageGroup: true, format: true,
      targetCountries: true, targetRegion: true,
      dateFrom: true, dateTo: true, durationDays: true,
      createdAt: true, expiresAt: true,
    },
  });

  const t = await getTranslations("club");
  const tCat = await getTranslations("categoryHeaders");

  const TYPE_L: Record<string, string> = {
    TOURNAMENT: tCat("tournaments.title"),
    CAMP: tCat("camps.title"),
    FESTIVAL: tCat("festivals.title"),
    MASTERCLASS: tCat("masterclasses.title"),
    MATCH_TOUR: tCat("match-tours.title"),
    CLINIC: t("rfqTypeClinic"),
    SHOWCASE: tCat("showcases.title"),
    TRAINING_CAMP: tCat("training-camps.title"),
    TRYOUT: tCat("tryouts.title"),
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            {t("rfqListTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("rfqListSubtitle")}</p>
        </div>
        <Link
          href="/club/rfqs/new"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
        >
          <Plus className="h-4 w-4" /> {t("rfqCreate")}
        </Link>
      </header>

      {rfqs.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
          <Send className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
          <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("rfqEmptyTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("rfqEmptyBody")}</p>
          <Link
            href="/club/rfqs/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
          >
            <Plus className="h-4 w-4" /> {t("rfqCreate")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rfqs.map((r) => {
            const region = r.targetRegion || (r.targetCountries.length > 0 ? r.targetCountries.join(", ") : t("rfqAnywhere"));
            const dateLine = r.dateFrom && r.dateTo
              ? `${new Date(r.dateFrom).toLocaleDateString(locale)} – ${new Date(r.dateTo).toLocaleDateString(locale)}`
              : r.dateFrom
              ? new Date(r.dateFrom).toLocaleDateString(locale)
              : r.durationDays
              ? t("rfqDurationLine", { n: r.durationDays })
              : t("rfqDatesFlexible");
            const summary = [TYPE_L[r.eventType] ?? r.eventType, r.ageGroup, r.format]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={r.id}
                className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${r.status !== "OPEN" ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/rfqs/${r.id}`}
                        className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)] hover:underline"
                      >
                        {summary}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_STYLE[r.status] ?? "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {t(`rfqStatus.${r.status}` as never)}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{region}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{dateLine}</span>
                      <span>·</span>
                      <span>{t("rfqPostedAt", { date: new Date(r.createdAt).toLocaleDateString(locale) })}</span>
                    </p>
                  </div>
                  <ClubRfqStatusButton
                    rfqId={r.id}
                    open={r.status === "OPEN"}
                    closeLabel={t("rfqClose")}
                    reopenLabel={t("rfqReopen")}
                    confirmText={t("rfqCloseConfirm")}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
