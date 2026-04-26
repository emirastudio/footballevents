import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ChevronRight, MapPin, Star, ShieldCheck, Mail, Calendar } from "lucide-react";
import { SocialLinks } from "@/components/site/SocialLinks";
import { FollowOrganizerButton } from "@/components/site/FollowButton";
import { getCountry } from "@/lib/mock-data";
import { getOrganizerBySlug, getOrganizerSlugs, getEventsByOrganizer } from "@/lib/queries";
import { EventCard } from "@/components/cards/EventCard";

export const revalidate = 3600;
export async function generateStaticParams() { return []; }

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const o = await getOrganizerBySlug(slug);
  if (!o) notFound();

  const t       = await getTranslations("organizers.detail");
  const tNav    = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const country = getCountry(o.countryCode);
  const events  = await getEventsByOrganizer(o.slug);

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"),
  };

  return (
    <>
      {/* Cover hero */}
      <section className="relative">
        <div
          className="relative h-[36vh] min-h-[280px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${o.coverUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <Container className="relative flex h-full flex-col justify-end pb-6">
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-white/80">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/org" className="hover:text-white">{tNav("organizers")}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-white">{o.name}</span>
            </nav>
          </Container>
        </div>

        <Container className="relative -mt-12">
          <div className="flex flex-col items-start gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:flex-row sm:items-center">
            <div
              className="h-24 w-24 shrink-0 rounded-[var(--radius-lg)] border-4 border-[var(--color-surface)] bg-cover bg-center shadow-[var(--shadow-sm)]"
              style={{ backgroundImage: `url(${o.logoUrl})` }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                  {o.name}
                </h1>
                {o.isVerified && (
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-pitch-500)] text-white"
                    title={tCommon("verified")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[var(--color-muted-strong)]">{o.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{country?.flag} {o.city}, {country?.name}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[var(--color-premium)] text-[var(--color-premium)]" />
                  <span className="font-semibold text-[var(--color-foreground)]">{o.rating}</span>
                  <span>({o.reviewsCount} {tCommon("reviews")})</span>
                </span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /><span className="font-semibold text-[var(--color-foreground)]">{o.eventsCount}</span> {tCommon("events")}</span>
                {typeof o.followersCount === "number" && o.followersCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-semibold text-[var(--color-foreground)]">{o.followersCount.toLocaleString()}</span> {t("followers")}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <FollowOrganizerButton
                organizerId={o.id}
                followersCount={o.followersCount}
                followLabel={t("follow")}
                followingLabel={t("following")}
                returnTo={`/${locale}/org/${o.slug}`}
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("about")}
            </h2>
            <p className="text-pretty leading-relaxed text-[var(--color-muted-strong)]">{o.about}</p>

            <h2 className="mb-4 mt-12 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("events")}
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">{t("noEvents")}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} locale={locale} size="sm" labels={cardLabels} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("contact")}</div>
              <div className="mt-3 space-y-2 text-sm">
                <a href={`mailto:hello@${o.slug}.com`} className="flex items-center gap-2 text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                  <Mail className="h-4 w-4" /> hello@{o.slug}.com
                </a>
              </div>
            </div>

            {(o.socials || o.website) && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("social")}</div>
                <SocialLinks website={o.website} socials={o.socials} />
              </div>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
