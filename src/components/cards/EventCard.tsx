import { Link } from "@/i18n/navigation";
import { MapPin, Calendar, Star, Sparkles, ShieldCheck, Users } from "lucide-react";
import { formatDateRange, formatPrice } from "@/lib/format";
import type { MockEvent } from "@/lib/mock-data";
import { getCountry } from "@/lib/mock-data";

type Props = {
  event: MockEvent;
  locale: string;
  rank?: number;
  size?: "sm" | "md" | "lg";
  labels: {
    from: string;
    free: string;
    premium: string;
    featured: string;
  };
};

export function EventCard({ event: e, locale, rank, size = "md", labels }: Props) {
  const country = getCountry(e.countryCode);
  const isCompact = size === "sm";

  // Premium boost gets a visible gold border (per pricing matrix). Featured
  // gets a green outline. Plain cards stay neutral.
  const cardBorder = e.isPremium
    ? "border-[var(--color-premium)] ring-2 ring-[var(--color-premium)]/30 shadow-[var(--shadow-md)]"
    : e.isFeatured
    ? "border-[var(--color-pitch-500)] ring-1 ring-[var(--color-pitch-500)]/20"
    : "border-[var(--color-border)] shadow-[var(--shadow-xs)]";

  return (
    <Link
      href={`/events/${e.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] transition-all hover:-translate-y-1 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)] ${cardBorder}`}
    >
      <div
        className={`relative ${isCompact ? "aspect-[4/3]" : "aspect-[16/10]"} overflow-hidden bg-[var(--color-pitch-50)] bg-cover bg-center`}
        style={e.coverUrl ? { backgroundImage: `url(${e.coverUrl})` } : undefined}
      >
        {/* Fallback: centered logo on a soft pitch tint when no cover yet. */}
        {!e.coverUrl && e.logoUrl && (
          <div
            className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
            style={{ backgroundImage: `url(${e.logoUrl})` }}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {rank !== undefined && (
          <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[11px] font-bold text-[var(--color-foreground)] shadow-[var(--shadow-sm)]">
            {rank}
          </span>
        )}

        {e.isPremium && (
          <span
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-premium)] text-white shadow-[var(--shadow-sm)] ring-2 ring-white/80"
            title={labels.premium}
            aria-label={labels.premium}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
        {!e.isPremium && e.isFeatured && (
          <span
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-pitch-500)] text-white shadow-[var(--shadow-sm)] ring-2 ring-white/80"
            title={labels.featured}
            aria-label={labels.featured}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className={`line-clamp-2 font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)] ${isCompact ? "text-sm" : "text-base"}`}>
          {e.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{country?.flag} {e.city}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">{formatDateRange(e.startDate, e.endDate, locale)}</span>
        </div>
        {!isCompact && e.ageGroups.length > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate">{e.ageGroups.join(", ")}{e.format ? ` · ${e.format}` : ""}</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--color-border)] pt-2.5">
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-[var(--color-premium)] text-[var(--color-premium)]" />
            <span className="font-semibold text-[var(--color-foreground)]">{e.rating}</span>
            <span className="text-[var(--color-muted)]">({e.reviewsCount})</span>
          </div>
          <div className="text-right">
            {e.isFree ? (
              <span className="text-xs font-bold uppercase text-[var(--color-pitch-700)]">{labels.free}</span>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{labels.from}</div>
                <div className="font-[family-name:var(--font-manrope)] text-sm font-bold text-[var(--color-foreground)]">
                  {formatPrice(e.priceFrom, e.currency, locale)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
