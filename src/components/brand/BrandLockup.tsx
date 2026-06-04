import { BrandMark, type BrandMarkTone } from "./BrandMark";

type Variant = "horizontal" | "vertical" | "square" | "monogram";

const WORDMARK_COLORS: Record<BrandMarkTone, { primary: string; accent: string; tagline: string; taglineDot: string }> = {
  color:   { primary: "#16284B", accent: "#0EA865", tagline: "#16284B", taglineDot: "#0EA865" },
  navy:    { primary: "#16284B", accent: "#16284B", tagline: "#16284B", taglineDot: "#16284B" },
  green:   { primary: "#0EA865", accent: "#0EA865", tagline: "#0EA865", taglineDot: "#0EA865" },
  white:   { primary: "#FFFFFF", accent: "#FFFFFF", tagline: "#FFFFFF", taglineDot: "#FFFFFF" },
  black:   { primary: "#0A1628", accent: "#0A1628", tagline: "#0A1628", taglineDot: "#0A1628" },
  outline: { primary: "currentColor", accent: "currentColor", tagline: "currentColor", taglineDot: "currentColor" },
};

export function BrandLockup({
  variant = "horizontal",
  tone = "color",
  showTagline = true,
  className = "",
}: {
  variant?: Variant;
  tone?: BrandMarkTone;
  showTagline?: boolean;
  className?: string;
}) {
  const c = WORDMARK_COLORS[tone];

  if (variant === "monogram") {
    return (
      <div className={`inline-flex items-center ${className}`} style={{ fontFamily: "var(--font-display)" }}>
        <span className="text-[120px] font-black leading-none tracking-tight" style={{ color: c.primary }}>
          F
        </span>
        <span className="mx-1 -translate-y-2">
          <BrandMark tone={tone} size={40} />
        </span>
        <span className="text-[120px] font-black leading-none tracking-tight" style={{ color: c.accent }}>
          E
        </span>
      </div>
    );
  }

  if (variant === "square") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center gap-3 rounded-[28px] ${className}`}
        style={{ width: 240, height: 240, padding: 24 }}
      >
        <BrandMark tone={tone} size={120} />
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`inline-flex flex-col items-center gap-4 ${className}`}>
        <BrandMark tone={tone} size={96} />
        <div className="flex flex-col items-center leading-none" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-[34px] font-extrabold tracking-tight" style={{ color: c.primary }}>
            Football<span style={{ color: c.accent }}>Events</span>
          </span>
          {showTagline && (
            <span
              className="mt-3 text-[10px] font-semibold uppercase"
              style={{ color: c.tagline, letterSpacing: "0.38em" }}
            >
              Find <span style={{ color: c.taglineDot }}>·</span> Play{" "}
              <span style={{ color: c.taglineDot }}>·</span> Connect
            </span>
          )}
        </div>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div className={`inline-flex items-center gap-4 ${className}`}>
      <BrandMark tone={tone} size={68} />
      <div className="flex flex-col leading-none" style={{ fontFamily: "var(--font-display)" }}>
        <span className="text-[36px] font-extrabold tracking-tight" style={{ color: c.primary }}>
          Football<span style={{ color: c.accent }}>Events</span>
        </span>
        {showTagline && (
          <span
            className="mt-2 text-[10px] font-semibold uppercase"
            style={{ color: c.tagline, letterSpacing: "0.32em" }}
          >
            Find <span style={{ color: c.taglineDot }}>·</span> Play{" "}
            <span style={{ color: c.taglineDot }}>·</span> Connect
          </span>
        )}
      </div>
    </div>
  );
}
