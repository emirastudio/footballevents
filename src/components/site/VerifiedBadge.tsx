type Props = {
  label?: string;
  className?: string;
};

// Meta/Instagram-style scalloped 12-point star verified badge.
// Pitch-green fill with a white check.
export function VerifiedBadge({ label, className = "h-4 w-4" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      role={label ? "img" : "presentation"}
      aria-label={label}
    >
      <title>{label}</title>
      <path
        fill="var(--color-pitch-500)"
        d="M12 1.2l2.36 1.97 3.05-.43.86 2.96 2.96.86-.43 3.05L22.8 12l-1.97 2.36.43 3.05-2.96.86-.86 2.96-3.05-.43L12 22.8l-2.36-1.97-3.05.43-.86-2.96-2.96-.86.43-3.05L1.2 12l1.97-2.36L2.74 6.59l2.96-.86.86-2.96 3.05.43L12 1.2z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.6 12.4l3 3 5.8-6.4"
      />
    </svg>
  );
}
