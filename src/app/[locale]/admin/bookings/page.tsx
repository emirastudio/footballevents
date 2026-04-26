import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";

export default async function AdminBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const bookings = await db.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { event: { include: { translations: true, organizer: { select: { name: true } } } }, user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">All bookings</h1>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-4 py-2 text-left font-semibold">Applicant</th>
              <th className="px-4 py-2 text-left font-semibold">Event</th>
              <th className="px-4 py-2 text-left font-semibold">Organizer</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 text-left font-semibold">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const en = b.event.translations.find((tr) => tr.locale === "en") ?? b.event.translations[0];
              return (
                <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--color-foreground)]">{b.participantName} <span className="text-xs text-[var(--color-muted)]">({b.user.email})</span></td>
                  <td className="px-4 py-3 text-[var(--color-muted-strong)]">{en?.title ?? b.event.slug}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{b.event.organizer.name}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">{b.status}</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{b.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
