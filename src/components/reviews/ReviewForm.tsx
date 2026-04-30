"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RatingStars } from "./RatingStars";

type Props = {
  eventId: string;
  eventSlug: string;
  locale: string;
  action: (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
  labels: {
    ratingLabel: string;
    titleLabel: string;
    titlePlaceholder: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    bodyMin: string;
    submit: string;
    submitting: string;
    guidelines: string;
    errors: {
      ratingRequired: string;
      bodyTooShort: string;
      bodyTooLong: string;
    };
  };
};

const BODY_MIN = 50;
const BODY_MAX = 1500;
const TITLE_MAX = 80;

export function ReviewForm({ eventId, eventSlug, locale, action, labels }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const bodyLen = body.trim().length;
  const validBody = bodyLen >= BODY_MIN && bodyLen <= BODY_MAX;
  const canSubmit = rating > 0 && validBody && !pending;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(labels.errors.ratingRequired);
      return;
    }
    if (bodyLen < BODY_MIN) {
      setError(labels.errors.bodyTooShort);
      return;
    }
    if (bodyLen > BODY_MAX) {
      setError(labels.errors.bodyTooLong);
      return;
    }

    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("rating", String(rating));
    fd.set("title", title.trim());
    fd.set("body", body.trim());

    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        router.push(`/${locale}/events/${eventSlug}/review/thanks`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.ratingLabel} <span className="text-red-600">*</span>
        </label>
        <RatingStars value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="review-title" className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.titleLabel}
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          placeholder={labels.titlePlaceholder}
          maxLength={TITLE_MAX}
          className="block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
        />
        <div className="mt-1 text-right text-xs text-[var(--color-muted)]">
          {title.length}/{TITLE_MAX}
        </div>
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">
          {labels.bodyLabel} <span className="text-red-600">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
          placeholder={labels.bodyPlaceholder}
          rows={6}
          maxLength={BODY_MAX}
          className="block w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={bodyLen < BODY_MIN ? "text-[var(--color-muted)]" : "text-[var(--color-pitch-700)]"}>
            {bodyLen < BODY_MIN ? labels.bodyMin : "✓"}
          </span>
          <span className="text-[var(--color-muted)]">
            {bodyLen}/{BODY_MAX}
          </span>
        </div>
      </div>

      <p className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] p-3 text-xs text-[var(--color-muted-strong)]">
        {labels.guidelines}
      </p>

      {error && (
        <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-3 text-sm font-bold text-[var(--color-accent-fg)] transition hover:bg-[var(--color-pitch-600)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
