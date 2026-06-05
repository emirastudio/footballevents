"use client";

import { useFormStatus } from "react-dom";
import { archiveClubTeamAction, restoreClubTeamAction } from "@/app/actions/clubTeam";

// Tiny client component — wraps a server action in a form so the table row
// can call it without lifting to a full client island. Used in /club/teams.
export function ClubTeamArchiveButton({
  teamId,
  active,
  archiveLabel,
  restoreLabel,
  confirmText,
}: {
  teamId: string;
  active: boolean;
  archiveLabel: string;
  restoreLabel: string;
  confirmText: string;
}) {
  const action = active ? archiveClubTeamAction.bind(null, teamId) : restoreClubTeamAction.bind(null, teamId);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (active && !confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitBtn label={active ? archiveLabel : restoreLabel} danger={active} />
    </form>
  );
}

function SubmitBtn({ label, danger }: { label: string; danger: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-xs font-semibold underline-offset-2 transition hover:underline disabled:opacity-50 ${
        danger ? "text-red-600 hover:text-red-700" : "text-[var(--color-pitch-700)]"
      }`}
    >
      {label}
    </button>
  );
}
