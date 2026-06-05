"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  bulkRespondBookingsAction,
  messageApplicantsAction,
  type MessageApplicantsState,
} from "@/app/actions/organizerBookings";
import {
  Check, X, Mail, Phone, Users, Download, MessageSquare,
  CheckCheck, Search, ChevronUp, ChevronDown, ChevronsUpDown, Plus,
} from "lucide-react";

export type CustomColumn = {
  id: string;        // matches Booking.customFields key
  label: string;     // localized field label
  type:
    | "text" | "textarea" | "email" | "phone" | "number" | "date"
    | "select" | "multiselect" | "checkboxes" | "radio"
    | "consent" | "rules" | "file" | "size"
    | "country" | "countrycity" | "yesno";
};

export type ApplicationRow = {
  id: string;
  status: "NEW" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED" | "WAITLIST";
  createdAt: string; // ISO
  participantName: string;
  participantAge: number | null;
  teamName: string | null;
  partySize: number;
  contactEmail: string;
  contactPhone: string | null;
  comment: string | null;
  organizerNote: string | null;
  isClub: boolean;
  clubSlug: string | null;
  clubName: string | null;
  clubLogo: string | null;
  // Answers to the organizer's custom registration form for this booking,
  // keyed by FormField.id. Values can be strings, numbers, booleans or arrays
  // depending on the field type. Rendered into the dynamic columns.
  customFields: Record<string, unknown>;
};

type Labels = {
  // Toolbar
  searchPlaceholder: string;
  exportSelected: string;
  exportAll: string;
  noResults: string;
  columnsButton: string; // "+ Columns"
  columnsPickerTitle: string;
  columnsAge: string; columnsComment: string;
  yes: string; no: string;
  // Columns
  colSelect: string; colApplicant: string; colTeam: string; colContact: string;
  colParty: string; colStatus: string; colDate: string; colActions: string;
  // Actions
  accept: string; decline: string; message: string;
  selectedCount: string; // ICU plural
  bulkAccept: string; bulkDecline: string; bulkMessage: string;
  clear: string;
  // Modal
  modalTitle: string; modalSubtitle: string;
  modalSubject: string; modalBody: string; modalCancel: string; modalSend: string;
  modalSending: string; modalSuccess: string;
  modalDeliveredWith: string; // "{n} via inbox + email"
  modalDeliveredEmailOnly: string; // "{n} via email only"
  // Status labels
  statuses: Record<string, string>;
};

// Built-in columns the operator can hide/show. The Applicant column itself
// stays mandatory — without it the row has no identity.
const BUILTIN_COLUMNS = ["team", "contact", "party", "status", "date", "age", "comment"] as const;
type BuiltinKey = (typeof BUILTIN_COLUMNS)[number];

type SortBy = "date" | "name" | "status" | "party";
type SortDir = "asc" | "desc";

