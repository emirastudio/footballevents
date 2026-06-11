"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bug, X, Camera, Trash2, Check } from "lucide-react";
import { submitBugReportAction, type BugReportState } from "@/app/actions/bugReport";
import { readConsoleBuffer } from "@/lib/console-capture";

type Labels = {
  title: string;
  subtitle: string;
  categoryLabel: string;
  categories: Record<string, string>;
  messageLabel: string;
  messagePlaceholder: string;
  emailLabel: string;
  emailHint: string;
  screenshotLabel: string;
  screenshotCapturing: string;
  screenshotAttached: string;
  screenshotRemove: string;
  submit: string;
  submitting: string;
  sentTitle: string;
  sentBody: string;
  sentClose: string;
  cancel: string;
};

const CATEGORIES = ["BUG", "TRANSLATION", "WRONG_INFO", "FORM", "OTHER"] as const;

export function BugReportModal({
  locale,
  labels,
  onClose,
}: {
  locale: string;
  labels: Labels;
  onClose: () => void;
}) {
  const [state, action] = useActionState<BugReportState, FormData>(submitBugReportAction, null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  // Anti-spam: track form open time so we can reject sub-2s submissions.
  // Lazy-initialised useState keeps Date.now() out of the render path while
  // still locking the value to first mount.
  const [startedAt] = useState<number>(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on Esc for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function captureScreenshot() {
    if (capturing) return;
    setCapturing(true);
    try {
      // Hide our own modal so it doesn't end up in the screenshot.
      const node = wrapRef.current;
      if (node) node.style.visibility = "hidden";
      // Yield a frame for the hide to paint.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const { toJpeg } = await import("html-to-image");
      const data = await toJpeg(document.body, {
        quality: 0.7,
        pixelRatio: 1,
        cacheBust: true,
        // Cap dimensions to keep payload manageable even on retina monitors.
        canvasWidth: Math.min(window.innerWidth, 1600),
        canvasHeight: Math.min(window.innerHeight, 1200),
      });
      if (node) node.style.visibility = "";
      setScreenshot(data);
    } catch {
      // Many sites with CSP / cross-origin images will fail — fall through
      // silently. The report still files without a screenshot.
    } finally {
      setCapturing(false);
    }
  }

  if (state?.ok) {
    return (
      <Backdrop onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
            {labels.sentTitle}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.sentBody}</p>
          <button
            onClick={onClose}
            className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-pitch-700)]"
          >
            {labels.sentClose}
          </button>
        </div>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={onClose} innerRef={wrapRef}>
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <Bug className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
            {labels.title}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{labels.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.cancel}
          className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

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
        <input
          type="hidden"
          name="url"
          value={typeof window !== "undefined" ? window.location.href : ""}
        />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="consoleErrors"
          value={JSON.stringify(readConsoleBuffer())}
        />
        {screenshot && <input type="hidden" name="screenshot" value={screenshot} />}

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.categoryLabel}
          </span>
          <select
            name="category"
            defaultValue="BUG"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {labels.categories[c] ?? c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.messageLabel}
          </span>
          <textarea
            name="message"
            rows={5}
            required
            minLength={5}
            maxLength={4000}
            placeholder={labels.messagePlaceholder}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.emailLabel}
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-pitch-500)] focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
          />
          <span className="mt-1 block text-xs text-[var(--color-muted)]">{labels.emailHint}</span>
        </label>

        {screenshot ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] p-2">
            <img
              src={screenshot}
              alt="Screenshot preview"
              className="h-12 w-20 rounded object-cover"
            />
            <span className="flex-1 text-xs font-semibold text-[var(--color-pitch-800)]">
              {labels.screenshotAttached}
            </span>
            <button
              type="button"
              onClick={() => setScreenshot(null)}
              className="grid h-7 w-7 place-items-center rounded text-[var(--color-muted-strong)] hover:bg-white hover:text-red-600"
              aria-label={labels.screenshotRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={captureScreenshot}
            disabled={capturing}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-300)] hover:text-[var(--color-pitch-700)] disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {capturing ? labels.screenshotCapturing : labels.screenshotLabel}
          </button>
        )}

        {state?.ok === false && (
          <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-[var(--color-muted-strong)] hover:text-[var(--color-foreground)]"
          >
            {labels.cancel}
          </button>
          <SubmitButton labels={labels} />
        </div>
      </form>
    </Backdrop>
  );
}

function SubmitButton({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-pitch-600)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--color-pitch-700)] disabled:opacity-60"
    >
      {pending ? labels.submitting : labels.submit}
    </button>
  );
}

function Backdrop({
  children,
  onClose,
  innerRef,
}: {
  children: React.ReactNode;
  onClose: () => void;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={innerRef}
        className="w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]"
      >
        {children}
      </div>
    </div>
  );
}
