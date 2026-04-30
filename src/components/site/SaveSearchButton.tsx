"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell, Check, X } from "lucide-react";
import { createSavedSearchAction } from "@/app/actions/saved-search";
import type { SearchFilters } from "@/lib/saved-search";

type Labels = {
  cta: string;
  hintLoggedOut: string;
  hintEmpty: string;
  saved: string;
  manageCta: string;
  modalTitle: string;
  modalDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  saveCta: string;
  saving: string;
  cancelCta: string;
};

type Props = {
  isLoggedIn: boolean;
  filters: SearchFilters;
  filtersSummary: string;
  labels: Labels;
};

export function SaveSearchButton({ isLoggedIn, filters, filtersSummary, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const isEmpty = Object.values(filters).every((v) => v == null || v === "" || v === false);

  function onClick() {
    if (!isLoggedIn) {
      const next = encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/events");
      router.push(`/sign-in?next=${next}`);
      return;
    }
    if (isEmpty) {
      setError(labels.hintEmpty);
      setTimeout(() => setError(""), 3000);
      return;
    }
    setOpen(true);
    setError("");
    setDone(false);
  }

  function save() {
    setError("");
    const fd = new FormData();
    fd.set("name", name);
    fd.set("filters", JSON.stringify(filters));
    start(async () => {
      const res = await createSavedSearchAction(fd);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title={!isLoggedIn ? labels.hintLoggedOut : labels.cta}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
      >
        <Bell className="h-3.5 w-3.5" />
        {labels.cta}
      </button>

      {error && !open && (
        <span className="ml-2 rounded-[var(--radius-md)] bg-amber-50 px-2 py-1 text-xs text-amber-800">
          {error}
        </span>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-2xl sm:rounded-[var(--radius-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                {done ? labels.saved : labels.modalTitle}
              </h2>
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-full p-1 text-[var(--color-muted)] hover:bg-[var(--color-bg-muted)]"
                aria-label={labels.cancelCta}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-pitch-700)]">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">{filtersSummary}</span>
                </div>
                <a
                  href="/me/alerts"
                  className="block w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]"
                >
                  {labels.manageCta} →
                </a>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-[var(--color-muted-strong)]">{labels.modalDescription}</p>

                <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] p-3 text-xs font-medium text-[var(--color-foreground)]">
                  {filtersSummary}
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--color-foreground)]">
                    {labels.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    placeholder={labels.namePlaceholder}
                    maxLength={80}
                    className="block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
                  />
                </div>

                {error && (
                  <p className="mb-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={save}
                    disabled={pending}
                    className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)] disabled:opacity-50"
                  >
                    {pending ? labels.saving : labels.saveCta}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-muted-strong)] hover:bg-[var(--color-bg-muted)]"
                  >
                    {labels.cancelCta}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
