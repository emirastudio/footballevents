"use client";

import { useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import type { AdTheme, AdFormat, AdLang } from "@/lib/promotion-ad-themes";

const LANGS: { value: AdLang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ru", label: "RU" },
  { value: "es", label: "ES" },
];

const FORMATS: { value: AdFormat; label: string; size: string }[] = [
  { value: "portrait",  label: "Post",      size: "1080×1350" },
  { value: "story",     label: "Story",     size: "1080×1920" },
  { value: "landscape", label: "Landscape", size: "1920×1080" },
];

const VISUAL_COLORS: Record<string, string> = {
  cinematic: "#0A1628",
  split:     "#1E293B",
  card:      "#F1F5F9",
  stats:     "#0A1628",
  world:     "#0D2240",
  quote:     "#0F2740",
};

const VISUAL_TEXT: Record<string, string> = {
  cinematic: "Cinematic",
  split:     "Before / After",
  card:      "Card",
  stats:     "Dashboard",
  world:     "World Map",
  quote:     "Quote",
};

export function AdDownloadCard({ theme }: { theme: AdTheme }) {
  const [lang, setLang] = useState<AdLang>("en");

  const content = theme.content[lang];
  const previewUrl = `/api/admin/promotion-ads?theme=${theme.id}&lang=${lang}&format=portrait`;

  function downloadUrl(format: AdFormat) {
    return `/api/admin/promotion-ads?theme=${theme.id}&lang=${lang}&format=${format}`;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      {/* preview */}
      <div
        className="relative flex h-40 items-center justify-center"
        style={{ background: VISUAL_COLORS[theme.visual] }}
      >
        <div className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/80">
          #{theme.id} · {VISUAL_TEXT[theme.visual]}
        </div>
        {/* mini preview via img */}
        <a href={previewUrl} target="_blank" rel="noopener" title="Open full-size preview">
          <div className="flex h-28 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white/10 transition hover:border-white/40">
            <ImageIcon className="h-8 w-8 text-white/40" />
          </div>
        </a>
      </div>

      {/* content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="font-[family-name:var(--font-manrope)] text-sm font-bold text-[var(--color-foreground)]">
            {content.headline}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">{content.sub}</div>
        </div>

        {/* language tabs */}
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                lang === l.value
                  ? "bg-[var(--color-pitch-600)] text-white"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-muted-strong)] hover:bg-[var(--color-border)]"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* download buttons */}
        <div className="flex flex-col gap-1.5">
          {FORMATS.map((f) => (
            <a
              key={f.value}
              href={downloadUrl(f.value)}
              download={`feu-theme${theme.id}-${lang}-${f.value}.jpg`}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-400)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]"
            >
              <span>
                {f.label}{" "}
                <span className="font-normal text-[var(--color-muted)]">{f.size}</span>
              </span>
              <Download className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
