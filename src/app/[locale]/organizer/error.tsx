"use client";

import { useEffect } from "react";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { reportErrorAction } from "@/app/actions/report-error";

export default function OrganizerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[organizer error]", error);
    void reportErrorAction({
      digest: error.digest,
      message: error.message,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-muted-strong)]">
        We hit an unexpected error. Please try again or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-pitch-600)]"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <a
          href="/organizer/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </a>
      </div>
    </div>
  );
}
