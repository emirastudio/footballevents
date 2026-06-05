import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Mail, Phone, ChevronLeft, ShieldCheck, Calendar, MapPin, Users, Trophy, Globe2, Wallet, Clock } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const rfq = await db.rfq.findUnique({
    where: { id },
    select: { eventType: true, ageGroup: true, targetRegion: true, targetCountries: true, club: { select: { name: true } } },
  });
  if (!rfq) return {};
  const t = await getTranslations({ locale, namespace: "club" });
  const title = `${rfq.club.name} — ${rfq.eventType}${rfq.ageGroup ? ` ${rfq.ageGroup}` : ""}`;
  const region = rfq.targetRegion || rfq.targetCountries.join(", ") || "Europe";
  return pageMeta({
    locale,
    path: `/rfqs/${id}`,
    title,
    description: `${title} · ${region} · ${t("rfqsPublicTitle")}`,
  });
}

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const rfq = await db.rfq.findUnique({
    where: { id },
    include: {
      club: {
        include: {
          country: { select: { code: true, nameEn: true, flagEmoji: true } },
          city: { select: { nameEn: true } },
        },
      },
      team: { select: { name: true, ageGroup: true, format: true, gender: true, skillLevel: true } },
    },
  });
  if (!rfq) notFound();

  const session = await auth();
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
  const STATUS_STYLE: Record<string, string> = {
    OPEN:    "bg-emerald-100 text-emerald-800",
    CLOSED:  "bg-zinc-100 text-zinc-700",
    EXPIRED: "bg-amber-100 text-amber-800",
  };

  const region = rfq.targetRegion || (rfq.targetCountries.length > 0 ? rfq.targetCountries.join(", ") : t("rfqAnywhere"));
  const dateLine = rfq.dateFrom && rfq.dateTo
    ? `${new Date(rfq.dateFrom).toLocaleDateString(locale)} – ${new Date(rfq.dateTo).toLocaleDateString(locale)}`
    : rfq.dateFrom
    ? new Date(rfq.dateFrom).toLocaleDateString(locale)
    : t("rfqDatesFlexible");
  const summary = [TYPE_L[rfq.eventType] ?? rfq.eventType, rfq.ageGroup, rfq.format].filter(Boolean).join(" · ");
  const budget = rfq.budgetPerTeamCents
    ? `${Math.round(rfq.budgetPerTeamCents / 100)} ${rfq.currency ?? "EUR"} ${t("rfqPerTeam")}`
    : null;

  return (
    <Container className="py-10">
      <Link href="/rfqs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-4 w-4" /> {t("rfqsBackToList")}
      </Link>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Club header */}
        <div className="flex items-start gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div
            className="h-14 w-14 shrink-0 rounded-full bg-cover bg-center bg-[var(--color-bg-muted)]"
            style={rfq.club.logoUrl ? { backgroundImage: `url(${rfq.club.logoUrl})` } : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/club/${rfq.club.slug}`}
                className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)] hover:underline"
              >
                {rfq.club.name}
              </Link>
              {rfq.club.isVerified && (
                <ShieldCheck className="h-5 w-5 text-[var(--color-pitch-600)]" aria-label="Verified" />
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[rfq.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                {t(`rfqStatus.${rfq.status}` as never)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {rfq.club.country.flagEmoji} {rfq.club.country.nameEn}{rfq.club.city?.nameEn ? ` · ${rfq.club.city.nameEn}` : ""}
            </p>
          </div>
        </div>

        {/* What's sought */}
        <article className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            {summary}
          </h1>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailRow icon={MapPin} label={t("rfqDetailRegion")} value={region} />
            <DetailRow icon={Calendar} label={t("rfqDetailDates")} value={dateLine} />
            {rfq.durationDays && (
              <DetailRow icon={Clock} label={t("rfqDetailDuration")} value={t("rfqDurationLine", { n: rfq.durationDays })} />
            )}
            {rfq.team && (
              <DetailRow icon={Users} label={t("rfqDetailTeam")} value={`${rfq.team.name} (${rfq.team.ageGroup}${rfq.team.format ? ` · ${rfq.team.format}` : ""})`} />
            )}
            {rfq.gender && (
              <DetailRow
                icon={Users}
                label={t("teamGender")}
                value={rfq.gender === "MALE" ? t("genderMale") : rfq.gender === "FEMALE" ? t("genderFemale") : t("genderMixed")}
              />
            )}
            {rfq.skillLevel && (
              <DetailRow
                icon={Trophy}
                label={t("teamSkillLevel")}
                value={
                  rfq.skillLevel === "AMATEUR" ? t("skillAmateur") :
                  rfq.skillLevel === "SEMI_PRO" ? t("skillSemi") :
                  rfq.skillLevel === "PROFESSIONAL" ? t("skillPro") :
                  t("skillAll")
                }
              />
            )}
            {budget && <DetailRow icon={Wallet} label={t("rfqDetailBudget")} value={budget} />}
            {rfq.targetCountries.length > 0 && (
              <DetailRow icon={Globe2} label={t("rfqDetailCountries")} value={rfq.targetCountries.join(", ")} />
            )}
          </dl>

          {rfq.comment && (
            <div className="mt-6 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                {t("rfqDetailComment")}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--color-foreground)]">{rfq.comment}</p>
            </div>
          )}

          <p className="mt-6 text-xs text-[var(--color-muted)]">
            {t("rfqPostedAt", { date: new Date(rfq.createdAt).toLocaleDateString(locale) })}
            {rfq.expiresAt && rfq.status === "OPEN" && (
              <> · {t("rfqExpiresAt", { date: new Date(rfq.expiresAt).toLocaleDateString(locale) })}</>
            )}
          </p>
        </article>

        {/* Contact — gated behind login so we don't expose contact emails to scrapers. */}
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] p-6">
          <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
            {t("rfqContactTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("rfqContactSubtitle")}</p>

          {!session?.user?.id ? (
            <Link
              href={`/sign-in?next=/rfqs/${rfq.id}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
            >
              {t("rfqContactSignIn")}
            </Link>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {rfq.club.email && (
                <a
                  href={`mailto:${rfq.club.email}?subject=${encodeURIComponent(`Re: ${summary}`)}`}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
                >
                  <Mail className="h-4 w-4" /> {rfq.club.email}
                </a>
              )}
              {rfq.club.phone && (
                <a
                  href={`tel:${rfq.club.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)]"
                >
                  <Phone className="h-4 w-4" /> {rfq.club.phone}
                </a>
              )}
              {!rfq.club.email && !rfq.club.phone && (
                <Link
                  href={`/club/${rfq.club.slug}`}
                  className="text-sm font-semibold text-[var(--color-pitch-700)] hover:underline"
                >
                  {t("rfqContactViaProfile")} →
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}

function DetailRow({
  icon: Icon, label, value,
}: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-0.5 text-sm text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}
