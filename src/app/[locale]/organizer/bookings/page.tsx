import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { respondBookingAction } from "@/app/actions/booking";
import { requireOrgPage } from "@/lib/organizer-access";
import { parseForm, localizeFields, isDisplayField, fieldLabel, type FormField } from "@/lib/forms/types";
import { Check, X, ChevronRight, Download, ShieldCheck, Users } from "lucide-react";

const YESNO: Record<string, { yes: string; no: string }> = {
  en: { yes: "Yes", no: "No" }, ru: { yes: "Да", no: "Нет" },
  de: { yes: "Ja", no: "Nein" }, es: { yes: "Sí", no: "No" },
};
const DETAILS_LABEL: Record<string, string> = {
  en: "View details", ru: "Раскрыть детали", de: "Details anzeigen", es: "Ver detalles",
};

const STATUSES = ["ALL", "NEW", "ACCEPTED", "DECLINED"] as const;

const UI: Record<string, {
  all: string; export: string;
  clubsOnly: string; clubsAll: string;
  tplAcceptDetails: string; tplAcceptDeposit: string;
  tplDeclineFull: string; tplDeclineAge: string;
  quickReplies: string;
}> = {
  en: {
    all: "All events", export: "Export CSV",
    clubsOnly: "Clubs only", clubsAll: "Everyone",
    tplAcceptDetails: "Confirmed. Details will follow by email.",
    tplAcceptDeposit: "Confirmed pending the deposit. We'll send payment details by email.",
    tplDeclineFull: "Sorry, the event is fully booked. We'll keep you in mind if a spot opens up.",
    tplDeclineAge: "Sorry, this division doesn't match the age/level you applied with.",
    quickReplies: "Quick replies",
  },
  ru: {
    all: "Все события", export: "Экспорт CSV",
    clubsOnly: "Только клубы", clubsAll: "Все",
    tplAcceptDetails: "Подтверждено. Детали пришлём отдельным письмом.",
    tplAcceptDeposit: "Подтверждено при условии депозита. Реквизиты на оплату — отдельным письмом.",
    tplDeclineFull: "К сожалению, мест уже нет. Учтём вас, если кто-то откажется.",
    tplDeclineAge: "К сожалению, этот дивизион не подходит по возрасту/уровню вашей заявки.",
    quickReplies: "Быстрые ответы",
  },
  de: {
    all: "Alle Events", export: "CSV-Export",
    clubsOnly: "Nur Klubs", clubsAll: "Alle",
    tplAcceptDetails: "Bestätigt. Details folgen per E-Mail.",
    tplAcceptDeposit: "Bestätigt vorbehaltlich der Anzahlung. Zahlungsdetails folgen per E-Mail.",
    tplDeclineFull: "Leider ausgebucht. Wir melden uns, falls ein Platz frei wird.",
    tplDeclineAge: "Leider passt diese Altersklasse / das Niveau nicht zu Ihrer Anmeldung.",
    quickReplies: "Schnellantworten",
  },
  es: {
    all: "Todos los eventos", export: "Exportar CSV",
    clubsOnly: "Solo clubes", clubsAll: "Todos",
    tplAcceptDetails: "Confirmado. Te enviaremos los detalles por email.",
    tplAcceptDeposit: "Confirmado a la espera del depósito. Datos de pago por email.",
    tplDeclineFull: "Lo sentimos, el evento está completo. Te avisaremos si se libera una plaza.",
    tplDeclineAge: "Lo sentimos, esta categoría no coincide con la edad/nivel de tu inscripción.",
    quickReplies: "Respuestas rápidas",
  },
};

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; event?: string; clubs?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const { organizer } = await requireOrgPage(session.user.id, "bookings");

  const t = await getTranslations("bookings");
  const tOrg = await getTranslations("organizer");
  const ui = UI[locale] ?? UI.en;

  const activeStatus = (sp.status?.toUpperCase() ?? "ALL") as (typeof STATUSES)[number];
  const clubsOnly = sp.clubs === "1";

  // The organizer's events drive the per-event filter + CSV export button.
  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    select: { id: true, slug: true, translations: { select: { locale: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
  const eventTitle = (e: (typeof events)[number]) =>
    e.translations.find((tr) => tr.locale === locale)?.title ??
    e.translations.find((tr) => tr.locale === "en")?.title ??
    e.slug;
  const activeEvent = sp.event ? events.find((e) => e.slug === sp.event) ?? null : null;

  const bookings = await db.booking.findMany({
    where: {
      event: { organizerId: organizer.id },
      ...(activeEvent ? { eventId: activeEvent.id } : {}),
      ...(activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
      // "Clubs only" filter — narrows to applications that came from a registered Club.
      ...(clubsOnly ? { clubId: { not: null } } : {}),
      // Hidden behind monetization (default true) — when Pro/Premium gating
      // lands, Free organizers will only see their first N.
      visibleToOrganizer: true,
    },
    include: {
      event: { include: { translations: true } },
      // Club + team for the club badge + profile link on the card.
      club: { select: { id: true, slug: true, name: true, logoUrl: true, isVerified: true } },
      clubTeam: { select: { id: true, name: true, ageGroup: true, format: true } },
    },
    // priority desc keeps Pro-tier clubs at the top (currently all 0 = no-op).
    // status asc / createdAt desc preserves the existing ordering within priority.
    orderBy: [{ priority: "desc" }, { status: "asc" }, { createdAt: "desc" }],
  });

  // Build a URL that keeps current filters except the overridden ones.
  const hrefWith = (over: { status?: string | null; event?: string | null; clubs?: boolean | null }) => {
    const status = over.status === undefined ? (activeStatus === "ALL" ? null : activeStatus.toLowerCase()) : over.status;
    const event = over.event === undefined ? (activeEvent?.slug ?? null) : over.event;
    const clubs = over.clubs === undefined ? (clubsOnly ? "1" : null) : (over.clubs ? "1" : null);
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (event) p.set("event", event);
    if (clubs) p.set("clubs", clubs);
    const q = p.toString();
    return `/organizer/bookings${q ? `?${q}` : ""}`;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
      active
        ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
    }`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{tOrg("applications")}</h1>
        {activeEvent && (
          <a
            href={`/api/organizer/bookings/export?eventId=${activeEvent.id}`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
          >
            <Download className="h-3.5 w-3.5" /> {ui.export}
          </a>
        )}
      </div>

      {/* Per-event filter — shown when the organizer runs more than one event */}
      {events.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Link href={hrefWith({ event: null })} className={chip(!activeEvent)}>{ui.all}</Link>
          {events.map((e) => (
            <Link key={e.id} href={hrefWith({ event: e.slug })} className={chip(activeEvent?.id === e.id)}>
              {eventTitle(e)}
            </Link>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={hrefWith({ status: s === "ALL" ? null : s.toLowerCase() })}
            className={`${chip(activeStatus === s)} uppercase tracking-wider`}
          >
            {s === "ALL" ? t("filterAll") : t(`applicantStatus.${s}`)}
          </Link>
        ))}
      </div>

      {/* Source filter — toggle between all applicants and club-only. */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={hrefWith({ clubs: false })} className={chip(!clubsOnly)}>
          {ui.clubsAll}
        </Link>
        <Link href={hrefWith({ clubs: true })} className={`${chip(clubsOnly)} inline-flex items-center gap-1`}>
          <Users className="h-3 w-3" /> {ui.clubsOnly}
        </Link>
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
              <li
                key={b.id}
                className={`rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 ${
                  b.club ? "border-[var(--color-pitch-300)] ring-1 ring-[var(--color-pitch-100)]" : "border-[var(--color-border)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {b.club ? (
                        <Link
                          href={`/club/${b.club.slug}`}
                          className="inline-flex items-center gap-1.5 font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-pitch-700)] hover:underline"
                        >
                          {b.club.logoUrl && (
                            <span
                              className="h-5 w-5 rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${b.club.logoUrl})` }}
                              aria-hidden
                            />
                          )}
                          {b.club.name}
                          {b.club.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-[var(--color-pitch-600)]" aria-label="Verified club" />
                          )}
                        </Link>
                      ) : (
                        <span className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">{b.participantName}</span>
                      )}
                      <StatusBadge status={b.status} t={t} />
                      {b.club && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                          <Users className="h-3 w-3" /> Club
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-foreground)]">{en?.title ?? b.event.slug}</span>
                      {b.clubTeam && (
                        <> · <span className="font-semibold text-[var(--color-foreground)]">{b.clubTeam.name}</span> ({b.clubTeam.ageGroup}{b.clubTeam.format ? ` · ${b.clubTeam.format}` : ""})</>
                      )}
                      {" · "}{b.createdAt.toISOString().slice(0, 10)}
                    </div>
                    <details className="group mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline [&::-webkit-details-marker]:hidden">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                        {DETAILS_LABEL[locale] ?? DETAILS_LABEL.en}
                      </summary>
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
                    </details>
                    {b.organizerNote && (
                      <p className="mt-3 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-foreground)]">
                        <strong className="text-xs uppercase tracking-wider text-[var(--color-pitch-700)]">Your reply:</strong>{" "}
                        {b.organizerNote}
                      </p>
                    )}
                  </div>
                  {b.status === "NEW" && (
                    <div className="flex flex-col items-end gap-2">
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
                      <details className="group relative w-full">
                        <summary className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
                          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                          {ui.quickReplies}
                        </summary>
                        <div className="mt-2 flex flex-col gap-1.5">
                          <QuickReply bookingId={b.id} decision="accept" note={ui.tplAcceptDetails} />
                          <QuickReply bookingId={b.id} decision="accept" note={ui.tplAcceptDeposit} />
                          <QuickReply bookingId={b.id} decision="decline" note={ui.tplDeclineFull} />
                          <QuickReply bookingId={b.id} decision="decline" note={ui.tplDeclineAge} />
                        </div>
                      </details>
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

// One-click templated reply — same server action, but `note` is pre-filled
// so the templated text reaches both the email and the in-thread message.
function QuickReply({
  bookingId, decision, note,
}: { bookingId: string; decision: "accept" | "decline"; note: string }) {
  const isAccept = decision === "accept";
  return (
    <form action={respondBookingAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="decision" value={decision} />
      <input type="hidden" name="note" value={note} />
      <button
        type="submit"
        className={`w-full rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-left text-[11px] transition ${
          isAccept
            ? "border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-800)] hover:bg-[var(--color-pitch-100)]"
            : "border-red-100 bg-red-50 text-red-800 hover:bg-red-100"
        }`}
      >
        <span className="mr-1.5 font-bold">{isAccept ? "✓" : "✗"}</span>
        {note}
      </button>
    </form>
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
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{fieldLabel(f.label)}</dt>
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
