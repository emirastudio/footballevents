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
import { Bookmark, Bell, Mail, Calendar, MessageSquare, Settings, Zap, Star, Crown, Globe, CreditCard } from "lucide-react";
import { openBillingPortal } from "@/app/actions/billing";

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
  const tAlerts = await getTranslations("alerts");
  const tBilling = await getTranslations("billing");

  const userId = session.user.id;

  const unreadMessages = await countUnreadThreads(userId);

  const [user, savedRows, organizer, followedRows] = await Promise.all([
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
    db.organizer.findUnique({
      where: { userId },
      select: { id: true, slug: true, name: true, subscriptionTier: true, subscriptionEndsAt: true, stripeCustomerId: true },
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
          <Link
            href="/me/alerts"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>{tAlerts("title")}</span>
          </Link>
          {user?.username && user.profilePublic && (
            <Link
              href={`/u/${user.username}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>@{user.username}</span>
            </Link>
          )}
          <Link
            href="/me/settings"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{t("settings.title")}</span>
          </Link>
        </div>
      </div>

      {/* Organizer plan card */}
      {organizer && (() => {
        const tier = organizer.subscriptionTier as "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";
        const endsAt = organizer.subscriptionEndsAt;
        const daysLeft = endsAt ? Math.ceil((endsAt.getTime() - Date.now()) / 86400000) : null;
        const tierColors = {
          FREE:       "bg-[var(--color-surface-muted)] text-[var(--color-muted-strong)]",
          PRO:        "bg-blue-50 text-blue-700",
          PREMIUM:    "bg-amber-50 text-amber-700",
          ENTERPRISE: "bg-purple-50 text-purple-700",
        };
        const TierIcon = tier === "PREMIUM" || tier === "ENTERPRISE" ? Crown : tier === "PRO" ? Star : Zap;
        return (
          <div className={`mb-10 flex flex-col gap-4 rounded-[var(--radius-2xl)] border p-6 sm:flex-row sm:items-center ${
            tier === "PREMIUM" ? "border-amber-200 bg-amber-50" :
            tier === "PRO"     ? "border-blue-200 bg-blue-50" :
                                 "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tierColors[tier]}`}>
              <TierIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                {organizer.name} — <span className={tier === "PREMIUM" ? "text-amber-700" : tier === "PRO" ? "text-blue-700" : "text-[var(--color-muted-strong)]"}>{tier}</span>
              </div>
              {daysLeft !== null && daysLeft > 0 ? (
                <p className="mt-0.5 text-sm text-[var(--color-muted-strong)]">
                  {tier} active · expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> ({endsAt!.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})
                </p>
              ) : daysLeft !== null && daysLeft <= 0 ? (
                <p className="mt-0.5 text-sm text-red-600">Plan expired — downgrade to Free pending</p>
              ) : (
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                  {tier === "FREE" ? "Free plan · upgrade to unlock more features" : "Active subscription"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/organizer/dashboard">{tBilling("dashboard")}</Link>
              </Button>
              {tier === "FREE" && (
                <Button asChild variant="accent" size="sm">
                  <Link href="/pricing">{tBilling("upgrade")}</Link>
                </Button>
              )}
              {(tier === "PRO" || tier === "PREMIUM") && daysLeft !== null && daysLeft <= 14 && (
                <Button asChild variant="accent" size="sm">
                  <Link href="/pricing">{tBilling("renew")}</Link>
                </Button>
              )}
              {(tier === "PRO" || tier === "PREMIUM" || tier === "ENTERPRISE") && organizer.stripeCustomerId && (
                <form action={openBillingPortal}>
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant="outline" size="sm">
                    <CreditCard className="h-3.5 w-3.5" /> {tBilling("manage")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        );
      })()}

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
