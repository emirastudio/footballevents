import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CoverExpand } from "@/components/site/CoverExpand";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/lib/mock-data";
import {
  getEventBySlug, getEventSlugs, getEventsByCategory,
  getOrganizerBySlug, getVenueBySlug, getReviewsByEvent,
} from "@/lib/queries";
import { formatDateRange, formatPrice } from "@/lib/format";
import { EventCard } from "@/components/cards/EventCard";
import { SocialLinks } from "@/components/site/SocialLinks";
import { ShareRow } from "@/components/site/ShareRow";
import { FollowOrganizerButton, SaveEventButton } from "@/components/site/FollowButton";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { tierAllows } from "@/lib/tier";
import { getEventCapacity } from "@/lib/event-capacity";
import { parsePartners, type Partner } from "@/lib/partners";
import { RichText } from "@/components/ui/RichText";
import { MerchPromoBanner } from "@/components/site/MerchPromoBanner";
import { CapacityWidget } from "@/components/cards/CapacityWidget";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import {
  MapPin, Calendar, Users, Trophy, Tag, Star, ShieldCheck,
  ChevronRight, Clock, Building2, MessageSquare, Check, X as XIcon,
} from "lucide-react";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

export const dynamic = "force-dynamic";
export async function generateStaticParams() { return []; }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const event = await getEventBySlug(slug, locale);
  if (!event) return {};
  const country = getCountry(event.countryCode);
  const desc = stripHtml(event.description || event.shortDescription || "")
    || [event.city, country?.name, event.startDate ? new Date(event.startDate).toISOString().slice(0, 10) : ""].filter(Boolean).join(" · ");
  const url = `${SITE_URL}/${locale}/events/${event.slug}`;
  const title = `${event.title} | ${event.city || country?.name || ""}`.replace(/ \| $/, "");
  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/events/${event.slug}`])
      ),
    },
    // og:image / twitter:image come from opengraph-image.tsx (a generated
    // 1200×630 card built from the cover — reliably renders in link previews,
    // unlike the raw multi-MB cover which scrapers like Telegram skip).
    openGraph: {
      type: "website",
      url,
      title,
      description: desc,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const event = await getEventBySlug(slug, locale);
  if (!event) notFound();

  const t       = await getTranslations("events.detail");
  const tNav    = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const organizer = await getOrganizerBySlug(event.organizerSlug);
  const venue     = event.venueSlug ? await getVenueBySlug(event.venueSlug) : undefined;
  const country   = getCountry(event.countryCode);
  const reviews   = await getReviewsByEvent(event.id);
  const sameCategory = await getEventsByCategory(event.categorySlug, locale);

  const eventRow = await db.event.findUnique({
    where: { id: event.id },
    select: { maxParticipants: true, partners: true },
  });
  const capacity = await getEventCapacity(event.id, eventRow?.maxParticipants ?? null);
  const partners = parsePartners(eventRow?.partners);
  const coorganizers = partners.filter((p) => p.kind === "coorganizer");
  const partnersOnly = partners.filter((p) => p.kind === "partner");

  // Fire-and-forget: bump the public view counter for the organizer's analytics.
  // Atomic Prisma increment, no awaiting; a failed bump never blocks the page.
  db.event.update({ where: { id: event.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});

  const capacityLabels = {
    joined:       t("capacity.joined"),
    spotsLeft:    t("capacity.spotsLeft"),
    full:         t("capacity.full"),
    waitlistOpen: t("capacity.waitlistOpen"),
    onWaitlist:   t("capacity.onWaitlist"),
    capacityFmt:  t("capacity.capacityFmt"),
  };
  const similar = sameCategory.filter((e) => e.id !== event.id).slice(0, 4);

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"),
  };

  return (
    <>
      {/* Cover — taller, image stays visible; full view via the expand button */}
      <section className="relative">
        <div
          className="relative h-[58vh] min-h-[460px] w-full bg-cover bg-center bg-[var(--color-navy-900)]"
          style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})` } : undefined}
        >
          {/* light top gradient only, so the poster stays readable */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
          <Container className="relative pt-5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/85 drop-shadow">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/events" className="hover:text-white">{tNav("events")}</Link>
              {event.countryCode && country?.name && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Link
                    href={`/events/country/${event.countryCode.toLowerCase()}`}
                    className="hover:text-white"
                  >
                    {country.name}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-white">{event.title}</span>
            </nav>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {event.isPremium && (
                <Badge variant="premium" className="bg-[var(--color-premium)] text-white border-transparent">
                  <Star className="h-3 w-3 fill-current" /> {tCommon("premium")}
                </Badge>
              )}
              {event.isFeatured && (
                <Badge variant="accent" className="bg-[var(--color-pitch-500)] text-white border-transparent">
                  {tCommon("featured")}
                </Badge>
              )}
              {event.countryCode ? (
                <Link
                  href={`/events/country/${event.countryCode.toLowerCase()}`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-xs text-white backdrop-blur transition hover:bg-white/25"
                >
                  <MapPin className="h-3 w-3" /> {country?.flag} {event.city}
                </Link>
              ) : (
                <Badge variant="neutral" className="bg-white/15 text-white border-white/20 backdrop-blur">
                  <MapPin className="h-3 w-3" /> {country?.flag} {event.city}
                </Badge>
              )}
            </div>
          </Container>
          {event.coverUrl && (
            <div className="absolute bottom-16 right-4 z-10 sm:bottom-4">
              <CoverExpand src={event.coverUrl} label={t("expandCover")} />
            </div>
          )}
        </div>
      </section>

      {/* Title card on white — readable name + logo + short description */}
      <Container className="relative z-10 -mt-12">
        <div className="flex items-start gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6">
          {event.logoUrl && (
            <div
              className="hidden h-20 w-20 shrink-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white bg-contain bg-center bg-no-repeat shadow-[var(--shadow-xs)] sm:block sm:h-24 sm:w-24"
              style={{ backgroundImage: `url(${event.logoUrl})` }}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <h1 className="text-balance font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-4xl">
              {event.title}
            </h1>
            {event.shortDescription && (
              <p className="mt-2 text-sm text-[var(--color-muted-strong)] sm:text-base">{event.shortDescription}</p>
            )}
          </div>
        </div>
      </Container>

      <Container className="py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              "sport": "Soccer",
              "name": event.title,
              "description": stripHtml(event.description || event.shortDescription || ""),
              "startDate": event.startDate || undefined,
              "endDate": event.endDate || undefined,
              "url": `${SITE_URL}/${locale}/events/${event.slug}`,
              "image": [event.coverUrl, event.logoUrl, ...(event.galleryUrls ?? [])].filter(Boolean),
              "location": {
                "@type": "Place",
                "name": venue?.name || event.city || country?.name,
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": venue?.address || undefined,
                  "addressLocality": event.city || undefined,
                  "addressCountry": event.countryCode || undefined,
                },
              },
              "organizer": {
                "@type": "Organization",
                "name": organizer?.name || undefined,
                "url": organizer ? `${SITE_URL}/${locale}/org/${organizer.slug}` : undefined,
                "logo": organizer?.logoUrl || undefined,
              },
              ...(event.priceFrom != null || event.isFree
                ? {
                    "offers": {
                      "@type": "Offer",
                      "price": event.isFree ? 0 : event.priceFrom,
                      "priceCurrency": event.currency || "EUR",
                      "availability": capacity.isFull
                        ? "https://schema.org/SoldOut"
                        : "https://schema.org/InStock",
                      "url": `${SITE_URL}/${locale}/events/${event.slug}/apply`,
                      "validFrom": event.startDate || undefined,
                    },
                  }
                : {}),
              ...(event.reviewsCount > 0
                ? {
                    "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": event.rating,
                      "reviewCount": event.reviewsCount,
                      "bestRating": 5,
                      "worstRating": 1,
                    },
                  }
                : {}),
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
              "inLanguage": locale,
            }),
          }}
        />
        <BreadcrumbJsonLd
          items={[
            { name: "Home", url: `${SITE_URL}/${locale}` },
            { name: tNav("events"), url: `${SITE_URL}/${locale}/events` },
            ...(country?.name && event.countryCode
              ? [{ name: country.name, url: `${SITE_URL}/${locale}/events/country/${event.countryCode.toLowerCase()}` }]
              : []),
            { name: event.title, url: `${SITE_URL}/${locale}/events/${event.slug}` },
          ]}
        />
        {event.faq && event.faq.length > 0 && tierAllows(organizer?.subscriptionTier, "faq") && (
          <FaqJsonLd items={event.faq} />
        )}
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Main column — on mobile it comes AFTER the apply sidebar (order-2) */}
          <div className="order-2 min-w-0 lg:order-1">
            {/* Quick details strip */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Calendar, label: t("dates"),     value: formatDateRange(event.startDate, event.endDate, locale) },
                { icon: Users,    label: t("ageGroups"), value: event.ageGroups.join(", ") },
                { icon: Trophy,   label: t("format"),    value: event.format ?? "—" },
                { icon: Tag,      label: t("price"),     value: event.isFree ? tCommon("free") : `${tCommon("from")} ${formatPrice(event.priceFrom, event.currency, locale)}` },
              ].map((d) => (
                <div key={d.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                  <d.icon className="mb-1.5 h-4 w-4 text-[var(--color-pitch-600)]" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{d.label}</div>
                  <div className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)]">{d.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {t("about")}
              </h2>
              {event.titleFallback && event.titleLocale && (
                <span
                  className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]"
                  title={t("translatedFromHint")}
                >
                  {event.titleLocale}
                </span>
              )}
            </div>
            <RichText html={event.description ?? ""} className="text-[var(--color-muted-strong)]" />

            {/* Save + Share row */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <SaveEventButton
                eventId={event.id}
                savesCount={event.savesCount}
                saveLabel={t("save")}
                savedLabel={t("saved")}
                returnTo={`/${locale}/events/${event.slug}`}
              />
              <ShareRow
                url={`${SITE_URL}/${locale}/events/${event.slug}`}
                title={event.title}
                label={t("share")}
              />
            </div>

            {/* Programme */}
            {event.program && event.program.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {t("program")}
                </h2>
                <ol className="space-y-3">
                  {event.program.map((p) => (
                    <li
                      key={p.day}
                      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="rounded-full bg-[var(--color-pitch-50)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                          {t("day")} {p.day}
                        </span>
                        <h3 className="font-semibold text-[var(--color-foreground)]">{p.title}</h3>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-muted-strong)]">
                        {p.items.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-pitch-500)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Included / Not included — Pro+ feature */}
            {tierAllows(organizer?.subscriptionTier, "included") && (event.included?.length || event.notIncluded?.length) && (
              <section className="mt-12 grid gap-5 sm:grid-cols-2">
                {event.included && event.included.length > 0 && (
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <h3 className="mb-3 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
                      {t("included")}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {event.included.map((i) => (
                        <li key={i} className="flex gap-2 text-[var(--color-muted-strong)]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {event.notIncluded && event.notIncluded.length > 0 && (
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <h3 className="mb-3 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
                      {t("notIncluded")}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {event.notIncluded.map((i) => (
                        <li key={i} className="flex gap-2 text-[var(--color-muted)]">
                          <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* FAQ — Pro+ feature */}
            {tierAllows(organizer?.subscriptionTier, "faq") && event.faq && event.faq.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {t("faq")}
                </h2>
                <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  {event.faq.map((item, i) => (
                    <details key={i} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--color-foreground)]">
                        {item.q}
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {event.galleryUrls.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {event.galleryUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-xs)]"
                  >
                    <Image
                      src={url}
                      alt={`${event.title} — gallery ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {t("reviews")}
                </h2>
                <div className="flex items-center gap-3">
                  {event.reviewsCount > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-[var(--color-premium)] text-[var(--color-premium)]" />
                      <span className="font-semibold text-[var(--color-foreground)]">{event.rating.toFixed(1)}</span>
                      <span className="text-sm text-[var(--color-muted)]">({event.reviewsCount})</span>
                    </div>
                  ) : null}
                  <Link
                    href={`/events/${event.slug}/review`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
                  >
                    {t("writeReview")}
                  </Link>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No reviews yet.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-pitch-50)] text-sm font-bold text-[var(--color-pitch-700)]">
                            {r.authorName.split(" ").map(s => s[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-foreground)]">{r.authorName}</div>
                            <div className="text-xs text-[var(--color-muted)]">{r.createdAt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-[var(--color-premium)] text-[var(--color-premium)]" : "text-[var(--color-border-strong)]"}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <h4 className="mt-3 font-semibold text-[var(--color-foreground)]">{r.title}</h4>}
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-strong)]">{r.body}</p>
                      {r.organizerReply && (
                        <div className="mt-4 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3.5">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                            <ShieldCheck className="h-3.5 w-3.5" /> {t("organizerReply")}
                          </div>
                          <p className="text-sm text-[var(--color-foreground)]">{r.organizerReply}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Fan merch promo (Goalbazza) */}
            <div className="mt-12">
              <MerchPromoBanner />
            </div>

            {/* Similar */}
            {similar.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-5 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {t("similarEvents")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {similar.map((e) => (
                    <EventCard key={e.id} event={e} locale={locale} size="sm" labels={cardLabels} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <CapacityWidget snap={capacity} labels={capacityLabels} />
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("price")}</div>
              <div className="mt-1 font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                {event.isFree ? tCommon("free") : formatPrice(event.priceFrom, event.currency, locale)}
                {!event.isFree && event.priceTo && (
                  <span className="text-sm font-medium text-[var(--color-muted)]"> – {formatPrice(event.priceTo, event.currency, locale)}</span>
                )}
              </div>

              {event.acceptsBookings !== false ? (
                <Button variant="accent" size="lg" className="mt-4 w-full" asChild>
                  <Link href={`/events/${event.slug}/apply`}>
                    {capacity.isFull ? t("joinWaitlist") : t("applyNow")}
                  </Link>
                </Button>
              ) : event.externalUrl ? (
                <Button variant="accent" size="lg" className="mt-4 w-full" asChild>
                  <a href={event.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {t("registerExternal")}
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" size="lg" className="mt-2 w-full" asChild>
                <Link href={`/events/${event.slug}/contact`}>
                  <MessageSquare className="h-4 w-4" /> {t("contactOrganizer")}
                </Link>
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted)]">
                <Clock className="h-3.5 w-3.5" />
                {t("ticketsComingSoon")}
              </div>
            </div>

            {organizer && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("organizer")}</div>
                <Link
                  href={`/org/${organizer.slug}`}
                  className="mt-3 flex items-center gap-3 transition-colors hover:text-[var(--color-pitch-700)]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-md)]">
                    {organizer.logoUrl && (
                      <Image src={organizer.logoUrl} alt={organizer.name} fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">{organizer.name}</span>
                      {organizer.isVerified && <VerifiedBadge label={tCommon("verified")} className="h-4 w-4" />}
                    </div>
                    {typeof organizer.followersCount === "number" && organizer.followersCount > 0 && (
                      <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                        <span className="font-semibold text-[var(--color-foreground)]">{organizer.followersCount.toLocaleString()}</span>{" "}
                        {t("followers")}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="mt-4">
                  <FollowOrganizerButton
                    organizerId={organizer.id}
                    followersCount={organizer.followersCount}
                    followLabel={t("follow")}
                    followingLabel={t("following")}
                    returnTo={`/${locale}/events/${event.slug}`}
                  />
                </div>

                {(organizer.socials || organizer.website) && (
                  <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                    <SocialLinks
                      website={organizer.website}
                      socials={organizer.socials}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )}

            {partners.length > 0 && (
              <PartnersSidebar coorganizers={coorganizers} partners={partnersOnly} locale={locale} />
            )}

            {venue && (
              <Link
                href={`/stadiums/${venue.slug}`}
                className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-pitch-300)]"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("venue")}</div>
                <div className="mt-2 flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-pitch-600)]" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">{venue.name}</div>
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">{venue.address}</div>
                  </div>
                </div>
              </Link>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}

const PARTNER_HEADINGS: Record<string, { co: string; partners: string }> = {
  en: { co: "Co-organizers", partners: "Partners" },
  ru: { co: "Со-организаторы", partners: "Партнёры" },
  de: { co: "Co-Organisatoren", partners: "Partner" },
  es: { co: "Coorganizadores", partners: "Socios" },
};

// Compact sidebar card (sits with the Organizer / Venue cards on the right).
function PartnersSidebar({ coorganizers, partners, locale }: { coorganizers: Partner[]; partners: Partner[]; locale: string }) {
  const h = PARTNER_HEADINGS[locale] ?? PARTNER_HEADINGS.en;
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      {coorganizers.length > 0 && <PartnerGroup title={h.co} items={coorganizers} />}
      {partners.length > 0 && <div className={coorganizers.length > 0 ? "mt-4" : ""}><PartnerGroup title={h.partners} items={partners} /></div>}
    </div>
  );
}

function PartnerGroup({ title, items }: { title: string; items: Partner[] }) {
  const isInternal = (u?: string) => !!u && u.startsWith("/");
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((p, i) => {
          const inner = (
            <>
              {p.logoUrl ? (
                <div
                  className="h-9 w-9 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${p.logoUrl})` }}
                />
              ) : (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-xs font-bold text-[var(--color-pitch-700)]">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">{p.name}</span>
            </>
          );
          const cls = "flex items-center gap-2.5 transition-colors";
          if (!p.url) return <div key={i} className={cls}>{inner}</div>;
          return isInternal(p.url) ? (
            <Link key={i} href={p.url} className={`${cls} hover:text-[var(--color-pitch-700)]`}>{inner}</Link>
          ) : (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer nofollow" className={`${cls} hover:text-[var(--color-pitch-700)]`}>{inner}</a>
          );
        })}
      </div>
    </div>
  );
}
