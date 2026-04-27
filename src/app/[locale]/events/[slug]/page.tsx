import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
import {
  MapPin, Calendar, Users, Trophy, Tag, Star, ShieldCheck,
  ChevronRight, Clock, Building2, MessageSquare, Check, X as XIcon,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";
export async function generateStaticParams() { return []; }

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const t       = await getTranslations("events.detail");
  const tNav    = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const organizer = await getOrganizerBySlug(event.organizerSlug);
  const venue     = event.venueSlug ? await getVenueBySlug(event.venueSlug) : undefined;
  const country   = getCountry(event.countryCode);
  const reviews   = await getReviewsByEvent(event.id);
  const sameCategory = await getEventsByCategory(event.categorySlug);
  const similar = sameCategory.filter((e) => e.id !== event.id).slice(0, 4);

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"),
  };

  return (
    <>
      {/* Hero with cover */}
      <section className="relative">
        <div
          className="relative h-[44vh] min-h-[360px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${event.coverUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <Container className="relative flex h-full flex-col justify-end pb-8">
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-white/80">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/events" className="hover:text-white">{tNav("events")}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-white">{event.title}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
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
              <Badge variant="neutral" className="bg-white/15 text-white border-white/20 backdrop-blur">
                <MapPin className="h-3 w-3" /> {country?.flag} {event.city}
              </Badge>
            </div>
            <div className="mt-3 flex items-end gap-4">
              {event.logoUrl && (
                <div
                  className="hidden h-20 w-20 shrink-0 rounded-[var(--radius-lg)] border-4 border-white/90 bg-white bg-cover bg-center shadow-[var(--shadow-md)] sm:block sm:h-24 sm:w-24"
                  style={{ backgroundImage: `url(${event.logoUrl})` }}
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <h1 className="max-w-3xl text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold text-white drop-shadow-md sm:text-5xl">
                  {event.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">{event.shortDescription}</p>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div>
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

            <h2 className="mb-3 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("about")}
            </h2>
            <p className="text-pretty leading-relaxed text-[var(--color-muted-strong)]">{event.description}</p>

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
                    className="aspect-square overflow-hidden rounded-[var(--radius-md)] bg-cover bg-center shadow-[var(--shadow-xs)]"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
            )}

            {/* Reviews */}
            <section className="mt-12">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {t("reviews")}
                </h2>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[var(--color-premium)] text-[var(--color-premium)]" />
                  <span className="font-semibold text-[var(--color-foreground)]">{event.rating}</span>
                  <span className="text-sm text-[var(--color-muted)]">({event.reviewsCount})</span>
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
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("price")}</div>
              <div className="mt-1 font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                {event.isFree ? tCommon("free") : formatPrice(event.priceFrom, event.currency, locale)}
                {!event.isFree && event.priceTo && (
                  <span className="text-sm font-medium text-[var(--color-muted)]"> – {formatPrice(event.priceTo, event.currency, locale)}</span>
                )}
              </div>

              <Button variant="accent" size="lg" className="mt-4 w-full" asChild>
                <Link href={`/events/${event.slug}/apply`}>{t("applyNow")}</Link>
              </Button>
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
                  <div
                    className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center"
                    style={{ backgroundImage: `url(${organizer.logoUrl})` }}
                  />
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
