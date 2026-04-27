"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, Loader2, Trash2, ImageIcon } from "lucide-react";

type UploadKind =
  | "organizer-logo"
  | "organizer-cover"
  | "event-logo"
  | "event-cover"
  | "event-gallery"
  | "user-avatar";

type Aspect = number | undefined;

const PRESETS: Record<UploadKind, { aspect: Aspect; targetW: number; targetH: number; minSrcW: number; minSrcH: number; circle?: boolean }> = {
  "organizer-logo":  { aspect: 1,         targetW: 512,  targetH: 512,  minSrcW: 400,  minSrcH: 400, circle: false },
  "organizer-cover": { aspect: 3,         targetW: 1920, targetH: 640,  minSrcW: 1200, minSrcH: 400 },
  "event-logo":      { aspect: 1,         targetW: 512,  targetH: 512,  minSrcW: 400,  minSrcH: 400 },
  "event-cover":     { aspect: 16 / 9,    targetW: 1600, targetH: 900,  minSrcW: 1200, minSrcH: 675 },
  "event-gallery":   { aspect: 4 / 3,     targetW: 1600, targetH: 1200, minSrcW: 800,  minSrcH: 600 },
  "user-avatar":     { aspect: 1,         targetW: 512,  targetH: 512,  minSrcW: 200,  minSrcH: 200, circle: true },
};

const RECOMMEND: Record<UploadKind, string> = {
  "organizer-logo":  "Square 512×512+ · PNG with transparency or JPG · max 5MB",
  "organizer-cover": "Wide 1920×640 (3:1) · JPG/WebP · max 5MB",
  "event-logo":      "Square 512×512+ · max 5MB",
  "event-cover":     "16:9 · 1600×900+ · max 5MB",
  "event-gallery":   "4:3 · 1600×1200+ · max 5MB",
  "user-avatar":     "Square 200×200+ · JPG/PNG · max 5MB",
};

export type ImageUploadProps = {
  name: string;             // hidden form field name
  kind: UploadKind;
  defaultUrl?: string;
  label: string;
  hint?: string;
};

function centeredAspectCrop(mediaW: number, mediaH: number, aspect: Aspect): Crop {
  if (!aspect) {
    return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaW, mediaH),
    mediaW, mediaH,
  );
}

export function ImageUpload({ name, kind, defaultUrl, label, hint }: ImageUploadProps) {
  const preset = PRESETS[kind];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [src, setSrc] = useState<string | null>(null);     // base64 of selected file
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<Crop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultUrl ?? null);

  function pickFile() {
    inputRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG or WebP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too big (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    if (naturalWidth < preset.minSrcW || naturalHeight < preset.minSrcH) {
      setError(`Image too small. Minimum ${preset.minSrcW}×${preset.minSrcH}.`);
      setSrc(null);
      return;
    }
    setCrop(centeredAspectCrop(width, height, preset.aspect));
  }

  async function confirmCrop() {
    if (!imgRef.current || !completed) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropAndCompress(imgRef.current, completed, preset.targetW, preset.targetH);

      // 1) Get presigned URL
      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, contentType: blob.type, size: blob.size }),
      });
      if (!presign.ok) {
        const j = await presign.json().catch(() => ({}));
        throw new Error(j.error ?? "Presign failed");
      }
      const { uploadUrl, publicUrl } = await presign.json();

      // 2) PUT to S3 / MinIO directly
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      setUploadedUrl(publicUrl);
      setSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function clearImage() {
    setUploadedUrl(null);
  }

  const previewClass = preset.aspect === 1
    ? "aspect-square"
    : preset.aspect === 3
      ? "aspect-[3/1]"
      : preset.aspect === 16 / 9
        ? "aspect-video"
        : preset.aspect === 4 / 3
          ? "aspect-[4/3]"
          : "aspect-auto";

  // Surface "I'm in the middle of uploading/cropping" state to the parent form.
  // The wizard's <form onSubmit> queries for [data-pending-upload="1"] and blocks the submit when present.
  const pending = !!src || busy;

  return (
    <div data-pending-upload={pending ? "1" : "0"}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <input type="hidden" name={name} value={uploadedUrl ?? ""} />
      {pending && (
        <div className="mb-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {busy
            ? "Загружаем… подождите пару секунд."
            : "Не забудьте нажать «Save crop», чтобы сохранить картинку — иначе она не загрузится."}
        </div>
      )}

      {/* Crop dialog inline (shown when src set) */}
      {src ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-muted)]">
            <ReactCrop
              crop={crop}
              onChange={(_, percent) => setCrop(percent)}
              onComplete={(c) => setCompleted(c)}
              aspect={preset.aspect}
              keepSelection
              minWidth={50}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt=""
                onLoad={onImageLoad}
                className="max-h-[420px] w-auto"
              />
            </ReactCrop>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={confirmCrop}
              disabled={busy || !completed}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-fg)] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? "Uploading…" : "Save crop"}
            </button>
            <button
              type="button"
              onClick={() => { setSrc(null); setError(null); }}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-foreground)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : uploadedUrl ? (
        <div className="flex items-start gap-4">
          <div
            className={`${previewClass} ${preset.aspect === 1 ? "w-32" : preset.aspect === 3 ? "w-72" : "w-64"} overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-cover bg-center bg-[var(--color-bg-muted)]`}
            style={{ backgroundImage: `url(${uploadedUrl})` }}
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={pickFile}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)]"
            >
              <Upload className="h-4 w-4" /> Replace
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-muted-strong)] hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          className={`flex w-full ${previewClass} max-w-md flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-strong)] transition hover:border-[var(--color-pitch-500)] hover:bg-[var(--color-pitch-50)]`}
        >
          <ImageIcon className="h-7 w-7 text-[var(--color-pitch-500)]" />
          <span className="font-semibold">Upload image</span>
          <span className="text-xs text-[var(--color-muted)]">{hint ?? RECOMMEND[kind]}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        className="sr-only"
      />

      {error && (
        <p className="mt-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {!src && !error && hint && (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}

async function cropAndCompress(image: HTMLImageElement, crop: Crop, targetW: number, targetH: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropX = (crop.x ?? 0) * (crop.unit === "%" ? image.width / 100 : 1) * scaleX;
  const cropY = (crop.y ?? 0) * (crop.unit === "%" ? image.height / 100 : 1) * scaleY;
  const cropW = (crop.width ?? 0) * (crop.unit === "%" ? image.width / 100 : 1) * scaleX;
  const cropH = (crop.height ?? 0) * (crop.unit === "%" ? image.height / 100 : 1) * scaleY;

  // Downscale to target dimensions (preserve aspect from crop) but never upscale.
  const ratio = Math.min(targetW / cropW, targetH / cropH, 1);
  const outW = Math.round(cropW * ratio);
  const outH = Math.round(cropH * ratio);

  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      "image/webp",
      0.88,
    );
  });
}
