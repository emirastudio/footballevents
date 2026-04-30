"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
};

const SIZE_MAP = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

export function RatingStars({ value, onChange, size = "md", readOnly }: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const interactive = !readOnly && !!onChange;
  const cls = SIZE_MAP[size];

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? "radiogroup" : undefined}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            className={[
              "rounded transition",
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default",
            ].join(" ")}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-checked={value === n}
            role={interactive ? "radio" : undefined}
          >
            <Star
              className={[
                cls,
                filled
                  ? "fill-[var(--color-premium)] text-[var(--color-premium)]"
                  : "text-[var(--color-border-strong)]",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
