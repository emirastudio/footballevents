import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { ChevronRight, MapPin, Mail, Phone, Globe, ShieldCheck, Calendar, Users, Send } from "lucide-react";
import { hreflang } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

// Resolve a club's tagline+about for the requested locale, falling back to EN.
type TR = { locale: string; tagline: string | null; about: string | null };
function pickLocalized(translations: TR[], locale: string): { tagline: string; about: string } {
  const find = (l: string) => translations.find((t) => t.locale === l);
  const t = find(locale) ?? find("en") ?? translations[0];
  return { tagline: t?.tagline ?? "", about: t?.about ?? "" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const club = await db.club.findUnique({
    where: { slug },
    include: {
      translations: { select: { locale: true, tagline: true, about: true } },
      country: { select: { nameEn: true } },
      city: { select: { nameEn: true } },
    },
  });
  if (!club) return {};
  const { tagline, about } = pickLocalized(club.translations, locale);
  const url = `${SITE_URL}/${locale}/club/${club.slug}`;
  const image = club.coverUrl || club.logoUrl || `${SITE_URL}/og-default.jpg`;
  const desc = tagline || about?.slice(0, 160) ||
    `${club.name} — football club from ${[club.city?.nameEn, club.country.nameEn].filter(Boolean).join(", ")}`;
  return {
    title: club.name,
    description: desc,
    alternates: { canonical: url, languages: hreflang(`/club/${club.slug}`) },
    openGraph: { type: "website", url, title: club.name, description: desc, images: [{ url: image, width: 1200, height: 630, alt: club.name }] },
    twitter: { card: "summary_large_image", title: club.name, description: desc, images: [image] },
  };
}

// Make club profiles dynamic — fresh data when a team is added or a club
// renames itself, without waiting for ISR. Volume is low and the page is cheap.
export const dynamic = "force-dynamic";

export default async function ClubPublicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const club = await db.club.findUnique({
    where: { slug },
    include: {
      translations: { select: { locale: true, tagline: true, about: true } },
      country: { select: { code: true, nameEn: true, flagEmoji: true } },
      city: { select: { nameEn: true } },
      teams: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, ageGroup: true, gender: true, format: true,
          skillLevel: true, birthYearFrom: true, birthYearTo: true,
        },
      },
      rfqs: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, eventType: true, ageGroup: true, format: true,
          targetCountries: true, targetRegion: true,
          dateFrom: true, dateTo: true, durationDays: true,
        },
      },
      _count: { select: { bookings: true, teams: true } },
    },
  });
  if (!club) notFound();

  const t = await getTranslations("club");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tCat = await getTranslations("categoryHeaders");
  const { tagline, about } = pickLocalized(club.translations, locale);

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
  const GENDER_L: Record<string, string> = {
    MALE: t("genderMale"), FEMALE: t("genderFemale"), MIXED: t("genderMixed"),
  };
  const LEVEL_L: Record<string, string> = {
    AMATEUR: t("skillAmateur"), SEMI_PRO: t("skillSemi"),
    PROFESSIONAL: t("skillPro"), ALL_LEVELS: t("skillAll"),
  };

  const socials = [
    club.instagramUrl, club.facebookUrl, club.xUrl, club.tiktokUrl,
    club.youtubeUrl, club.whatsappUrl, club.website,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* schema.org SportsOrganization — surfaces club in Google's knowledge graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            sport: "Soccer",
            name: club.name,
            url: `${SITE_URL}/${locale}/club/${club.slug}`,
            logo: club.logoUrl || undefined,
            image: club.coverUrl || club.logoUrl || undefined,
            description: tagline || about?.slice(0, 200) || undefined,
            foundingDate: club.foundedYear ? String(club.foundedYear) : undefined,
            email: club.email || undefined,
            telephone: club.phone || undefined,
            address: {
              "@type": "PostalAddress",
              addressCountry: club.country.code,
              addressLocality: club.city?.nameEn || undefined,
            },
            sameAs: socials.length > 0 ? socials : undefined,
          }),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: t("navTeams"), url: `${SITE_URL}/${locale}/club` },
          { name: club.name, url: `${SITE_URL}/${locale}/club/${club.slug}` },
        ]}
      />

      {/* Cover hero */}
      <section className="relative">
        <div className="relative h-[36vh] min-h-[280px] w-full overflow-hidden bg-[var(--color-pitch-50)]">
          {club.coverUrl && (
            <Image src={club.coverUrl} alt={club.name} fill priority sizes="100vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <Container className="relative flex h-full flex-col justify-start pt-5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/85 drop-shadow">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-white">{club.name}</span>
            </nav>
          </Container>
        </div>

        <Container className="relative -mt-12">
          <div className="flex flex-col items-start gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)] sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border-4 border-[var(--color-surface)] bg-[var(--color-bg-muted)] shadow-[var(--shadow-sm)]">
              {club.logoUrl && (
                <Image src={club.logoUrl} alt={club.name} fill sizes="96px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                  {club.name}
                </h1>
                {club.isVerified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]"
                    title={t("badgeVerified")}
                  >
                    <ShieldCheck className="h-3 w-3" /> {t("badgeVerified")}
                  </span>
                )}
              </div>
              {tagline && <p className="mt-1 text-[var(--color-muted-strong)]">{tagline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {club.country.flagEmoji} {[club.city?.nameEn, club.country.nameEn].filter(Boolean).join(", ")}
                </span>
                {club.foundedYear && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("publicFoundedIn", { year: club.foundedYear })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {t("publicTeamsCount", { n: club._count.teams })}
                </span>
                {club._count.bookings > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Send className="h-3.5 w-3.5" />
                    {t("publicApplicationsCount", { n: club._count.bookings })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* About */}
            {about && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("publicAboutSection")}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-foreground)]">{about}</p>
              </section>
            )}

            {/* Teams */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("publicTeamsSection")}</h2>
              {club.teams.length === 0 ? (
                <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted)]">
                  {t("publicNoTeams")}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {club.teams.map((team) => (
                    <article key={team.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <h3 className="text-base font-bold text-[var(--color-foreground)]">{team.name}</h3>
                      <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                        {team.ageGroup}
                        {team.format && <> · {team.format}</>}
                        {" · "}
                        {GENDER_L[team.gender] ?? team.gender}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{LEVEL_L[team.skillLevel] ?? team.skillLevel}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Open RFQs */}
            {club.rfqs.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("publicRfqsSection")}</h2>
                <ul className="space-y-2">
                  {club.rfqs.map((r) => {
                    const region = r.targetRegion || (r.targetCountries.length > 0 ? r.targetCountries.join(", ") : t("rfqAnywhere"));
                    const summary = [TYPE_L[r.eventType] ?? r.eventType, r.ageGroup, r.format].filter(Boolean).join(" · ");
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/rfqs/${r.id}`}
                          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-[var(--color-pitch-300)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{summary}</p>
                            <p className="text-xs text-[var(--color-muted)]">{region}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar: contact + socials */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("publicContactSection")}</h2>
              <div className="mt-3 space-y-2">
                {club.email && (
                  <a href={`mailto:${club.email}`} className="flex items-center gap-2 text-sm text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                    <Mail className="h-4 w-4 text-[var(--color-muted)]" /> {club.email}
                  </a>
                )}
                {club.phone && (
                  <a href={`tel:${club.phone}`} className="flex items-center gap-2 text-sm text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                    <Phone className="h-4 w-4 text-[var(--color-muted)]" /> {club.phone}
                  </a>
                )}
                {club.website && (
                  <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                    <Globe className="h-4 w-4 text-[var(--color-muted)]" /> {club.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {!club.email && !club.phone && !club.website && (
                  <p className="text-xs text-[var(--color-muted)]">{t("publicNoContacts")}</p>
                )}
              </div>
            </section>

            {socials.filter((s) => s !== club.website).length > 0 && (
              <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">{tCommon("social")}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {club.instagramUrl && <SocialLink href={club.instagramUrl} label="Instagram" />}
                  {club.facebookUrl && <SocialLink href={club.facebookUrl} label="Facebook" />}
                  {club.xUrl && <SocialLink href={club.xUrl} label="X" />}
                  {club.tiktokUrl && <SocialLink href={club.tiktokUrl} label="TikTok" />}
                  {club.youtubeUrl && <SocialLink href={club.youtubeUrl} label="YouTube" />}
                  {club.whatsappUrl && <SocialLink href={club.whatsappUrl} label="WhatsApp" />}
                </div>
              </section>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
    >
      {label}
    </a>
  );
}
