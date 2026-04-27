"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";

type Labels = {
  hasPassword: boolean;
  current: string;
  next: string;
  submit: string;
  loading: string;
  saved: string;
  hint: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function PasswordForm({ labels }: { labels: Labels }) {
  const [state, action] = useActionState<ProfileState, FormData>(updatePasswordAction, null);

  return (
    <form action={action} className="space-y-3">
      {labels.hasPassword && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.current}
          </span>
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          />
        </label>
      )}
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.next}
        </span>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        />
        <span className="mt-1 block text-xs text-[var(--color-muted)]">{labels.hint}</span>
      </label>
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-2 text-sm text-[var(--color-pitch-800)]">
          {labels.saved}
        </p>
      )}
      <SubmitBtn labels={labels} />
    </form>
  );
}
