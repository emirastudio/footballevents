import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { Check, Star, ChevronRight, Megaphone, Ticket } from "lucide-react";
import { PricingTierToggle } from "@/components/pricing/PricingTierToggle";
import { startBundleCheckout } from "@/app/actions/billing";

type Tier = "free" | "pro" | "premium" | "enterprise";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const tNav = await getTranslations("nav");

  const tiers: { key: Tier; popular?: boolean; cta: string; ctaLabel: string }[] = [
    { key: "free",       cta: "/onboarding/organizer", ctaLabel: t("ctaButton") },
    { key: "pro",        cta: "/onboarding/organizer?plan=pro", ctaLabel: t("ctaButton"), popular: true },
    { key: "premium",    cta: "/onboarding/organizer?plan=premium", ctaLabel: t("ctaButton") },
    { key: "enterprise", cta: "mailto:sales@footballevents.eu",     ctaLabel: t("ctaContact") },
  ];

  // Comparison rows (group → row → values per tier)
  const Y = t("yes"), N = t("no");
  const groups: { key: string; rows: { row: string; values: [string, string, string, string] }[] }[] = [
    {
      key: "limits",
      rows: [
        { row: "events", values: [t("values.free_events"), t("values.pro_events"), t("values.premium_events"), t("values.enterprise_events")] },
      ],
    },
    {
      key: "page",
      rows: [
        { row: "logo",          values: [Y, Y, Y, Y] },
        { row: "gallery",       values: [Y, Y, Y, Y] },
        { row: "programme",     values: [Y, Y, Y, Y] },
        { row: "included",      values: [N, Y, Y, Y] },
        { row: "faq",           values: [N, Y, Y, Y] },
        { row: "video",         values: [N, N, Y, Y] },
        { row: "customCta",     values: [N, N, Y, Y] },
      ],
    },
    {
      key: "engagement",
      rows: [
        { row: "platformApply", values: [N, Y, Y, Y] },
        { row: "chat",          values: [N, Y, Y, Y] },
        { row: "fullSocials",   values: [t("values.websiteOnly"), Y, Y, Y] },
        { row: "verified",      values: [N, Y, Y, Y] },
        { row: "followers",     values: [N, Y, Y, Y] },
      ],
    },
    {
      key: "growth",
      rows: [
        { row: "featured",        values: [N, N, Y, Y] },
        { row: "boostsIncluded",  values: [t("values.boostsFree"), t("values.boostsPro"), t("values.boostsPremium"), t("values.boostsEnterprise")] },
        { row: "boostDiscount",   values: ["—", t("values.discountPro"), t("values.discountPremium"), t("values.discountEnterprise")] },
        { row: "noCompetitorAds", values: [N, Y, Y, Y] },
        { row: "api",             values: [N, t("values.api_pro"), t("values.api_premium"), t("values.api_enterprise")] },
        { row: "whiteLabel",      values: [N, N, N, Y] },
      ],
    },
    {
      key: "support",
      rows: [
        { row: "moderation", values: [t("values.moderation_free"), t("values.moderation_pro"), t("values.moderation_premium"), t("values.moderation_enterprise")] },
        { row: "manager",    values: [N, N, t("values.manager_premium"), t("values.manager_enterprise")] },
      ],
    },
  ];

  const boosts = [
    t.raw("boostBasic"),
    t.raw("boostFeatured"),
    t.raw("boostPremium"),
    { ...t.raw("boostBundle1"), kind: "bundle31" },
    { ...t.raw("boostBundle2"), kind: "bundle52" },
  ] as { name: string; price: string; desc: string; kind?: string }[];

  const ads = t.raw("adsList") as { label: string; from: string }[];
  const ticketing = t.raw("ticketingRows") as { tier: string; fee: string }[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];

  const monthly = {
    free: t("tierPrice.free.monthly"),
    pro: t("tierPrice.pro.monthly"),
    premium: t("tierPrice.premium.monthly"),
    enterprise: t("tierPrice.enterprise.monthly"),
  };
  const annual = {
    free: t("tierPrice.free.annual"),
    pro: t("tierPrice.pro.annual"),
    premium: t("tierPrice.premium.annual"),
    enterprise: t("tierPrice.enterprise.annual"),
  };
  const annualEq = {
    free: t("tierPrice.free.annualEq"),
    pro: t("tierPrice.pro.annualEq"),
    premium: t("tierPrice.premium.annualEq"),
    enterprise: t("tierPrice.enterprise.annualEq"),
  };

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: "Pricing" }]}
      />

      <Container className="py-10">
        <PricingTierToggle
          monthlyLabel={t("toggleMonthly")}
          annualLabel={t("toggleAnnual")}
          billedMonthlyLabel={t("billedMonthly")}
          billedAnnuallyLabel={t("billedAnnually")}
          tiers={tiers.map((tier) => ({
            key: tier.key,
            name: t(`tiers.${tier.key}.name`),
            tagline: t(`tiers.${tier.key}.tagline`),
            popular: !!tier.popular,
            popularLabel: t("popular"),
            monthly: monthly[tier.key],
            annual: annual[tier.key],
            annualEq: annualEq[tier.key],
            ctaHref: tier.cta,
            ctaLabel: tier.ctaLabel,
          }))}
          monthlySuffix={t("monthly")}
          annualSuffix={t("annual")}
        />

        {/* Comparison table */}
        <section className="mt-16">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("compareTitle")}</h2>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("feature")}</th>
                  {tiers.map((tier) => (
                    <th key={tier.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      {t(`tiers.${tier.key}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <>
                    <tr key={`head-${g.key}`} className="border-b border-[var(--color-border)] bg-[var(--color-pitch-50)]/50">
                      <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                        {t(`groups.${g.key}`)}
                      </td>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={`${g.key}-${r.row}`} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-4 py-3 text-[var(--color-foreground)]">{t(`rows.${r.row}`)}</td>
                        {r.values.map((v, i) => (
                          <td key={i} className="px-4 py-3 text-[var(--color-muted-strong)]">
                            {v === Y ? <Check className="h-4 w-4 text-[var(--color-pitch-600)]" /> : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Boosts */}
        <section className="mt-16">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("boostTitle")}</h2>
            <p className="mt-1 text-[var(--color-muted-strong)]">{t("boostSubtitle")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {boosts.map((b) => (
              <div key={b.name} className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{b.name}</h3>
                <div className="mt-2 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{b.price}</div>
                <p className="mt-2 flex-1 text-xs text-[var(--color-muted-strong)]">{b.desc}</p>
                {b.kind && (
                  <form action={startBundleCheckout} className="mt-3">
                    <input type="hidden" name="kind" value={b.kind} />
                    <button type="submit" className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-2 text-xs font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]">
                      {t("bundleBuyCta")}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Advertising */}
        <section className="mt-16">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-pitch-50)] to-[var(--color-surface)] p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                  <Megaphone className="h-3.5 w-3.5" /> Advertising
                </div>
                <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("adsTitle")}</h2>
                <p className="mt-1 max-w-xl text-[var(--color-muted-strong)]">{t("adsSubtitle")}</p>
              </div>
              <Button asChild variant="primary" size="lg">
                <Link href="mailto:ads@footballevents.eu">
                  {t("adsCta")} <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ads.map((a) => (
                <li key={a.label} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm">
                  <span className="text-[var(--color-foreground)]">{a.label}</span>
                  <span className="font-semibold text-[var(--color-pitch-700)]">{a.from}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ticketing teaser — temporarily hidden until v3 launch (organizer feedback) */}
        {false && (
          <section className="mt-16">
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]">
                  <Ticket className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{t("ticketingTitle")}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("ticketingSubtitle")}</p>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-4">
                    {ticketing.map((row) => (
                      <li key={row.tier} className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-2 text-xs">
                        <span className="font-semibold text-[var(--color-foreground)]">{row.tier}:</span>{" "}
                        <span className="text-[var(--color-muted-strong)]">{row.fee}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("faqTitle")}</h2>
          <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {faqs.map((f, i) => (
              <details key={i} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--color-foreground)]">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
