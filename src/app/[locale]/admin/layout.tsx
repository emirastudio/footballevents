import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { Shield, Layers, Users, Inbox, Building2, Star, Megaphone, Newspaper, Bug } from "lucide-react";
import { db } from "@/lib/db";

export default async function AdminLayout({
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
  if (session.user.role !== "ADMIN") redirect("/");

  const t = await getTranslations("admin");

  const openBugCount = await db.bugReport.count({ where: { status: "OPEN" } });

  const nav = [
    { href: "/admin/dashboard",   icon: Shield,    label: t("nav.overview"), badge: 0 },
    { href: "/admin/events",      icon: Layers,    label: t("nav.eventsQueue"), badge: 0 },
    { href: "/admin/bookings",    icon: Inbox,     label: t("nav.allBookings"), badge: 0 },
    { href: "/admin/organizers",  icon: Building2, label: t("nav.organizers"), badge: 0 },
    { href: "/admin/reviews",     icon: Star,      label: t("nav.reviews"), badge: 0 },
    { href: "/admin/news",        icon: Newspaper, label: "News drafts", badge: 0 },
    { href: "/admin/users",       icon: Users,     label: t("nav.users"), badge: 0 },
    { href: "/admin/bug-reports", icon: Bug,       label: "Bug reports", badge: openBugCount },
    { href: "/admin/promotion",   icon: Megaphone, label: t("nav.promotion"), badge: 0 },
  ];

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
            <Shield className="h-3.5 w-3.5" /> {t("badge")}
          </div>
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
        <div>{children}</div>
      </div>
    </Container>
  );
}