export function ApplicationsTable({
  rows,
  customColumns,
  labels,
  exportHrefBase,
  storageKey,
}: {
  rows: ApplicationRow[];
  customColumns: CustomColumn[];   // event-specific extra columns (organizer's form fields)
  labels: Labels;
  exportHrefBase: string;          // e.g. /api/organizer/bookings/export?eventId=evt_…
  storageKey: string;              // namespaced per event so each table remembers its columns
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [msgOpen, setMsgOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "accept" | "decline">(null);
  const [colsOpen, setColsOpen] = useState(false);

  // Column visibility. Hidden by default for noisy/optional columns; the
  // mandatory Applicant column has no toggle. Custom-form columns are
  // visible by default (organizer wants to see what they collected) but can
  // be hidden via the picker.
  const allKeys: string[] = [
    ...BUILTIN_COLUMNS,
    ...customColumns.map((c) => `cf:${c.id}`),
  ];
  const defaultHidden = new Set<string>(["age", "comment"]);

  const [hidden, setHidden] = useState<Set<string>>(() => new Set(defaultHidden));
  // Restore from localStorage after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHidden(new Set(JSON.parse(raw) as string[]));
    } catch {/* corrupt JSON or quota — fall back to defaults */}
  }, [storageKey]);
  // Persist whenever the selection changes (skip the initial empty mount).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(Array.from(hidden))); } catch {/* quota */}
  }, [hidden, storageKey]);

  const isVisible = (key: string) => !hidden.has(key);
  const toggleColumn = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) =>
        [r.participantName, r.teamName, r.contactEmail, r.contactPhone, r.clubName]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q)),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":
          cmp = a.createdAt.localeCompare(b.createdAt); break;
        case "name":
          cmp = a.participantName.localeCompare(b.participantName); break;
        case "status":
          cmp = a.status.localeCompare(b.status); break;
        case "party":
          cmp = a.partySize - b.partySize; break;
      }
      return cmp * dir;
    });
    return list;
  }, [rows, query, sortBy, sortDir]);

  const allOnPageSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.id));
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const exportHref = (() => {
    if (someSelected) {
      const ids = Array.from(selected).join(",");
      return `${exportHrefBase}&ids=${ids}`;
    }
    return exportHrefBase;
  })();

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected],
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          />
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setColsOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.columnsButton}
          </button>
          {colsOpen && (
            <>
              {/* Click-away catcher */}
              <div className="fixed inset-0 z-30" onClick={() => setColsOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-60 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-lg)]">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {labels.columnsPickerTitle}
                </p>
                {/* Built-ins */}
                <ColumnToggle k="team" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.colTeam} />
                <ColumnToggle k="contact" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.colContact} />
                <ColumnToggle k="party" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.colParty} />
                <ColumnToggle k="status" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.colStatus} />
                <ColumnToggle k="date" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.colDate} />
                <ColumnToggle k="age" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.columnsAge} />
                <ColumnToggle k="comment" labels={labels} hidden={hidden} onToggle={toggleColumn} label={labels.columnsComment} />
                {customColumns.length > 0 && (
                  <>
                    <div className="my-1 border-t border-[var(--color-border)]" />
                    {customColumns.map((c) => (
                      <ColumnToggle
                        key={c.id}
                        k={`cf:${c.id}`}
                        labels={labels}
                        hidden={hidden}
                        onToggle={toggleColumn}
                        label={c.label}
                      />
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
        >
          <Download className="h-3.5 w-3.5" />
          {someSelected ? labels.exportSelected : labels.exportAll}
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  aria-label={labels.colSelect}
                  className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-pitch-600)] focus:ring-[var(--color-pitch-500)]"
                />
              </th>
              <SortableHeader label={labels.colApplicant} dir={sortBy === "name" ? sortDir : null} onClick={() => toggleSort("name")} />
              {isVisible("team") && <th className="px-3 py-2.5 text-left">{labels.colTeam}</th>}
              {isVisible("contact") && <th className="px-3 py-2.5 text-left">{labels.colContact}</th>}
              {isVisible("party") && <SortableHeader label={labels.colParty} dir={sortBy === "party" ? sortDir : null} onClick={() => toggleSort("party")} className="w-16" />}
              {isVisible("status") && <SortableHeader label={labels.colStatus} dir={sortBy === "status" ? sortDir : null} onClick={() => toggleSort("status")} className="w-28" />}
              {isVisible("date") && <SortableHeader label={labels.colDate} dir={sortBy === "date" ? sortDir : null} onClick={() => toggleSort("date")} className="w-28" />}
              {isVisible("age") && <th className="px-3 py-2.5 text-left w-16">{labels.columnsAge}</th>}
              {customColumns.map((c) => isVisible(`cf:${c.id}`) && (
                <th key={c.id} className="px-3 py-2.5 text-left">{c.label}</th>
              ))}
              <th className="px-3 py-2.5 text-right">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8 + customColumns.length} className="px-3 py-12 text-center text-sm text-[var(--color-muted)]">
                  {labels.noResults}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <Row
                  key={r.id}
                  row={r}
                  selected={selected.has(r.id)}
                  onToggle={() => toggleRow(r.id)}
                  labels={labels}
                  customColumns={customColumns}
                  visibility={{
                    team: isVisible("team"),
                    contact: isVisible("contact"),
                    party: isVisible("party"),
                    status: isVisible("status"),
                    date: isVisible("date"),
                    age: isVisible("age"),
                    comment: isVisible("comment"),
                  }}
                  hidden={hidden}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky bulk action bar */}
      {someSelected && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-4 py-3 shadow-[var(--shadow-md)]">
          <span className="font-semibold text-[var(--color-pitch-800)]">
            {labels.selectedCount.replace("{n}", String(selected.size))}
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <button
              onClick={() => setConfirmAction("accept")}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-pitch-700)]"
            >
              <CheckCheck className="h-3.5 w-3.5" /> {labels.bulkAccept}
            </button>
            <button
              onClick={() => setConfirmAction("decline")}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" /> {labels.bulkDecline}
            </button>
            <button
              onClick={() => setMsgOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-pitch-300)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-pitch-700)] hover:bg-[var(--color-pitch-100)]"
            >
              <MessageSquare className="h-3.5 w-3.5" /> {labels.bulkMessage}
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="text-xs font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
          >
            {labels.clear}
          </button>
        </div>
      )}

      {/* Bulk-respond confirm dialog */}
      {confirmAction && (
        <ConfirmBulkRespond
          decision={confirmAction}
          ids={Array.from(selected)}
          count={selected.size}
          labels={labels}
          onDone={() => { setConfirmAction(null); clearSelection(); }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Bulk-message modal */}
      {msgOpen && (
        <MessageModal
          rows={selectedRows}
          labels={labels}
          onClose={() => setMsgOpen(false)}
          onDone={() => { setMsgOpen(false); clearSelection(); }}
        />
      )}
    </div>
  );
}

