"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestEmailChangeAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";

type Labels = {
  current: string;
  next: string;
  submit: string;
  loading: string;
  sent: string;
  pending: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function EmailChangeForm({
  currentEmail,
  pendingEmail,
  labels,
}: {
  currentEmail: string;
  pendingEmail: string | null;
  labels: Labels;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(requestEmailChangeAction, null);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-[var(--color-muted-strong)]">
        {labels.current}: <strong>{currentEmail}</strong>
      </p>
      {pendingEmail && (
        <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.pending}: <strong>{pendingEmail}</strong>
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.next}
        </span>
        <input
          type="email"
          name="newEmail"
          required
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        />
      </label>
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-2 text-sm text-[var(--color-pitch-800)]">
          {labels.sent}
        </p>
      )}
      <SubmitBtn labels={labels} />
    </form>
  );
}
