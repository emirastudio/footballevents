"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { magicLinkAction, type MagicLinkState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

type Labels = {
  email: string;
  submit: string;
  loading: string;
  sentTitle: string;
  sentBody: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function MagicLinkForm({ labels }: { labels: Labels }) {
  const [state, action] = useActionState<MagicLinkState, FormData>(magicLinkAction, null);
  const startedAt = useMemo(() => Date.now(), []);

  if (state?.sent) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-3 text-sm text-[var(--color-pitch-800)]">
        <p className="font-semibold">{labels.sentTitle}</p>
        <p className="mt-1 text-[var(--color-muted-strong)]">{labels.sentBody}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden
      />
      <input type="hidden" name="startedAt" value={startedAt} />
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.email}
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        />
      </label>
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitBtn labels={labels} />
    </form>
  );
}
