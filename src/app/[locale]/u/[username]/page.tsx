import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calendar, Star, Trophy, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { RatingStars } from "@/components/reviews/RatingStars";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: { name: true, profilePublic: true },
  });
  if (!user || !user.profilePublic) return { title: "Profile not found" };
  return {
    title: `${user.name ?? username} on FootballEvents.eu`,
    description: `Public participant profile of ${user.name ?? username}.`,
  };
}

export default async function PublicUserProfile({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      profilePublic: true,
      createdAt: true,
      bannedAt: true,
    },
  });
  if (!user || !user.profilePublic || user.bannedAt) notFound();

  // Events attended (PUBLISHED, past, with ACCEPTED/COMPLETED booking)
  const now = new Date();
  const attendedBookings = await db.booking.findMany({
    where: {
      userId: user.id,
      status: { in: ["ACCEPTED", "COMPLETED"] },
      event: {
        status: "PUBLISHED",
        OR: [
          { endDate: { lt: now } },
          { endDate: null, startDate: { lt: now } },
        ],
      },
    },
    include: {
      event: {
        include: {
          translations: { select: { locale: true, title: true } },
          organizer: { select: { name: true, slug: true } },
          city: { select: { nameEn: true } },
          venue: { select: { city: { select: { nameEn: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Reviews written (only APPROVED)
  const reviews = await db.review.findMany({
    where: { authorId: user.id, status: "APPROVED" },
    include: {
      event: {
        select: {
          slug: true,
          translations: { select: { locale: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const t = await getTranslations("publicProfile");

  const memberSince = user.createdAt.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const initials =
    (user.name ?? username)
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <Container className="max-w-3xl py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--color-pitch-50)]"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-pitch-50)] text-2xl font-bold text-[var(--color-pitch-700)]">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            {user.name ?? username}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">@{username}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t("memberSince", { date: memberSince })}
          </p>
          {user.bio && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-muted-strong)]">
              {user.bio}
            </p>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat icon={<Trophy className="h-4 w-4" />} label={t("stats.eventsAttended")} value={attendedBookings.length} />
        <Stat icon={<Star className="h-4 w-4" />}   label={t("stats.reviewsWritten")} value={reviews.length} />
      </div>

      {/* Events attended */}
      <section className="mb-10">
        <h2 className="mb-4 font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
          {t("attendedHeading")}
        </h2>
        {attendedBookings.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t("noAttended")}</p>
        ) : (
          <ul className="space-y-2">
            {attendedBookings.map((b) => {
              const tr =
                b.event.translations.find((x) => x.locale === locale) ??
                b.event.translations.find((x) => x.locale === "en") ??
                b.event.translations[0];
              const title = tr?.title ?? b.event.slug;
              const city = b.event.city?.nameEn ?? b.event.venue?.city?.nameEn ?? null;
              const date = b.event.startDate
                ? new Date(b.event.startDate).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null;
              return (
                <li key={b.id}>
                  <Link
                    href={`/events/${b.event.slug}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition hover:border-[var(--color-pitch-300)]"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--color-foreground)]">{title}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {b.event.organizer.name}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                      {date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {date}
                        </span>
                      )}
                      {city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {city}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Reviews written */}
      <section>
        <h2 className="mb-4 font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
          {t("reviewsHeading")}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t("noReviews")}</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => {
              const tr =
                r.event.translations.find((x) => x.locale === locale) ??
                r.event.translations.find((x) => x.locale === "en") ??
                r.event.translations[0];
              const eventTitle = tr?.title ?? r.event.slug;
              return (
                <li
                  key={r.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Link
                      href={`/events/${r.event.slug}`}
                      className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)] hover:underline"
                    >
                      {eventTitle}
                    </Link>
                    <RatingStars value={r.rating} readOnly size="sm" />
                  </div>
                  {r.title && (
                    <h3 className="mb-1 font-semibold text-[var(--color-foreground)]">{r.title}</h3>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted-strong)]">
                    {r.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Container>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
