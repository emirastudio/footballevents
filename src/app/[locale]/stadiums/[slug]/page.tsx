import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ChevronRight, MapPin, Users, Sprout, Calendar } from "lucide-react";
import { getCountry } from "@/lib/mock-data";
import { getVenueBySlug, getVenueSlugs, getEventsByVenue } from "@/lib/queries";
import { EventCard } from "@/components/cards/EventCard";

export const revalidate = 3600;
export async function generateStaticParams() { return []; }

export default async function StadiumDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const v = await getVenueBySlug(slug);
  if (!v) notFound();

  const t       = await getTranslations("stadiums.detail");
  const tCommon = await getTranslations("common");
  const tNav    = await getTranslations("nav");

  const country = getCountry(v.countryCode);
  const events  = await getEventsByVenue(v.slug);

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"),
  };

  return (
    <>
      <section className="relative">
        <div
          className="relative h-[44vh] min-h-[340px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${v.coverUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <Container className="relative flex h-full flex-col justify-end pb-8">
            <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-white/80">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/stadiums" className="hover:text-white">{tNav("stadiums")}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-white">{v.name}</span>
            </nav>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <MapPin className="h-4 w-4" /> {country?.flag} {v.city}, {country?.name}
            </div>
            <h1 className="mt-2 max-w-3xl text-balance font-[family-name:var(--font-manrope)] text-3xl font-bold text-white drop-shadow-md sm:text-5xl">
              {v.name}
            </h1>
          </Container>
        </div>
      </section>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("about")}
            </h2>
            <p className="text-pretty leading-relaxed text-[var(--color-muted-strong)]">{v.description}</p>

            {v.galleryUrls.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {v.galleryUrls.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded-[var(--radius-md)] bg-cover bg-center shadow-[var(--shadow-xs)]"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
            )}

            <h2 className="mb-4 mt-12 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              {t("events")}
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">{tCommon("noResults")}</p>
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
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("info")}</div>
              <ul className="mt-3 space-y-2.5 text-sm">
                {v.capacity && (
                  <li className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
                    <span className="text-[var(--color-muted)]">{t("capacity")}:</span>
                    <span className="font-semibold text-[var(--color-foreground)]">{v.capacity.toLocaleString()}</span>
                  </li>
                )}
                {v.surfaceType && (
                  <li className="flex items-center gap-2.5">
                    <Sprout className="h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
                    <span className="text-[var(--color-muted)]">{t("surface")}:</span>
                    <span className="font-semibold text-[var(--color-foreground)]">{v.surfaceType}</span>
                  </li>
                )}
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
                  <span className="text-[var(--color-foreground)]">{v.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 shrink-0 text-[var(--color-pitch-600)]" />
                  <span className="font-semibold text-[var(--color-foreground)]">{v.eventsCount}</span>
                  <span className="text-[var(--color-muted)]">{tCommon("events")}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
