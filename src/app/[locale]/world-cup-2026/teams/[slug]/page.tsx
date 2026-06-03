import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import {
  getWorldCupTeamBySlug, getWorldCupSquad, getWorldCupCoach,
  getWorldCupFixtures, getWorldCupStandings,
} from "@/lib/api-football";
import { locales, type Locale } from "@/i18n/config";
import { hreflang } from "@/lib/seo";
import { ChevronRight, CalendarDays, Users, User } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const team = await getWorldCupTeamBySlug(slug);
  if (!team) return {};
  const t = await getTranslations({ locale, namespace: "worldCup" });
  const url = `${SITE_URL}/${locale}/world-cup-2026/teams/${slug}`;
  return {
    title: t("teamTitle", { team: team.name }),
    description: t("teamDesc", { team: team.name }),
    alternates: { canonical: url, languages: hreflang(`/world-cup-2026/teams/${slug}`) },
    openGraph: {
      type: "website", url, title: t("teamTitle", { team: team.name }), description: t("teamDesc", { team: team.name }),
      images: [{ url: team.logo || `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: team.name }],
    },
  };
}

function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const POS_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

export default async function WorldCupTeamPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const team = await getWorldCupTeamBySlug(slug);
  if (!team) notFound();

  const t = await getTranslations("worldCup");
  const [squad, coach, fixtures, groups] = await Promise.all([
    getWorldCupSquad(team.id), getWorldCupCoach(team.id), getWorldCupFixtures(), getWorldCupStandings(),
  ]);
  const teamFixtures = fixtures.filter((f) => f.home === team.name || f.away === team.name).slice(0, 12);
  const group = groups.find((g) => g.rows.some((r) => r.team === team.name));
  const url = `${SITE_URL}/${locale}/world-cup-2026/teams/${slug}`;

  const byPos = POS_ORDER
    .map((pos) => ({ pos, players: squad.filter((p) => p.position === pos) }))
    .filter((g) => g.players.length > 0);
  const other = squad.filter((p) => !POS_ORDER.includes(p.position ?? ""));
  if (other.length) byPos.push({ pos: "", players: other });

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-gold-300)] bg-[var(--color-navy-900)]">
        <div className="absolute inset-0 opacity-90" style={{ background: "radial-gradient(1000px 360px at 50% -10%, rgba(212,175,55,0.3), transparent 60%)" }} aria-hidden />
        <Container className="relative py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-white/70">
            <Link href="/" className="hover:text-white">{t("breadcrumbHome")}</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/world-cup-2026" className="hover:text-white">{t("badge")}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{team.name}</span>
          </nav>
          <div className="flex items-center gap-4">
            {team.logo && <img src={team.logo} alt="" width={64} height={64} className="h-16 w-16 object-contain" />}
            <div>
              <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-white sm:text-4xl">{team.name}</h1>
              <p className="mt-1 text-sm text-[var(--color-gold-200)]">
                {t("teamTagline")}{group ? ` · ${group.name}` : ""}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          { "@context": "https://schema.org", "@type": "SportsTeam", name: team.name, sport: "Soccer", logo: team.logo || undefined, url },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
            { "@type": "ListItem", position: 2, name: "World Cup 2026", item: `${SITE_URL}/${locale}/world-cup-2026` },
            { "@type": "ListItem", position: 3, name: team.name, item: url },
          ] },
        ]) }} />

        {coach && (
          <section className="mb-10">
            <h2 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]"><User className="h-5 w-5 text-[var(--color-gold-600)]" /> {t("coachHeading")}</h2>
            <div className="inline-flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              {coach.photo && <img src={coach.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />}
              <div><div className="font-semibold text-[var(--color-foreground)]">{coach.name}</div>{coach.nationality && <div className="text-xs text-[var(--color-muted)]">{coach.nationality}</div>}</div>
            </div>
          </section>
        )}

        {teamFixtures.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]"><CalendarDays className="h-5 w-5 text-[var(--color-gold-600)]" /> {t("scheduleHeading", { country: team.name })}</h2>
            <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {teamFixtures.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="w-28 shrink-0 text-xs font-semibold text-[var(--color-muted)]">{fmt(m.date, locale)}</span>
                  <span className="flex-1 font-semibold text-[var(--color-foreground)]">{m.home} — {m.away}</span>
                  <span className="hidden shrink-0 text-xs text-[var(--color-muted)] sm:block">{m.city}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {squad.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]"><Users className="h-5 w-5 text-[var(--color-gold-600)]" /> {t("squadHeading")}</h2>
            <div className="space-y-5">
              {byPos.map((grp) => (
                <div key={grp.pos || "other"}>
                  {grp.pos && <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{grp.pos}</h3>}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {grp.players.map((p) => (
                      <div key={`${p.name}-${p.number}`} className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                        {p.photo && <img src={p.photo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[var(--color-foreground)]">{p.name}</div>
                          {p.number != null && <div className="text-xs text-[var(--color-muted)]">#{p.number}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