function SortableHeader({
  label, dir, onClick, className,
}: { label: string; dir: SortDir | null; onClick: () => void; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left ${className ?? ""}`}>
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]">
        {label}
        {dir === "asc" ? <ChevronUp className="h-3 w-3" /> :
         dir === "desc" ? <ChevronDown className="h-3 w-3" /> :
         <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );
}

function ColumnToggle({
  k, label, hidden, onToggle,
}: { k: string; label: string; hidden: Set<string>; onToggle: (k: string) => void; labels: Labels }) {
  const shown = !hidden.has(k);
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={`flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition ${
        shown ? "bg-[var(--color-pitch-50)] text-[var(--color-pitch-800)]" : "text-[var(--color-muted-strong)] hover:bg-[var(--color-bg-muted)]"
      }`}
    >
      <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border ${shown ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-500)] text-white" : "border-[var(--color-border-strong)]"}`}>
        {shown && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function formatCustomCell(value: unknown, yes: string, no: string): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? yes : no;
  const s = String(value).trim();
  if (s === "yes") return yes;
  if (s === "no") return no;
  return s || "—";
}

type RowVisibility = {
  team: boolean; contact: boolean; party: boolean;
  status: boolean; date: boolean; age: boolean; comment: boolean;
};

function Row({
  row, selected, onToggle, labels, customColumns, visibility, hidden,
}: {
  row: ApplicationRow; selected: boolean; onToggle: () => void; labels: Labels;
  customColumns: CustomColumn[]; visibility: RowVisibility; hidden: Set<string>;
}) {
  const [singleMsgOpen, setSingleMsgOpen] = useState(false);
  const dateStr = new Date(row.createdAt).toISOString().slice(0, 10);
  const STATUS_STYLE: Record<string, string> = {
    NEW:        "bg-amber-100 text-amber-800",
    ACCEPTED:   "bg-emerald-100 text-emerald-800",
    DECLINED:   "bg-red-100 text-red-700",
    CANCELLED:  "bg-zinc-100 text-zinc-700",
    COMPLETED:  "bg-sky-100 text-sky-800",
    WAITLIST:   "bg-violet-100 text-violet-800",
  };
  const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//.test(v);

  return (
    <>
      <tr className={`border-b border-[var(--color-border)] last:border-0 transition ${selected ? "bg-[var(--color-pitch-50)]/40" : "hover:bg-[var(--color-surface-muted)]"}`}>
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-pitch-600)] focus:ring-[var(--color-pitch-500)]"
            aria-label={labels.colSelect}
          />
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            {row.clubLogo && (
              <span
                className="h-6 w-6 shrink-0 rounded-full bg-cover bg-center bg-[var(--color-bg-muted)]"
                style={{ backgroundImage: `url(${row.clubLogo})` }}
                aria-hidden
              />
            )}
            <div className="min-w-0">
              {row.isClub && row.clubSlug ? (
                <a
                  href={`/club/${row.clubSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-semibold text-[var(--color-pitch-700)] hover:underline"
                >
                  {row.clubName ?? row.participantName}
                </a>
              ) : (
                <span className="truncate font-semibold text-[var(--color-foreground)]">{row.participantName}</span>
              )}
              {row.isClub && (
                <span className="ml-1 inline-flex rounded-full bg-[var(--color-pitch-50)] px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                  <Users className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          </div>
        </td>
        {visibility.team && (
          <td className="px-3 py-3 text-xs text-[var(--color-muted-strong)]">
            {row.teamName ?? "—"}
          </td>
        )}
        {visibility.contact && (
          <td className="px-3 py-3">
            <div className="flex flex-col gap-0.5 text-xs">
              <a href={`mailto:${row.contactEmail}`} className="inline-flex items-center gap-1 text-[var(--color-foreground)] hover:text-[var(--color-pitch-700)]">
                <Mail className="h-3 w-3 text-[var(--color-muted)]" />
                <span className="truncate">{row.contactEmail}</span>
              </a>
              {row.contactPhone && (
                <a href={`tel:${row.contactPhone}`} className="inline-flex items-center gap-1 text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
                  <Phone className="h-3 w-3 text-[var(--color-muted)]" />
                  <span className="truncate">{row.contactPhone}</span>
                </a>
              )}
            </div>
          </td>
        )}
        {visibility.party && (
          <td className="px-3 py-3 text-center text-sm font-semibold text-[var(--color-foreground)]">
            {row.partySize}
          </td>
        )}
        {visibility.status && (
          <td className="px-3 py-3">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[row.status]}`}>
              {labels.statuses[row.status]}
            </span>
          </td>
        )}
        {visibility.date && (
          <td className="px-3 py-3 text-xs text-[var(--color-muted)]">{dateStr}</td>
        )}
        {visibility.age && (
          <td className="px-3 py-3 text-xs text-[var(--color-muted-strong)]">
            {row.participantAge ?? "—"}
          </td>
        )}
        {customColumns.map((c) => {
          if (hidden.has(`cf:${c.id}`)) return null;
          const v = row.customFields[c.id];
          return (
            <td key={c.id} className="px-3 py-3 text-xs text-[var(--color-muted-strong)]">
              {isUrl(v) ? (
                <a href={String(v)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
                  {c.type === "file" ? "📎 file" : String(v)}
                </a>
              ) : (
                <span className="line-clamp-2">{formatCustomCell(v, labels.yes, labels.no)}</span>
              )}
            </td>
          );
        })}
        <td className="px-3 py-3">
          <div className="flex items-center justify-end gap-1">
            {row.status === "NEW" && (
              <>
                <SingleActionForm bookingId={row.id} decision="accept" label={labels.accept} icon={<Check className="h-3 w-3" />} accent />
                <SingleActionForm bookingId={row.id} decision="decline" label={labels.decline} icon={<X className="h-3 w-3" />} />
              </>
            )}
            <button
              onClick={() => setSingleMsgOpen(true)}
              className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-bold text-[var(--color-pitch-700)] hover:border-[var(--color-pitch-300)]"
              title={labels.message}
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
      {visibility.comment && (row.comment || row.organizerNote) && (
        <tr className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-muted)]/40">
          <td colSpan={8 + customColumns.length} className="px-3 py-2">
            {row.comment && (
              <p className="text-xs text-[var(--color-muted-strong)]">
                <span className="font-bold uppercase tracking-wider text-[var(--color-muted)]">Note:</span> {row.comment}
              </p>
            )}
            {row.organizerNote && (
              <p className="mt-1 text-xs text-[var(--color-pitch-800)]">
                <span className="font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">Reply:</span> {row.organizerNote}
              </p>
            )}
          </td>
        </tr>
      )}
      {singleMsgOpen && (
        <tr>
          <td colSpan={8 + customColumns.length} className="p-0">
            <MessageModal
              rows={[row]}
              labels={labels}
              onClose={() => setSingleMsgOpen(false)}
              onDone={() => setSingleMsgOpen(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function SingleActionForm({
  bookingId, decision, label, icon, accent,
}: { bookingId: string; decision: "accept" | "decline"; label: string; icon: React.ReactNode; accent?: boolean }) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        formData.append("bookingIds", bookingId);
        formData.append("decision", decision);
        startTransition(() => bulkRespondBookingsAction(formData));
      }}
    >
      <button
        type="submit"
        title={label}
        className={`inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[10px] font-bold transition ${
          accent
            ? "bg-[var(--color-pitch-500)] text-white hover:bg-[var(--color-pitch-600)]"
            : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-red-300 hover:text-red-700"
        }`}
      >
        {icon}
      </button>
    </form>
  );
}

