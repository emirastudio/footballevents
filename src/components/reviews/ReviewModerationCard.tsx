"use client";

import { useState, useTransition } from "react";
import { Star, ShieldCheck, Flag, Check, EyeOff, MessageSquare, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RatingStars } from "./RatingStars";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  rejectedReason: string | null;
  organizerReply: string | null;
  organizerRepliedAt: Date | null;
  createdAt: Date;
  authorName: string;
  eventSlug: string;
  eventTitle: string;
  hoursUntilAutoApprove: number | null;
};

type Action = (formData: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;

type Props = {
  review: Review;
  approveAction: Action;
  rejectAction: Action;
  replyAction: Action;
  flagAction: Action;
  labels: {
    approveCta: string;
    rejectCta: string;
    rejectReasonLabel: string;
    rejectReasonPlaceholder: string;
    rejectConfirm: string;
    flagCta: string;
    flagReasonLabel: string;
    flagReasonPlaceholder: string;
    replyLabel: string;
    replyPlaceholder: string;
    replyCta: string;
    replyEditCta: string;
    openOnEvent: string;
    submittedBy: string;
    autoApproveIn: string;
    rejectedReasonLabel: string;
    yourReply: string;
  };
};

export function ReviewModerationCard({
  review,
  approveAction,
  rejectAction,
  replyAction,
  flagAction,
  labels,
}: Props) {
  const [pending, start] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  const [showReply, setShowReply] = useState(!!review.organizerReply);
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [reply, setReply] = useState(review.organizerReply ?? "");
  const [error, setError] = useState("");

  function run(action: Action, fd: FormData) {
    setError("");
    start(async () => {
      const res = await action(fd);
      if (!res.ok) setError(res.error);
    });
  }

  function onApprove() {
    const fd = new FormData();
    fd.set("reviewId", review.id);
    run(approveAction, fd);
  }

  function onReject() {
    const fd = new FormData();
    fd.set("reviewId", review.id);
    fd.set("reason", rejectReason.trim());
    run(rejectAction, fd);
    setShowReject(false);
  }

  function onFlag() {
    const fd = new FormData();
    fd.set("reviewId", review.id);
    fd.set("reason", flagReason.trim());
    run(flagAction, fd);
    setShowFlag(false);
  }

  function onReply() {
    if (!reply.trim()) return;
    const fd = new FormData();
    fd.set("reviewId", review.id);
    fd.set("reply", reply.trim());
    run(replyAction, fd);
  }

  const created = review.createdAt.toLocaleDateString();

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      {/* Header: event + author + auto-approve countdown */}
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/events/${review.eventSlug}`}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)] hover:underline"
          >
            {review.eventTitle}
          </Link>
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            {labels.submittedBy.replace("{name}", review.authorName)} · {created}
          </div>
        </div>
        {review.status === "PENDING" && review.hoursUntilAutoApprove != null && review.hoursUntilAutoApprove > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            {labels.autoApproveIn.replace("{hours}", String(review.hoursUntilAutoApprove))}
          </span>
        )}
      </header>

      {/* Rating + body */}
      <div className="mb-3 flex items-center gap-3">
        <RatingStars value={review.rating} readOnly size="sm" />
        <span className="text-sm font-bold text-[var(--color-foreground)]">{review.rating}/5</span>
      </div>
      {review.title && (
        <h3 className="mb-1 font-semibold text-[var(--color-foreground)]">{review.title}</h3>
      )}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted-strong)]">{review.body}</p>

      {/* Reject reason banner (when REJECTED) */}
      {review.status === "REJECTED" && review.rejectedReason && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>{labels.rejectedReasonLabel}</strong> {review.rejectedReason}
        </div>
      )}

      {/* Existing organizer reply */}
      {review.organizerReply && !showReply && (
        <div className="mt-4 rounded-[var(--radius-md)] border-l-4 border-[var(--color-pitch-400)] bg-[var(--color-pitch-50)] p-3.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
            <ShieldCheck className="h-3.5 w-3.5" /> {labels.yourReply}
          </div>
          <p className="text-sm text-[var(--color-foreground)]">{review.organizerReply}</p>
        </div>
      )}

      {/* Reply form */}
      {showReply && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3">
          <label className="mb-1.5 block text-xs font-semibold text-[var(--color-foreground)]">
            {labels.replyLabel}
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value.slice(0, 1500))}
            placeholder={labels.replyPlaceholder}
            rows={3}
            className="block w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={onReply}
              disabled={pending || !reply.trim()}
              className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent-fg)] disabled:opacity-50"
            >
              {review.organizerReply ? labels.replyEditCta : labels.replyCta}
            </button>
            <button
              onClick={() => { setShowReply(false); setReply(review.organizerReply ?? ""); }}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Reject form */}
      {showReject && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3">
          <label className="mb-1.5 block text-xs font-semibold text-red-900">{labels.rejectReasonLabel}</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value.slice(0, 500))}
            placeholder={labels.rejectReasonPlaceholder}
            rows={2}
            className="block w-full resize-y rounded-[var(--radius-md)] border border-red-300 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={onReject}
              disabled={pending}
              className="rounded-[var(--radius-md)] bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {labels.rejectCta}
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Flag form */}
      {showFlag && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-orange-200 bg-orange-50 p-3">
          <label className="mb-1.5 block text-xs font-semibold text-orange-900">{labels.flagReasonLabel}</label>
          <textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value.slice(0, 500))}
            placeholder={labels.flagReasonPlaceholder}
            rows={2}
            className="block w-full resize-y rounded-[var(--radius-md)] border border-orange-300 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={onFlag}
              disabled={pending}
              className="rounded-[var(--radius-md)] bg-orange-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {labels.flagCta}
            </button>
            <button
              onClick={() => setShowFlag(false)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* Action toolbar */}
      {!showReject && !showFlag && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs">
          {(review.status === "PENDING" || review.status === "REJECTED") && (
            <button
              onClick={onApprove}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-1.5 font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)] disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> {labels.approveCta}
            </button>
          )}
          {(review.status === "PENDING" || review.status === "APPROVED") && (
            <button
              onClick={() => setShowReject(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 py-1.5 font-semibold text-[var(--color-muted-strong)] hover:border-red-300 hover:text-red-700"
            >
              <EyeOff className="h-3.5 w-3.5" /> {labels.rejectCta}
            </button>
          )}
          {!review.organizerReply && !showReply && review.status !== "REJECTED" && (
            <button
              onClick={() => setShowReply(true)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 py-1.5 font-semibold text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
            >
              <MessageSquare className="h-3.5 w-3.5" /> {labels.replyCta}
            </button>
          )}
          {review.organizerReply && !showReply && (
            <button
              onClick={() => setShowReply(true)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 py-1.5 font-semibold text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-500)]"
            >
              <MessageSquare className="h-3.5 w-3.5" /> {labels.replyEditCta}
            </button>
          )}
          {review.status !== "FLAGGED" && (
            <button
              onClick={() => setShowFlag(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 font-semibold text-[var(--color-muted)] hover:border-orange-300 hover:text-orange-700"
            >
              <Flag className="h-3.5 w-3.5" /> {labels.flagCta}
            </button>
          )}
          <Link
            href={`/events/${review.eventSlug}`}
            className="ml-auto inline-flex items-center gap-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <ExternalLink className="h-3 w-3" /> {labels.openOnEvent}
          </Link>
        </div>
      )}
    </article>
  );
}
