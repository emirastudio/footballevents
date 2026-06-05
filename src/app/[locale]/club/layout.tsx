import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LayoutDashboard, Users, Inbox, Send, Heart, Settings as Cog } from "lucide-react";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Source of truth for "has club hat" = presence of relation.
  // session.user.clubId is the fast path, but we re-fetch slug/logo for the nav.
  const club = await db.club.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, slug: true, name: true, logoUrl: true, isVerified: true,
      subscriptionTier: true,
    },
  });
  if (!club) redirect("/onboarding/club");

  const t = await getTranslations("club");

  // Badge counts — NEW applications + OPEN rfqs so the sidebar reflects real
  // pending state without a full query per item.
  const [newApplications, openRfqs] = await Promise.all([
    db.booking.count({ where: { clubId: club.id, status: "NEW" } }),
    db.rfq.count({ where: { clubId: club.id, status: "OPEN" } }),
  ]);

  const nav: { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { href: "/club/dashboard", icon: LayoutDashboard, label: t("navDashboard") },
    { href: "/club/teams", icon: Users, label: t("navTeams") },
    { href: "/club/applications", icon: Inbox, label: t("navApplications"), badge: newApplications },
    { href: "/club/rfqs", icon: Send, label: t("navRfqs"), badge: openRfqs },
    { href: "/club/favorites", icon: Heart, label: t("navFavorites") },
    { href: "/club/settings", icon: Cog, label: t("navSettings") },
  ];

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href={`/club/${club.slug}`}
            className="mb-5 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-pitch-300)]"
          >
            <div
              className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-bg-muted)]"
              style={club.logoUrl ? { backgroundImage: `url(${club.logoUrl})` } : undefined}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{club.name}</div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                {club.isVerified ? t("badgeVerified") : club.subscriptionTier}
              </div>
            </div>
          </Link>
          <nav className="flex flex-col gap-0.5">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              >
                <n.icon className="h-4 w-4 text-[var(--color-pitch-600)]" />
                <span className="flex-1">{n.label}</span>
                {n.badge && n.badge > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                    {n.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </Container>
  );
}
