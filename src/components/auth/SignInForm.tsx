"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

type Labels = { email: string; password: string; submit: string; loading: string };

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function SignInForm({ labels }: { labels: Labels }) {
  const [state, action] = useActionState<AuthFormState, FormData>(signInAction, null);
  return (
    <form action={action} className="space-y-4">
      <Field name="email" type="email" autoComplete="email" required label={labels.email} />
      <Field name="password" type="password" autoComplete="current-password" required label={labels.password} />
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
  name, type, label, required, autoComplete,
}: {
  name: string; type: string; label: string; required?: boolean; autoComplete?: string;
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
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
      />
    </label>
  );
}
