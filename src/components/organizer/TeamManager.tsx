"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import { useFormStatus } from "react-dom";
import {
  inviteTeamMemberAction, removeTeamMemberAction, cancelInviteAction,
  type TeamState,
} from "@/app/actions/team";
import { UserPlus, Trash2, Mail, Check } from "lucide-react";

type Role = "OWNER" | "MANAGER" | "STAFF";
type Member = { id: string; role: Role; user: { name: string | null; email: string } };
type Invite = { id: string; email: string; role: Role };

const L: Record<string, {
  title: string; subtitle: string; email: string; manager: string; staff: string;
  managerHint: string; staffHint: string; invite: string; inviting: string; sent: string;
  members: string; pending: string; remove: string; cancel: string; none: string; owner: string;
}> = {
  en: { title: "Team access", subtitle: "Invite colleagues to help run your events. They sign in with their own account.",
    email: "colleague@email.com", manager: "Manager", staff: "Staff",
    managerHint: "Full event operations — events, applications, messages, venues, marketing. No billing or team.",
    staffHint: "Applications & messages only.", invite: "Send invite", inviting: "Sending…", sent: "Invitation sent ✓",
    members: "Members", pending: "Pending invites", remove: "Remove", cancel: "Cancel", none: "No team members yet.", owner: "Owner" },
  ru: { title: "Доступ команды", subtitle: "Пригласите коллег помогать с событиями. Они входят под своим аккаунтом.",
    email: "коллега@почта.com", manager: "Менеджер", staff: "Сотрудник",
    managerHint: "Полные операции — события, заявки, сообщения, площадки, маркетинг. Без биллинга и команды.",
    staffHint: "Только заявки и сообщения.", invite: "Отправить приглашение", inviting: "Отправка…", sent: "Приглашение отправлено ✓",
    members: "Участники", pending: "Ожидают приглашения", remove: "Удалить", cancel: "Отменить", none: "Пока нет участников команды.", owner: "Владелец" },
  de: { title: "Team-Zugang", subtitle: "Lade Kollegen ein, die bei deinen Events helfen. Sie melden sich mit eigenem Konto an.",
    email: "kollege@email.com", manager: "Manager", staff: "Mitarbeiter",
    managerHint: "Volle Event-Operationen — Events, Bewerbungen, Nachrichten, Orte, Marketing. Kein Billing/Team.",
    staffHint: "Nur Bewerbungen & Nachrichten.", invite: "Einladung senden", inviting: "Senden…", sent: "Einladung gesendet ✓",
    members: "Mitglieder", pending: "Offene Einladungen", remove: "Entfernen", cancel: "Abbrechen", none: "Noch keine Teammitglieder.", owner: "Inhaber" },
  es: { title: "Acceso del equipo", subtitle: "Invita a colegas a ayudar con tus eventos. Inician sesión con su propia cuenta.",
    email: "colega@email.com", manager: "Mánager", staff: "Personal",
    managerHint: "Operaciones completas — eventos, solicitudes, mensajes, sedes, marketing. Sin facturación ni equipo.",
    staffHint: "Solo solicitudes y mensajes.", invite: "Enviar invitación", inviting: "Enviando…", sent: "Invitación enviada ✓",
    members: "Miembros", pending: "Invitaciones pendientes", remove: "Quitar", cancel: "Cancelar", none: "Aún no hay miembros.", owner: "Propietario" },
};

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

export function TeamManager({ members, invites }: { members: Member[]; invites: Invite[] }) {
  const t = L[useLocale()] ?? L.en;
  const [state, action] = useActionState<TeamState, FormData>(inviteTeamMemberAction, null);

  const roleLabel = (r: Role) => (r === "OWNER" ? t.owner : r === "MANAGER" ? t.manager : t.staff);

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
      <h2 className="flex items-center gap-2 font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
        <UserPlus className="h-5 w-5 text-[var(--color-pitch-600)]" /> {t.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-strong)]">{t.subtitle}</p>

      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <input name="email" type="email" required placeholder={t.email} className={inputCls} />
        </div>
        <select name="role" defaultValue="STAFF" className={`${inputCls} sm:w-44`}>
          <option value="STAFF">{t.staff}</option>
          <option value="MANAGER">{t.manager}</option>
        </select>
        <InviteBtn label={t.invite} loading={t.inviting} />
      </form>
      {state?.ok && <p className="mt-2 text-sm font-semibold text-[var(--color-pitch-700)]">{t.sent}</p>}
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {/* Members */}
      <div className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t.members}</h3>
        {members.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t.none}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--color-foreground)]">{m.user.name || m.user.email}</div>
                  <div className="truncate text-xs text-[var(--color-muted)]">{m.user.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">{roleLabel(m.role)}</span>
                  <form action={removeTeamMemberAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label={t.remove}><Trash2 className="h-4 w-4" /></button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t.pending}</h3>
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)]">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-muted-strong)]">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                  <span className="truncate">{i.email}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-strong)]">{roleLabel(i.role)}</span>
                  <form action={cancelInviteAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <button type="submit" className="text-xs font-semibold text-[var(--color-muted-strong)] hover:text-red-600">{t.cancel}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function InviteBtn({ label, loading }: { label: string; loading: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-pitch-600)] disabled:opacity-50"
    >
      <Check className="h-4 w-4" /> {pending ? loading : label}
    </button>
  );
}
