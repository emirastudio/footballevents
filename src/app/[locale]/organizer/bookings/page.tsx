import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { respondBookingAction } from "@/app/actions/booking";
import { parseForm, localizeFields, isDisplayField, type FormField } from "@/lib/forms/types";
import { Check, X } from "lucide-react";

const YESNO: Record<string, { yes: string; no: string }> = {
  en: { yes: "Yes", no: "No" }, ru: { yes: "Да", no: "Нет" },
  de: { yes: "Ja", no: "Nein" }, es: { yes: "Sí", no: "No" },
};

const STATUSES = ["ALL", "NEW", "ACCEPTED", "DECLINED"] as const;

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const organizer = await db.organizer.findUnique({ where: { userId: session.user.id } });
  if (!organizer) redirect("/onboarding/organizer");

  const t = await getTranslations("bookings");
  const tOrg = await getTranslations("organizer");

  const activeStatus = (sp.status?.toUpperCase() ?? "ALL") as (typeof STATUSES)[number];

  const bookings = await db.booking.findMany({
    where: {
      event: { organizerId: organizer.id },
      ...(activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
    },
    include: {
      event: { include: { translations: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{tOrg("applications")}</h1>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const isActive = activeStatus === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/organizer/bookings" : `/organizer/bookings?status=${s.toLowerCase()}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
              }`}
            >
              {s === "ALL" ? t("filterAll") : t(`applicantStatus.${s}`)}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          {t("noNew")}
        </p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const en = b.event.translations.find((tr) => tr.locale === "en") ?? b.event.translations[0];
            return (
              <li key={b.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{b.participantName}</span>
                      <StatusBadge status={b.status} t={t} />
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-foreground)]">{en?.title ?? b.event.slug}</span> · {b.createdAt.toISOString().slice(0, 10)}
                    </div>
                    <dl className="mt-3 grid gap-1 text-xs sm:grid-cols-3">
                      <Field label="Email" value={b.contactEmail} />
                      {b.contactPhone && <Field label="Phone" value={b.contactPhone} />}
                      {b.teamName && <Field label="Team" value={b.teamName} />}
                      {b.participantAge && <Field label="Age" value={String(b.participantAge)} />}
                      {b.partySize > 1 && <Field label="Party" value={String(b.partySize)} />}
                    </dl>
                    <CustomAnswers registrationForm={b.event.registrationForm} answers={b.customFields} locale={locale} />
                    {b.comment && (
                      <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] p-3 text-sm text-[var(--color-muted-strong)]">
                        {b.comment}
                      </p>
                    )}
                    {b.organizerNote && (
                      <p className="mt-3 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-foreground)]">
                        <strong className="text-xs uppercase tracking-wider text-[var(--color-pitch-700)]">Your reply:</strong>{" "}
                        {b.organizerNote}
                      </p>
                    )}
                  </div>
                  {b.status === "NEW" && (
                    <div className="flex gap-2">
                      <form action={respondBookingAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="decision" value="accept" />
                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--color-pitch-600)]">
                          <Check className="h-3.5 w-3.5" /> {t("accept")}
                        </button>
                      </form>
                      <form action={respondBookingAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="decision" value="decline" />
                        <button type="submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700">
                          <X className="h-3.5 w-3.5" /> {t("decline")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const colors: Record<string, string> = {
    NEW: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]",
    DECLINED: "bg-red-50 text-red-700",
    CANCELLED: "bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)]",
    COMPLETED: "bg-[var(--color-bg-muted)] text-[var(--color-muted)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[status] ?? colors.NEW}`}>
      {t(`applicantStatus.${status}`)}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</dt>
      <dd className="text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}

/** Renders the answers an applicant gave to the organizer's custom form fields,
 *  labelled in the organizer's language. This is what lets the organizer see the
 *  full submission (country/city, accommodation, age group, …) before deciding. */
function CustomAnswers({
  registrationForm, answers, locale,
}: { registrationForm: unknown; answers: unknown; locale: string }) {
  if (!answers || typeof answers !== "object") return null;
  const data = answers as Record<string, unknown>;
  if (Object.keys(data).length === 0) return null;

  const fields = localizeFields(parseForm(registrationForm), locale).filter((f) => !isDisplayField(f.type));
  const yn = YESNO[locale] ?? YESNO.en;

  const fmt = (f: FormField | undefined, v: unknown): string => {
    if (Array.isArray(v)) return v.map(String).join(", ");
    if (typeof v === "boolean") return v ? yn.yes : yn.no;
    const s = String(v ?? "").trim();
    if (f?.type === "yesno") return s === "yes" ? yn.yes : s === "no" ? yn.no : s;
    return s;
  };

  // Keep the organizer's field order; show answered fields, then any stray keys.
  const ordered = fields.filter((f) => f.id in data);
  const extraKeys = Object.keys(data).filter((k) => !fields.some((f) => f.id === k));
  if (ordered.length === 0 && extraKeys.length === 0) return null;

  const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//.test(v);

  return (
    <dl className="mt-3 grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 text-xs sm:grid-cols-2">
      {ordered.map((f) => {
        const v = data[f.id];
        return (
          <div key={f.id}>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{f.label}</dt>
            <dd className="break-words text-[var(--color-foreground)]">
              {isUrl(v) ? (
                <a href={String(v)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-pitch-700)] underline">
                  {f.type === "file" ? "📎 file" : String(v)}
                </a>
              ) : (
                fmt(f, v) || "—"
              )}
            </dd>
          </div>
        );
      })}
      {extraKeys.map((k) => (
        <div key={k}>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{k}</dt>
          <dd className="break-words text-[var(--color-foreground)]">{fmt(undefined, data[k]) || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
