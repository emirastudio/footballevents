"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccountAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

type Labels = {
  warning: string;
  confirmHint: string;
  submit: string;
  loading: string;
  cancel: string;
  open: string;
};

function SubmitBtn({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? labels.loading : labels.submit}
    </Button>
  );
}

export function DeleteAccountForm({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ProfileState, FormData>(deleteAccountAction, null);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        {labels.open}
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3 text-sm text-red-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <p>{labels.warning}</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-red-800">
          {labels.confirmHint}
        </span>
        <input
          type="text"
          name="confirm"
          required
          autoComplete="off"
          className="w-full rounded-[var(--radius-md)] border border-red-300 bg-white px-3.5 py-2.5 text-sm text-red-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        />
      </label>
      {state?.error && (
        <p className="rounded-[var(--radius-md)] border border-red-300 bg-white px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <SubmitBtn labels={labels} />
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}
