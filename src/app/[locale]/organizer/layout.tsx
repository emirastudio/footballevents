import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { countUnreadThreads } from "@/lib/messages";
import { getOrganizerForUser, can, type PermKey } from "@/lib/organizer-access";
import { LayoutDashboard, Calendar, Inbox, MessageSquare, Star, Settings as Cog, MapPin, Megaphone, BarChart3 } from "lucide-react";

export default async function OrganizerLayout({
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

  const access = await getOrganizerForUser(session.user.id);
  if (!access) redirect("/onboarding/organizer");
  const { organizer, role } = access;

  const t = await getTranslations("organizer");
  const [unreadMessages, newBookings] = await Promise.all([
    countUnreadThreads(session.user.id),
    db.booking.count({ where: { event: { organizerId: organizer.id }, status: "NEW" } }),
  ]);

  // Each item carries the permission it needs; STAFF/MANAGER see a filtered nav.
  const navAll: { href: string; icon: typeof LayoutDashboard; label: string; badge: number; perm?: PermKey }[] = [
    { href: "/organizer/dashboard", icon: LayoutDashboard, label: t("dashboard"), badge: 0 },
    { href: "/organizer/events", icon: Calendar, label: t("myEvents"), badge: 0, perm: "events" },
    { href: "/organizer/venues", icon: MapPin, label: t("venues"), badge: 0, perm: "venues" },
    { href: "/organizer/bookings", icon: Inbox, label: t("applications"), badge: newBookings, perm: "bookings" },
    { href: "/organizer/messages", icon: MessageSquare, label: t("messages"), badge: unreadMessages, perm: "messages" },
    { href: "/organizer/marketing", icon: Megaphone, label: t("marketing"), badge: 0, perm: "marketing" },
    { href: "/organizer/analytics", icon: BarChart3, label: t("analyticsNav"), badge: 0, perm: "analytics" },
    { href: "/organizer/reviews", icon: Star, label: t("reviewsMod"), badge: 0, perm: "reviews" },
    { href: "/organizer/settings", icon: Cog, label: t("settings"), badge: 0, perm: "settings" },
  ];
  const nav = navAll.filter((n) => !n.perm || can(role, n.perm));

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href={`/org/${organizer.slug}`}
            className="mb-5 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-pitch-300)]"
          >
            <div
              className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-bg-muted)]"
              style={organizer.logoUrl ? { backgroundImage: `url(${organizer.logoUrl})` } : undefined}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{organizer.name}</div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{role === "OWNER" ? organizer.subscriptionTier : role}</div>
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
                {n.badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* min-w-0 lets wide tables hand the scrollbar off to their own
            overflow-x-auto wrapper instead of stretching the grid column. */}
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
