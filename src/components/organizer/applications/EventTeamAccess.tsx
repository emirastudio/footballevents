"use client";

import { useFormStatus } from "react-dom";
import { toggleEventAccessAction } from "@/app/actions/organizerTeam";
import { Users, Check } from "lucide-react";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  hasAccess: boolean; // current grant state for this event
};

export function EventTeamAccess({
  eventId,
  members,
  labels,
}: {
  eventId: string;
  members: TeamMember[];
  labels: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    everyoneNoteTitle: string;
    everyoneNoteBody: string;
    roleLabels: Record<"OWNER" | "MANAGER" | "STAFF", string>;
    grant: string;
    revoke: string;
  };
}) {
  // Only STAFF can be restricted per-event. OWNER and MANAGER always see all
  // events by design; including them in the list would confuse the operator
  // (they're not toggleable).
  const restrictable = members.filter((m) => m.role === "STAFF");

  return (
    <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] open:shadow-[var(--shadow-xs)]">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
        <Users className="h-4 w-4 text-[var(--color-pitch-600)]" />
        <span className="flex-1">{labels.title}</span>
        <span className="text-xs font-normal text-[var(--color-muted)]">
          {restrictable.length === 0
            ? labels.emptyTitle
            : `${restrictable.filter((m) => m.hasAccess).length}/${restrictable.length}`}
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--color-border)] p-4">
        <p className="text-xs text-[var(--color-muted-strong)]">{labels.subtitle}</p>

        <div className="rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] p-3 text-xs text-[var(--color-pitch-800)]">
          <p className="font-semibold">{labels.everyoneNoteTitle}</p>
          <p className="mt-1">{labels.everyoneNoteBody}</p>
        </div>

        {restrictable.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4 text-center text-sm text-[var(--color-muted)]">
            <p className="font-semibold">{labels.emptyTitle}</p>
            <p className="mt-1 text-xs">{labels.emptyBody}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {restrictable.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                    {m.name ?? m.email}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {m.email} · {labels.roleLabels[m.role]}
                  </p>
                </div>
                <ToggleAccessButton
                  memberId={m.id}
                  eventId={eventId}
                  hasAccess={m.hasAccess}
                  grantLabel={labels.grant}
                  revokeLabel={labels.revoke}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function ToggleAccessButton({
  memberId, eventId, hasAccess, grantLabel, revokeLabel,
}: { memberId: string; eventId: string; hasAccess: boolean; grantLabel: string; revokeLabel: string }) {
  const action = toggleEventAccessAction.bind(null, memberId, eventId);
  return (
    <form action={action}>
      <SubmitBtn hasAccess={hasAccess} grantLabel={grantLabel} revokeLabel={revokeLabel} />
    </form>
  );
}

function SubmitBtn({ hasAccess, grantLabel, revokeLabel }: { hasAccess: boolean; grantLabel: string; revokeLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
        hasAccess
          ? "border border-[var(--color-pitch-300)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-800)] hover:bg-[var(--color-pitch-100)]"
          : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)]"
      }`}
    >
      {hasAccess && <Check className="h-3 w-3" />}
      {hasAccess ? revokeLabel : grantLabel}
    </button>
  );
}
