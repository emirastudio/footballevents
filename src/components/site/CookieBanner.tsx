"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";

const KEY = "fe_cookie_consent_v1";

export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {}
  }, []);

  function decide(v: "accept" | "reject") {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v, ts: Date.now() }));
    } catch {}
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-muted-strong)]">
          {t("text")} {" "}
          <Link href="/legal/cookies" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
            {t("policy")}
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => decide("reject")}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-300)]"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => decide("accept")}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("close")}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
