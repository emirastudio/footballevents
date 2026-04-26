import { Link } from "@/i18n/navigation";
import type { InboxThread } from "@/lib/messages";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(/\s+|@/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function relativeTime(date: Date, now: Date = new Date()): string {
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}

export function ThreadList({
  threads,
  basePath,
  selectedId,
}: {
  threads: InboxThread[];
  basePath: string;
  selectedId?: string;
}) {
  if (threads.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {threads.map((t) => {
        const isSelected = t.id === selectedId;
        const isUnread = t.unreadCount > 0;
        return (
          <li key={t.id}>
            <Link
              href={`${basePath}/${t.id}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--color-surface-muted)]",
                isSelected && "bg-[var(--color-pitch-50)]",
              )}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-pitch-100)] text-sm font-semibold text-[var(--color-pitch-700)] bg-cover bg-center"
                style={t.other.image ? { backgroundImage: `url(${t.other.image})` } : undefined}
              >
                {!t.other.image && initialsOf(t.other.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm text-[var(--color-foreground)]",
                      isUnread ? "font-bold" : "font-medium",
                    )}
                  >
                    {t.other.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                    {relativeTime(t.lastMessageAt)}
                  </span>
                </div>
                <div className="truncate text-xs text-[var(--color-muted)]">{t.eventTitle}</div>
                <div
                  className={cn(
                    "mt-0.5 truncate text-xs",
                    isUnread ? "font-semibold text-[var(--color-foreground)]" : "text-[var(--color-muted-strong)]",
                  )}
                >
                  {t.lastMessagePreview.length > 80
                    ? t.lastMessagePreview.slice(0, 79) + "…"
                    : t.lastMessagePreview}
                </div>
              </div>
              {isUnread && (
                <span className="ml-1 grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-[var(--color-accent-fg)]">
                  {t.unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
