"use client";

import { useEffect, useState } from "react";
import { Bug, X } from "lucide-react";
import { BugReportModal } from "./BugReportModal";
import { installConsoleCapture } from "@/lib/console-capture";

type Labels = {
  buttonLabel: string;
  modal: {
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
};

/**
 * Floating "Report an issue" affordance that lives on every public page. Opens
 * the report modal on click; otherwise stays out of the way as a small chip in
 * the bottom-right corner. Installs the console-capture buffer on mount so any
 * subsequent JS errors are attached automatically when the user files a report.
 */
export function BugReportButton({ labels, locale }: { labels: Labels; locale: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    installConsoleCapture();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.buttonLabel}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[var(--color-foreground)] px-4 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-lg)] transition hover:bg-[var(--color-pitch-700)] sm:bottom-5 sm:right-5"
      >
        <Bug className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{labels.buttonLabel}</span>
      </button>
      {open && (
        <BugReportModal
          locale={locale}
          labels={labels.modal}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export { X };
