"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";
import { reportErrorAction } from "@/app/actions/report-error";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page error]", error);
    void reportErrorAction({
      digest: error.digest,
      message: error.message,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
        <span className="text-3xl">⚽</span>
      </div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--color-muted-strong)]">
        We hit an unexpected error loading this page. The error has been logged and our team will look into it.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-pitch-600)]"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
        >
          <Home className="h-4 w-4" /> Go home
        </a>
      </div>
    </div>
  );
}
