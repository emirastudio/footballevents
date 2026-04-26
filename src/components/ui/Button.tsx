import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-pitch-500)] focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-navy-800)] shadow-[var(--shadow-sm)]",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-pitch-600)] shadow-[var(--shadow-sm)]",
        outline:
          "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
        ghost:
          "text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]",
        link:
          "text-[var(--color-pitch-700)] underline-offset-4 hover:underline",
        premium:
          "bg-[var(--color-premium)] text-[var(--color-navy-900)] hover:bg-[var(--color-gold-600)] hover:text-white shadow-[var(--shadow-sm)]",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-[var(--radius-md)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
        lg: "h-13 px-7 text-base rounded-[var(--radius-lg)]",
        xl: "h-14 px-8 text-base rounded-[var(--radius-lg)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
