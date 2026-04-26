import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--color-surface-muted)] text-[var(--color-muted-strong)] border border-[var(--color-border)]",
        accent:  "bg-[var(--color-pitch-50)] text-[var(--color-pitch-800)] border border-[var(--color-pitch-200)]",
        primary: "bg-[var(--color-navy-50)] text-[var(--color-navy-800)] border border-[var(--color-navy-200)]",
        premium: "bg-[var(--color-gold-300)]/30 text-[var(--color-gold-600)] border border-[var(--color-gold-400)]",
        danger:  "bg-red-50 text-red-700 border border-red-200",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
