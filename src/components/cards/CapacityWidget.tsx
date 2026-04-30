import { Users, Hourglass } from "lucide-react";
import type { CapacitySnapshot } from "@/lib/event-capacity";

type Labels = {
  joined: string;        // "{count} joined"
  spotsLeft: string;     // "{count} spots left"
  full: string;          // "Full"
  waitlistOpen: string;  // "Waitlist open"
  onWaitlist: string;    // "{count} on waitlist"
  capacityFmt: string;   // "{joined} of {max} joined"
};

export function CapacityWidget({ snap, labels }: { snap: CapacitySnapshot; labels: Labels }) {
  // Don't render anything for events without participation signal at all
  if (snap.confirmed === 0 && snap.waitlist === 0 && snap.max == null) return null;

  const hasMax = snap.max != null;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-foreground)]">
          <Users className="h-4 w-4 text-[var(--color-pitch-600)]" />
          {hasMax
            ? labels.capacityFmt.replace("{joined}", String(snap.confirmed)).replace("{max}", String(snap.max))
            : labels.joined.replace("{count}", String(snap.confirmed))}
        </div>
        {snap.isFull ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            {labels.full}
          </span>
        ) : hasMax ? (
          <span className="text-xs text-[var(--color-muted-strong)]">
            {labels.spotsLeft.replace("{count}", String(snap.spotsLeft))}
          </span>
        ) : null}
      </div>

      {hasMax && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
          <div
            className={`h-full transition-all ${snap.isFull ? "bg-amber-500" : "bg-[var(--color-pitch-500)]"}`}
            style={{ width: `${snap.pctFilled}%` }}
          />
        </div>
      )}

      {snap.waitlist > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-strong)]">
          <Hourglass className="h-3.5 w-3.5 text-amber-600" />
          {labels.onWaitlist.replace("{count}", String(snap.waitlist))}
        </div>
      )}

      {snap.isFull && snap.waitlist === 0 && (
        <p className="text-xs text-amber-800">{labels.waitlistOpen}</p>
      )}
    </div>
  );
}
