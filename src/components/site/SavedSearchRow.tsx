"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Trash2, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { deleteSavedSearchAction, toggleSavedSearchAction } from "@/app/actions/saved-search";

type Props = {
  search: {
    id: string;
    name: string | null;
    summary: string;
    filtersUrl: string;
    isActive: boolean;
    lastRunAt: string | null;
    matchedSinceLastRun: number;
  };
  labels: {
    pause: string;
    resume: string;
    delete: string;
    deleteConfirm: string;
    open: string;
    paused: string;
    matchesSinceLastRun: string;
    lastRun: string;
    never: string;
  };
};

export function SavedSearchRow({ search, labels }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    setError("");
    const fd = new FormData();
    fd.set("id", search.id);
    start(async () => {
      const res = await toggleSavedSearchAction(fd);
      if (!res.ok) setError(res.error);
    });
  }

  function remove() {
    if (!confirm(labels.deleteConfirm)) return;
    setError("");
    const fd = new FormData();
    fd.set("id", search.id);
    start(async () => {
      const res = await deleteSavedSearchAction(fd);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {search.name ? (
              <h3 className="font-semibold text-[var(--color-foreground)]">{search.name}</h3>
            ) : (
              <h3 className="font-semibold text-[var(--color-foreground)]">{search.summary}</h3>
            )}
            {!search.isActive && (
              <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {labels.paused}
              </span>
            )}
          </div>
          {search.name && (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{search.summary}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
            {search.matchedSinceLastRun > 0 && (
              <span className="rounded-full bg-[var(--color-pitch-50)] px-2 py-0.5 font-bold text-[var(--color-pitch-700)]">
                {labels.matchesSinceLastRun.replace("{count}", String(search.matchedSinceLastRun))}
              </span>
            )}
            <span>{labels.lastRun}: {search.lastRunAt ?? labels.never}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={search.filtersUrl}
            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
          >
            <ExternalLink className="h-3 w-3" /> {labels.open}
          </Link>
          <button
            onClick={toggle}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)] disabled:opacity-50"
          >
            {search.isActive ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
            {search.isActive ? labels.pause : labels.resume}
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> {labels.delete}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}
