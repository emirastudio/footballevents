import { Link } from "@/i18n/navigation";
import { MapPin, Users } from "lucide-react";
import type { MockVenue } from "@/lib/mock-data";

type Props = {
  venue: MockVenue;
  labels: { capacity: string; events: string };
};

export function StadiumCard({ venue: v, labels }: Props) {
  return (
    <Link
      href={`/stadiums/${v.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-all hover:-translate-y-1 hover:border-[var(--color-pitch-300)] hover:shadow-[var(--shadow-md)]"
    >
      <div
        className="relative aspect-[16/9] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${v.coverUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="line-clamp-1 font-[family-name:var(--font-manrope)] text-lg font-bold text-white drop-shadow">
            {v.name}
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <MapPin className="h-3.5 w-3.5" />
          <span>{v.city}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs">
          {v.capacity && (
            <span className="inline-flex items-center gap-1 text-[var(--color-muted)]">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold text-[var(--color-foreground)]">
                {v.capacity.toLocaleString()}
              </span>
              <span>{labels.capacity}</span>
            </span>
          )}
          <span className="text-[var(--color-muted)]">
            <span className="font-semibold text-[var(--color-foreground)]">{v.eventsCount}</span> {labels.events}
          </span>
        </div>
      </div>
    </Link>
  );
}
