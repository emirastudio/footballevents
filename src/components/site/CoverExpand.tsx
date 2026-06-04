"use client";

import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";

/** A small glass button over a cover that opens the full image in a lightbox. */
export function CoverExpand({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/60"
      >
        <Maximize2 className="h-3.5 w-3.5" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[96vw] rounded-[var(--radius-lg)] object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
