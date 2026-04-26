import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function MyApplicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("myApplications");
  const tBookings = await getTranslations("bookings");

  const bookings = await db.booking.findMany({
    where: { userId: session.user.id },
    include: { event: { include: { translations: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-10">
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("pageTitle")}</h1>
      <p className="mt-1 text-[var(--color-muted-strong)]">{t("subtitle")}</p>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">{t("empty")}</p>
          <Button asChild variant="accent" className="mt-4">
            <Link href="/events">{t("browse")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {bookings.map((b) => {
            const en = b.event.translations.find((tr) => tr.locale === locale) ?? b.event.translations.find((tr) => tr.locale === "en");
            return (
              <li key={b.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/events/${b.event.slug}`} className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                      {en?.title ?? b.event.slug}
                    </Link>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      {t("appliedOn")} {b.createdAt.toISOString().slice(0, 10)}
                      {b.respondedAt && <> · {t("respondedOn")} {b.respondedAt.toISOString().slice(0, 10)}</>}
                    </div>
                  </div>
                  <StatusBadge status={b.status} t={tBookings} />
                </div>
                {b.organizerNote && (
                  <div className="mt-3 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-foreground)]">
                    <strong className="text-xs uppercase tracking-wider text-[var(--color-pitch-700)]">{t("organizerNote")}:</strong>{" "}
                    {b.organizerNote}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    NEW: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]",
    DECLINED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${colors[status] ?? "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]"}`}>
      {t(`applicantStatus.${status}`)}
    </span>
  );
}
