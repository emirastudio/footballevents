"use client";

import { useState, useRef } from "react";
import { Download, Upload, Image as ImageIcon, Bell, ChevronDown, Loader2 } from "lucide-react";

type Format = "square" | "portrait" | "story" | "landscape";

type EventItem = {
  id: string;
  slug: string;
  status: string;
  title: string;
  coverUrl: string | null;
  galleryUrls: string[];
};

type Props = {
  events: EventItem[];
  tier: string;
  locale: string;
  labels: {
    selectEvent: string;
    noEvents: string;
    socialImage: {
      title: string;
      hint: string;
      photoSection: string;
      useEventCover: string;
      fromGallery: string;
      uploadCustom: string;
      uploading: string;
      noPhoto: string;
      preview: string;
      download: string;
      lockHint: string;
      upgrade: string;
    };
    pushNotifications: { title: string; comingSoon: string };
  };
};

const FORMATS: { fmt: Format; label: string; size: string }[] = [
  { fmt: "square",    label: "Square",    size: "1080×1080" },
  { fmt: "portrait",  label: "Feed",      size: "1080×1350" },
  { fmt: "story",     label: "Story",     size: "1080×1920" },
  { fmt: "landscape", label: "Landscape", size: "1920×1080" },
];

const PREVIEW_WIDTH = 300;

function previewHeight(fmt: Format) {
  const map: Record<Format, number> = {
    square:    300,
    portrait:  375,
    story:     533,
    landscape: 169,
  };
  return map[fmt];
}

function isLocked(tier: string, fmt: Format) {
  if (tier === "PRO" || tier === "PREMIUM" || tier === "ENTERPRISE") return false;
  return fmt !== "square";
}

export function MarketingClient({ events, tier, locale, labels }: Props) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [format, setFormat] = useState<Format>("portrait");
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewTs, setPreviewTs] = useState(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);

  const event = events.find((e) => e.id === eventId);
  const locked = isLocked(tier, format);

  const activeImage = customImageUrl ?? event?.coverUrl ?? null;

  const apiBase = event
    ? `/api/events/${event.slug}/social-image?format=${format}&locale=${locale}${activeImage ? `&imageUrl=${encodeURIComponent(activeImage)}` : ""}`
    : null;
  const previewUrl = apiBase ? `${apiBase}&v=${previewTs}` : null;
  const downloadUrl = apiBase ? `${apiBase}&v=${Date.now()}` : null;
  const downloadName = event ? `footballevents-${event.slug}-${format}.png` : "social.png";

  async function handleFileUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File too large (max 5 MB)");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "marketing-image", contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) throw new Error("presign failed");
      const { uploadUrl, publicUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("upload failed");

      setCustomImageUrl(publicUrl);
      setPreviewTs(Date.now());
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (events.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-strong)]">
        {labels.noEvents}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <div className="relative">
        <select
          value={eventId}
          onChange={(e) => { setEventId(e.target.value); setCustomImageUrl(null); setPreviewTs(Date.now()); }}
          className="w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-4 pr-10 text-sm font-medium text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} {e.status !== "PUBLISHED" ? `(${e.status.toLowerCase()})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
      </div>

      {/* Social image card */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[var(--color-pitch-600)]" />
          <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
            {labels.socialImage.title}
          </h2>
        </div>
        <p className="mb-5 text-sm text-[var(--color-muted-strong)]">{labels.socialImage.hint}</p>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          {/* Left: controls */}
          <div className="space-y-5">
            {/* Format picker */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Format</div>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => {
                  const lock = isLocked(tier, f.fmt);
                  return (
                    <button
                      key={f.fmt}
                      onClick={() => !lock && setFormat(f.fmt)}
                      className={[
                        "rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-semibold transition",
                        format === f.fmt && !lock
                          ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                          : lock
                          ? "cursor-not-allowed border-dashed border-[var(--color-border)] text-[var(--color-muted)] opacity-60"
                          : "border-[var(--color-border)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-400)]",
                      ].join(" ")}
                      title={lock ? labels.socialImage.lockHint : undefined}
                    >
                      {f.label}
                      <span className="ml-1 font-normal opacity-70">{f.size}</span>
                      {lock && " 🔒"}
                    </button>
                  );
                })}
              </div>
              {locked && (
                <a href="/pricing" className="mt-2 inline-block text-xs font-semibold text-[var(--color-pitch-600)] hover:underline">
                  {labels.socialImage.upgrade}
                </a>
              )}
            </div>

            {/* Photo picker */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {labels.socialImage.photoSection}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Event cover */}
                {event?.coverUrl && (
                  <button
                    onClick={() => { setCustomImageUrl(null); setPreviewTs(Date.now()); }}
                    className={[
                      "h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border-2 transition",
                      !customImageUrl
                        ? "border-[var(--color-pitch-500)]"
                        : "border-transparent hover:border-[var(--color-pitch-300)]",
                    ].join(" ")}
                    title={labels.socialImage.useEventCover}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                )}

                {/* Gallery thumbnails */}
                {event?.galleryUrls.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => { setCustomImageUrl(url); setPreviewTs(Date.now()); }}
                    className={[
                      "h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border-2 transition",
                      customImageUrl === url
                        ? "border-[var(--color-pitch-500)]"
                        : "border-transparent hover:border-[var(--color-pitch-300)]",
                    ].join(" ")}
                    title={`${labels.socialImage.fromGallery} ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}

                {/* Upload button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-muted)] text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-400)] hover:text-[var(--color-pitch-600)] disabled:opacity-50"
                >
                  {uploading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Upload className="h-5 w-5" />}
                  <span className="text-[9px] font-semibold uppercase">
                    {uploading ? labels.socialImage.uploading : labels.socialImage.uploadCustom}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
              {!event?.coverUrl && event?.galleryUrls.length === 0 && !customImageUrl && (
                <p className="mt-2 text-xs text-[var(--color-muted)]">{labels.socialImage.noPhoto}</p>
              )}
              {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
            </div>

            {/* Download button */}
            {!locked && downloadUrl ? (
              <a
                href={downloadUrl}
                download={downloadName}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)]"
              >
                <Download className="h-4 w-4" />
                {labels.socialImage.download}
              </a>
            ) : locked ? (
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
              >
                {labels.socialImage.upgrade}
              </a>
            ) : null}
          </div>

          {/* Right: preview */}
          {previewUrl && !locked && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {labels.socialImage.preview}
              </div>
              <div
                style={{ width: PREVIEW_WIDTH, height: previewHeight(format) }}
                className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="preview"
                  width={PREVIEW_WIDTH}
                  height={previewHeight(format)}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Push notifications card */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 opacity-70">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[var(--color-pitch-600)]" />
          <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
            {labels.pushNotifications.title}
          </h2>
          <span className="ml-2 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Soon
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{labels.pushNotifications.comingSoon}</p>
      </div>
    </div>
  );
}
