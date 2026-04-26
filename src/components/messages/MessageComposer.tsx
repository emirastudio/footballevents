"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { sendMessageAction, type SendMessageState } from "@/app/actions/messages";

export function MessageComposer({
  threadId,
  placeholder,
  sendLabel,
  sendingLabel,
}: {
  threadId: string;
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SendMessageState, FormData>(sendMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        ref={textareaRef}
        name="body"
        rows={3}
        required
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        disabled={pending}
        className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/40 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3">
        {state?.error ? (
          <p className="text-xs text-red-600">{state.error}</p>
        ) : (
          <span className="text-[11px] text-[var(--color-muted)]">Cmd/Ctrl + Enter</span>
        )}
        <Button type="submit" variant="accent" size="sm" disabled={pending}>
          {pending ? sendingLabel : sendLabel}
        </Button>
      </div>
    </form>
  );
}
