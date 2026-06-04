/**
 * BrandMark — pin + teardrop field, inline SVG so we can recolor it on the fly.
 *
 * tone:
 *   - "color"   — full brand (green gradient pin, navy field, white markings)
 *   - "navy"    — monochrome navy
 *   - "green"   — monochrome green
 *   - "white"   — pure white (for dark backgrounds)
 *   - "black"   — pure black (1-bit / press)
 *   - "outline" — outlined only (no fills) — uses currentColor
 */

export type BrandMarkTone = "color" | "navy" | "green" | "white" | "black" | "outline";

const TONE_COLORS: Record<Exclude<BrandMarkTone, "color" | "outline">, string> = {
  navy: "#16284B",
  green: "#0EA865",
  white: "#FFFFFF",
  black: "#0A1628",
};

export function BrandMark({
  tone = "color",
  size = 96,
  className = "",
}: {
  tone?: BrandMarkTone;
  size?: number;
  className?: string;
}) {
  const isColor = tone === "color";
  const isOutline = tone === "outline";
  const solid = !isColor && !isOutline ? TONE_COLORS[tone] : undefined;

  return (
    <svg
      viewBox="0 0 180 220"
      width={size}
      height={(size * 220) / 180}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="feBrandPinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14C079" />
          <stop offset="55%" stopColor="#0EA865" />
          <stop offset="100%" stopColor="#0A8A52" />
        </linearGradient>
        <linearGradient id="feBrandFieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B3258" />
          <stop offset="100%" stopColor="#0F1E3A" />
        </linearGradient>
        <path
          id="fePinOuter"
          d="M90 6 C136.392 6 174 43.608 174 90 C174 126 152 154 124 182 L94 215 C92 217 88 217 86 215 L56 182 C28 154 6 126 6 90 C6 43.608 43.608 6 90 6 Z"
        />
        <path
          id="fePinInner"
          d="M90 24 C126.45 24 156 53.55 156 90 C156 119 138 142 116 164 L92.5 192 C91.2 193.5 88.8 193.5 87.5 192 L64 164 C42 142 24 119 24 90 C24 53.55 53.55 24 90 24 Z"
        />
        <clipPath id="feFieldClip">
          <use href="#fePinInner" />
        </clipPath>
      </defs>

      {/* Outer pin */}
      {isOutline ? (
        <use href="#fePinOuter" fill="none" stroke="currentColor" strokeWidth={6} />
      ) : (
        <use href="#fePinOuter" fill={isColor ? "url(#feBrandPinGrad)" : solid} />
      )}

      {/* Inner field */}
      {isOutline ? (
        <use href="#fePinInner" fill="none" stroke="currentColor" strokeWidth={4} />
      ) : isColor ? (
        <use href="#fePinInner" fill="url(#feBrandFieldGrad)" />
      ) : (
        // Mono: keep same solid color across pin + field, slightly darker tint on field for depth
        <use href="#fePinInner" fill={solid} fillOpacity={0.78} />
      )}

      {/* Markings */}
      {!isOutline && (
        <g
          clipPath="url(#feFieldClip)"
          fill="none"
          stroke={isColor ? "#FFFFFF" : tone === "white" ? "#0A1628" : "#FFFFFF"}
          strokeOpacity={isColor ? 0.92 : 0.85}
          strokeLinecap="square"
        >
          <use
            href="#fePinInner"
            fill="none"
            stroke={isColor ? "#FFFFFF" : tone === "white" ? "#0A1628" : "#FFFFFF"}
            strokeOpacity={isColor ? 0.22 : 0.3}
            strokeWidth={2}
          />
          <line x1="24" y1="90" x2="156" y2="90" strokeWidth={3.2} />
          <circle cx="90" cy="90" r="44" strokeWidth={3.4} />
          <circle
            cx="90"
            cy="90"
            r="4.5"
            fill={isColor ? "#FFFFFF" : tone === "white" ? "#0A1628" : "#FFFFFF"}
            stroke="none"
          />
        </g>
      )}

      {isOutline && (
        <g
          clipPath="url(#feFieldClip)"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="square"
        >
          <line x1="24" y1="90" x2="156" y2="90" />
          <circle cx="90" cy="90" r="44" />
          <circle cx="90" cy="90" r="4.5" fill="currentColor" stroke="none" />
        </g>
      )}

      {/* Highlight only on full-color */}
      {isColor && (
        <path
          d="M58 28 C72 18 92 16 108 22 C92 24 76 32 66 44 C60 42 56 36 58 28 Z"
          fill="#FFFFFF"
          fillOpacity={0.18}
        />
      )}
    </svg>
  );
}
