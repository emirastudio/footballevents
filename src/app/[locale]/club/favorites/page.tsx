import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Heart, Bell, Bookmark } from "lucide-react";
import { EventCard } from "@/components/cards/EventCard";
import { OrganizerCard } from "@/components/cards/OrganizerCard";
import type { MockEvent, MockOrganizer } from "@/lib/mock-data";

// EventSave and OrganizerFollow already live at the User level — the club's
// "favorites" tab is purely a presentation of the user-account's existing
// favourites. No new schema, no new actions. See ADR 0001 §D3.
export default async function ClubFavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!club) redirect("/onboarding/club");

  const [savedRows, followedRows] = await Promise.all([
    db.eventSave.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            category: true,
            organizer: true,
            venue: true,
            translations: true,
            _count: { select: { saves: true } },
          },
        },
      },
    }),
    db.organizerFollow.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        organizer: {
          include: {
            translations: true,
            events: { select: { id: true } },
            _count: { select: { followers: true } },
          },
        },
      },
    }),
  ]);

  const t = await getTranslations("club");
  const tCommon = await getTranslations("common");

  // Map to the legacy MockEvent/MockOrganizer shape that card components expect.
  // Same projection as /me/page.tsx — keep them in sync if either changes.
  const savedEvents: MockEvent[] = savedRows.map((s) => {
    const e = s.event;
    const en = e.translations.find((tr) => tr.locale === "en") ?? e.translations[0];
    return {
      id: e.id,
      slug: e.slug,
      title: en?.title ?? e.slug,
      shortDescription: en?.shortDescription ?? "",
      description: en?.description ?? "",
      type: e.type as MockEvent["type"],
      categorySlug: e.category.slug,
      organizerSlug: e.organizer.slug,
      venueSlug: e.venue?.slug,
      countryCode: e.countryCode ?? "",
      city: e.organizer.city ?? "",
      startDate: e.startDate?.toISOString() ?? "",
      endDate: e.endDate?.toISOString() ?? "",
      ageGroups: e.ageGroups as unknown as string[],
      gender: e.gender as MockEvent["gender"],
      format: e.format ?? undefined,
      skillLevel: e.skillLevel as MockEvent["skillLevel"],
      priceFrom: e.priceFrom ? Number(e.priceFrom) : 0,
      priceTo: e.priceTo ? Number(e.priceTo) : undefined,
      currency: e.currency,
      isFree: e.isFree,
      coverUrl: e.coverUrl ?? "",
      galleryUrls: e.galleryUrls,
      rating: e.ratingAvg,
      reviewsCount: e.ratingCount,
      isPremium: e.boostTier === "PREMIUM",
      isFeatured: e.isFeatured,
      logoUrl: e.logoUrl ?? e.organizer.logoUrl ?? undefined,
      savesCount: e._count.saves,
    };
  });

  const followedOrganizers: MockOrganizer[] = followedRows.map((f) => {
    const o = f.organizer;
    const en = o.translations.find((tr) => tr.locale === "en") ?? o.translations[0];
    return {
      id: o.id,
      slug: o.slug,
      name: o.name,
      tagline: en?.tagline ?? "",
      about: en?.about ?? "",
      countryCode: o.countryCode ?? "",
      city: o.city ?? "",
      logoUrl: o.logoUrl ?? "",
      coverUrl: o.coverUrl ?? "",
      isVerified: o.isVerified,
      subscriptionTier: o.subscriptionTier as MockOrganizer["subscriptionTier"],
      eventsCount: o.events.length,
      rating: 0,
      reviewsCount: 0,
      followersCount: o._count.followers,
    };
  });

  const cardLabels = {
    from: tCommon("from"),
    free: tCommon("free"),
    premium: tCommon("premium"),
    featured: tCommon("featured"), passed: tCommon("passed"),
  };
  const orgLabels = {
    verified: tCommon("verified"),
    events: tCommon("events"),
    reviews: tCommon("reviews"),
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("navFavorites")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t("favoritesSubtitle")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-3 py-1.5 text-sm font-semibold text-[var(--color-pitch-700)]">
            <Bookmark className="h-3.5 w-3.5" /> {t("favoritesSavedCount", { n: savedEvents.length })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-3 py-1.5 text-sm font-semibold text-[var(--color-pitch-700)]">
            <Bell className="h-3.5 w-3.5" /> {t("favoritesFollowingCount", { n: followedOrganizers.length })}
          </span>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {t("favoritesSavedEvents")}
        </h2>
        {savedEvents.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-9 w-9 text-[var(--color-pitch-600)]" />}
            title={t("favoritesNoSaved")}
            body={t("favoritesNoSavedBody")}
            ctaHref="/events"
            ctaLabel={t("browseEvents")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedEvents.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} labels={cardLabels} size="sm" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {t("favoritesFollowedOrganizers")}
        </h2>
        {followedOrganizers.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-9 w-9 text-[var(--color-pitch-600)]" />}
            title={t("favoritesNoFollowed")}
            body={t("favoritesNoFollowedBody")}
            ctaHref="/org"
            ctaLabel={t("favoritesBrowseOrganizers")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followedOrganizers.map((o) => (
              <OrganizerCard key={o.id} organizer={o} labels={orgLabels} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({
  icon, title, body, ctaHref, ctaLabel,
}: {
  icon: React.ReactNode; title: string; body: string;
  ctaHref: string; ctaLabel: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
      <div className="mx-auto inline-block">{icon}</div>
      <h3 className="mt-3 text-base font-bold text-[var(--color-foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{body}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-pitch-700)]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
