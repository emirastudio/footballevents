import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { countUnreadThreads } from "@/lib/messages";
import { EventCard } from "@/components/cards/EventCard";
import { OrganizerCard } from "@/components/cards/OrganizerCard";
import type { MockEvent, MockOrganizer } from "@/lib/mock-data";
import { Bookmark, Bell, Mail, Calendar, MessageSquare } from "lucide-react";

export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("me");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tMessages = await getTranslations("messages");

  const userId = session.user.id;

  const unreadMessages = await countUnreadThreads(userId);

  const [user, savedRows, followedRows] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.eventSave.findMany({
      where: { userId },
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
      where: { userId },
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
      countryCode: e.countryCode,
      city: e.organizer.city ?? "",
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
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
    featured: tCommon("featured"),
  };
  const orgLabels = {
    verified: tCommon("verified"),
    events: tCommon("events"),
    reviews: tCommon("reviews"),
  };

  return (
    <Container className="py-10">
      {/* Header card */}
      <div className="mb-10 flex flex-col gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--color-pitch-50)] text-xl font-bold text-[var(--color-pitch-700)]">
          {(user?.name ?? user?.email ?? "U").split(/\s+|@/).filter(Boolean).map((s) => s[0]?.toUpperCase()).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            {user?.name ?? user?.email}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
            {user?.createdAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {t("since")} {user.createdAt.toISOString().slice(0, 10)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-3 py-1.5 text-sm font-semibold text-[var(--color-pitch-700)]">
            <Bookmark className="h-3.5 w-3.5" /> {savedEvents.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-3 py-1.5 text-sm font-semibold text-[var(--color-pitch-700)]">
            <Bell className="h-3.5 w-3.5" /> {followedOrganizers.length}
          </span>
          <Link
            href="/me/messages"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-pitch-50)] px-3 py-1.5 text-sm font-semibold text-[var(--color-pitch-700)] transition hover:bg-[var(--color-pitch-100)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{tMessages("inboxTitle")}</span>
            {unreadMessages > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Saved events */}
      <section className="mb-12">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
          <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            {t("savedEvents")}
            {savedEvents.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">({savedEvents.length})</span>
            )}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">{t("browseEvents")}</Link>
          </Button>
        </div>
        {savedEvents.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
            {t("noSaves")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedEvents.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} size="sm" labels={cardLabels} />
            ))}
          </div>
        )}
      </section>

      {/* Followed organizers */}
      <section>
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
          <h2 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            {t("followedOrganizers")}
            {followedOrganizers.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">({followedOrganizers.length})</span>
            )}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/org">{t("browseOrganizers")}</Link>
          </Button>
        </div>
        {followedOrganizers.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
            {t("noFollows")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followedOrganizers.map((o) => (
              <OrganizerCard key={o.id} organizer={o} labels={orgLabels} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