function ConfirmBulkRespond({
  decision, ids, count, labels, onDone, onCancel,
}: {
  decision: "accept" | "decline"; ids: string[]; count: number; labels: Labels;
  onDone: () => void; onCancel: () => void;
}) {
  const isAccept = decision === "accept";
  const word = isAccept ? labels.bulkAccept : labels.bulkDecline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]">
        <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
          {word} · {count}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
          {labels.selectedCount.replace("{n}", String(count))}
        </p>
        <form
          action={(formData) => {
            ids.forEach((id) => formData.append("bookingIds", id));
            formData.append("decision", decision);
            bulkRespondBookingsAction(formData).then(onDone);
          }}
          className="mt-4 flex justify-end gap-2"
        >
          <button type="button" onClick={onCancel} className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]">
            {labels.modalCancel}
          </button>
          <BulkConfirmSubmit isAccept={isAccept} label={word} />
        </form>
      </div>
    </div>
  );
}

function BulkConfirmSubmit({ isAccept, label }: { isAccept: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
        isAccept
          ? "bg-[var(--color-pitch-600)] text-white hover:bg-[var(--color-pitch-700)]"
          : "border border-red-300 bg-white text-red-700 hover:bg-red-50"
      }`}
    >
      {label}
    </button>
  );
}

function MessageModal({
  rows, labels, onClose, onDone,
}: {
  rows: ApplicationRow[]; labels: Labels; onClose: () => void; onDone: () => void;
}) {
  const [state, action] = useActionState<MessageApplicantsState, FormData>(messageApplicantsAction, null);

  if (state?.ok && state.delivered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)] text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
            {labels.modalSuccess}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
            {state.delivered.withAccount > 0 && (
              <span className="block">{labels.modalDeliveredWith.replace("{n}", String(state.delivered.withAccount))}</span>
            )}
            {state.delivered.emailOnly > 0 && (
              <span className="block">{labels.modalDeliveredEmailOnly.replace("{n}", String(state.delivered.emailOnly))}</span>
            )}
          </p>
          <button
            onClick={onDone}
            className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-pitch-700)]"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]">
        <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
          {labels.modalTitle.replace("{n}", String(rows.length))}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{labels.modalSubtitle}</p>

        <div className="mt-3 max-h-24 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-2 text-xs text-[var(--color-muted-strong)]">
          {rows.map((r) => (
            <span key={r.id} className="mr-2 inline-block">
              {r.clubName ?? r.participantName} ·{" "}
              <span className="text-[var(--color-muted)]">{r.contactEmail}</span>
            </span>
          ))}
        </div>

        <form action={action} className="mt-4 space-y-3">
          {rows.map((r) => (
            <input key={r.id} type="hidden" name="bookingIds" value={r.id} />
          ))}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {labels.modalSubject}
            </span>
            <input
              name="subject"
              maxLength={140}
              required
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {labels.modalBody}
            </span>
            <textarea
              name="body"
              rows={6}
              maxLength={4000}
              required
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
            />
          </label>
          {state?.error && (
            <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
            >
              {labels.modalCancel}
            </button>
            <MessageSubmit labels={labels} />
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageSubmit({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-pitch-700)] disabled:opacity-60"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {pending ? labels.modalSending : labels.modalSend}
    </button>
  );
}
