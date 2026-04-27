"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

type Labels = {
  name: string; email: string; password: string; passwordHint: string;
  submit: string; loading: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function SignUpForm({ labels }: { labels: Labels }) {
  const [state, action] = useActionState<AuthFormState, FormData>(registerAction, null);
  // Snapshot of when the form was first rendered — humans take >= 2s to fill, bots are faster.
  const startedAtRef = useRef<number>(Date.now());
  return (
    <form action={action} className="space-y-4">
      {/* Honeypot — visually hidden, real users won't fill it. Bots auto-fill all inputs and trip. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
        <label>
          Website (leave blank)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="startedAt" value={startedAtRef.current} />

      <Field name="name" type="text" autoComplete="name" required label={labels.name} />
      <Field name="email" type="email" autoComplete="email" required label={labels.email} />
      <Field
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        label={labels.password}
        hint={labels.passwordHint}
      />
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitBtn labels={labels} />
    </form>
  );
}

function Field({
  name, type, label, required, autoComplete, minLength, hint,
}: {
  name: string; type: string; label: string; required?: boolean;
  autoComplete?: string; minLength?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      />
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
}
