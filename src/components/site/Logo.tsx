import { Link } from "@/i18n/navigation";

export function Logo({
  className = "",
  showSlogan = false,
  slogan,
}: {
  className?: string;
  showSlogan?: boolean;
  slogan?: string;
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="FootballEvents"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-pitch-50)] ring-1 ring-[var(--color-pitch-200)] transition-transform group-hover:scale-[1.04]">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="11" stroke="var(--color-pitch-600)" strokeWidth="1.6" />
          <path
            d="M16 9l5.7 4.1-2.2 6.7h-7l-2.2-6.7L16 9z"
            fill="var(--color-pitch-500)"
            stroke="var(--color-pitch-700)"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-manrope)] text-[16px] font-extrabold tracking-tight text-[var(--color-foreground)]">
          Football<span className="text-[var(--color-pitch-600)]">Events</span>
        </span>
        {showSlogan && slogan ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {slogan}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
