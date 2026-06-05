import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/site/PageHeader";
import { db } from "@/lib/db";
import { Send, Calendar, MapPin, Users } from "lucide-react";
import { pageMeta } from "@/lib/seo";

const EVENT_TYPES = [
  "TOURNAMENT", "CAMP", "FESTIVAL", "MASTERCLASS", "MATCH_TOUR",
  "TRAINING_CAMP", "TRYOUT", "SHOWCASE", "CLINIC",
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "club" });
  return pageMeta({ locale, path: "/rfqs", title: t("rfqsPublicTitle"), description: t("rfqsPublicSubtitle") });
}

export default async function PublicRfqListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; country?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const typeFilter = EVENT_TYPES.includes(sp.type as never) ? (sp.type as (typeof EVENT_TYPES)[number]) : null;
  const countryFilter = sp.country && sp.country.length === 2 ? sp.country.toUpperCase() : null;

  const rfqs = await db.rfq.findMany({
    where: {
      status: "OPEN",
      // expiresAt is set on creation; rfqs past it are still shown — a separate
      // cron flips them to EXPIRED. Until then, OPEN is the source of truth.
      ...(typeFilter ? { eventType: typeFilter } : {}),
      ...(countryFilter ? { targetCountries: { has: countryFilter } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, eventType: true, ageGroup: true, format: true,
      targetCountries: true, targetRegion: true,
      dateFrom: true, dateTo: true, durationDays: true,
      createdAt: true,
      club: { select: { name: true, slug: true, countryCode: true, logoUrl: true, isVerified: true } },
    },
  });

  const t = await getTranslations("club");
  const tCat = await getTranslations("categoryHeaders");
  const tNav = await getTranslations("nav");

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

  const chipBase =
    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition";
  const chipOn  = "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]";
  const chipOff = "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]";

  return (
    <>
      <PageHeader
        title={t("rfqsPublicTitle")}
        subtitle={t("rfqsPublicSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("rfqsPublicTitle") }]}
      />

      <Container className="py-10">
        <div className="mb-5 flex flex-wrap gap-2">
          <Link href="/rfqs" className={`${chipBase} ${!typeFilter ? chipOn : chipOff}`}>
            {t("rfqFilterAll")}
          </Link>
          {EVENT_TYPES.map((tp) => (
            <Link
              key={tp}
              href={`/rfqs?type=${tp}`}
              className={`${chipBase} ${typeFilter === tp ? chipOn : chipOff}`}
            >
              {TYPE_L[tp] ?? tp}
            </Link>
          ))}
        </div>

        {rfqs.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center">
            <Send className="mx-auto h-10 w-10 text-[var(--color-pitch-600)]" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{t("rfqsPublicEmptyTitle")}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("rfqsPublicEmptyBody")}</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rfqs.map((r) => {
              const region = r.targetRegion || (r.targetCountries.length > 0 ? r.targetCountries.join(", ") : t("rfqAnywhere"));
              const dateLine = r.dateFrom && r.dateTo
                ? `${new Date(r.dateFrom).toLocaleDateString(locale)} – ${new Date(r.dateTo).toLocaleDateString(locale)}`
                : r.dateFrom
                ? new Date(r.dateFrom).toLocaleDateString(locale)
                : r.durationDays
                ? t("rfqDurationLine", { n: r.durationDays })
                : t("rfqDatesFlexible");
              const summary = [TYPE_L[r.eventType] ?? r.eventType, r.ageGroup, r.format].filter(Boolean).join(" · ");
              return (
                <li key={r.id}>
                  <Link
                    href={`/rfqs/${r.id}`}
                    className="block rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center bg-[var(--color-bg-muted)]"
                        style={r.club.logoUrl ? { backgroundImage: `url(${r.club.logoUrl})` } : undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-pitch-700)]">{r.club.name}</p>
                        <h3 className="mt-0.5 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{summary}</h3>
                        <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{region}</span>
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{dateLine}</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
