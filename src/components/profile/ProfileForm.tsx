"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/upload/ImageUpload";

type Locale = "en" | "ru" | "de" | "es";

type Labels = {
  name: string;
  avatar: string;
  locale: string;
  submit: string;
  loading: string;
  saved: string;
  uploadLabel: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function ProfileForm({
  defaults,
  labels,
}: {
  defaults: { name: string; image: string; preferredLocale: Locale };
  labels: Labels;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, null);

  return (
    <form action={action} className="space-y-4">
      <ImageUpload
        name="image"
        kind="user-avatar"
        defaultUrl={defaults.image || undefined}
        label={labels.avatar}
      />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.name}
        </span>
        <input
          name="name"
          defaultValue={defaults.name}
          required
          maxLength={80}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.locale}
        </span>
        <select
          name="preferredLocale"
          defaultValue={defaults.preferredLocale}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
        </select>
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
