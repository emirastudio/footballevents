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
      className={`group inline-flex items-center ${className}`}
      aria-label="FootballEvents"
    >
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
