/* eslint-disable @next/next/no-img-element */
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
      <img
        src="/brand.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] transition-transform group-hover:scale-[1.04]"
        aria-hidden
      />
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
