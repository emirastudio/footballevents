import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LayoutDashboard, Calendar, Inbox, MessageSquare, Star, Settings as Cog } from "lucide-react";

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

  const organizer = await db.organizer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true, name: true, logoUrl: true, subscriptionTier: true },
  });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("organizer");

  const nav = [
    { href: "/organizer/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/organizer/events", icon: Calendar, label: t("myEvents") },
    { href: "/organizer/bookings", icon: Inbox, label: t("applications") },
    { href: "/organizer/messages", icon: MessageSquare, label: t("messages") },
    { href: "/organizer/reviews", icon: Star, label: t("reviewsMod") },
    { href: "/organizer/settings", icon: Cog, label: t("settings") },
  ];

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
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
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{organizer.subscriptionTier}</div>
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
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </Container>
  );
}
