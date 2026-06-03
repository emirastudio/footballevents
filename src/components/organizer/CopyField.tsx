"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";

/** Read-only code field with a one-click copy button. */
export function CopyField({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — user can still select the text */ }
  };
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <textarea
        readOnly
        rows={3}
        value={value}
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] p-3 font-[family-name:var(--font-mono,monospace)] text-xs text-[var(--color-foreground)]"
      />
      <Button type="button" variant={copied ? "accent" : "outline"} size="md" onClick={copy} className="shrink-0">
        {copied ? <><Check className="h-4 w-4" /> {copiedLabel}</> : <><Copy className="h-4 w-4" /> {copyLabel}</>}
      </Button>
    </div>
  );
}
