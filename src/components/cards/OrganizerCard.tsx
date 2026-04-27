import { Link } from "@/i18n/navigation";
import { Star, Calendar, MapPin } from "lucide-react";
import type { MockOrganizer } from "@/lib/mock-data";
import { getCountry } from "@/lib/mock-data";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";

type Props = {
  organizer: MockOrganizer;
  labels: { verified: string; events: string; reviews: string };
};

export function OrganizerCard({ organizer: o, labels }: Props) {
  const country = getCountry(o.countryCode);

  return (
    <Link
      href={`/org/${o.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
    >
      {/* Cover — wraps cover bg + premium badge; logo lives outside so it can overlap */}
      <div className="relative">
        <div
          className="aspect-[3/1] w-full min-h-[110px] overflow-hidden bg-[var(--color-surface-muted)] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, var(--color-pitch-100) 0%, var(--color-pitch-50) 50%, var(--color-navy-50) 100%), url(${o.coverUrl})`,
            backgroundBlendMode: "multiply",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {o.subscriptionTier === "PREMIUM" && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-premium)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
              <Star className="h-2.5 w-2.5 fill-current" /> Premium
            </span>
          )}
        </div>

        {/* Logo overlaps cover bottom-left */}
        <div
          className="absolute -bottom-7 left-4 h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-4 border-[var(--color-surface)] bg-[var(--color-surface)] bg-cover bg-center shadow-[var(--shadow-md)]"
          style={{ backgroundImage: `url(${o.logoUrl})` }}
          aria-hidden
        />
      </div>

      {/* Body — leave room for the logo overhang on the left */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-10">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-base font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
            {o.name}
          </h3>
          {o.isVerified && <VerifiedBadge label={labels.verified} className="h-[18px] w-[18px]" />}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-strong)]">{o.tagline}</p>

        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{country?.flag} {o.city}</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-2.5 mt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[var(--color-muted)]">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-semibold text-[var(--color-foreground)]">{o.eventsCount}</span> {labels.events}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[var(--color-premium)] text-[var(--color-premium)]" />
            <span className="font-semibold text-[var(--color-foreground)]">{o.rating}</span>
            <span className="text-[var(--color-muted)]">({o.reviewsCount})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
