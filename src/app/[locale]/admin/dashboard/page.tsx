import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Layers, Users as UsersIcon, Inbox, Building2 } from "lucide-react";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [pendingEvents, totalEvents, totalUsers, totalOrganizers, totalBookings, newBookings] = await Promise.all([
    db.event.count({ where: { status: "PENDING_REVIEW" } }),
    db.event.count(),
    db.user.count(),
    db.organizer.count(),
    db.booking.count(),
    db.booking.count({ where: { status: "NEW" } }),
  ]);

  const stats = [
    { label: "Pending review",    value: pendingEvents, hint: "Events", href: "/admin/events?status=pending_review", icon: Layers, urgent: pendingEvents > 0 },
    { label: "Events",            value: totalEvents,   icon: Layers, href: "/admin/events" },
    { label: "Organizers",        value: totalOrganizers, icon: Building2 },
    { label: "Users",             value: totalUsers,    icon: UsersIcon, href: "/admin/users" },
    { label: "Bookings (new)",    value: newBookings,   hint: `${totalBookings} total`, icon: Inbox, href: "/admin/bookings" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">Admin overview</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const card = (
            <div className={`rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 transition ${s.urgent ? "border-amber-300 ring-2 ring-amber-100" : "border-[var(--color-border)]"} ${s.href ? "hover:border-[var(--color-pitch-300)]" : ""}`}>
              <s.icon className={`mb-2 h-5 w-5 ${s.urgent ? "text-amber-600" : "text-[var(--color-pitch-600)]"}`} />
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{s.label}</div>
              <div className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold tabular-nums text-[var(--color-foreground)]">{s.value}</div>
              {s.hint && <div className="mt-1 text-xs text-[var(--color-muted)]">{s.hint}</div>}
            </div>
          );
          return s.href ? <Link key={s.label} href={s.href}>{card}</Link> : <div key={s.label}>{card}</div>;
        })}
      </div>
    </div>
  );
}
