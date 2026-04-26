import { Link } from "@/i18n/navigation";
import type { ThreadDetail } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./MessageComposer";

function initialsOf(name: string): string {
  return name
    .split(/\s+|@/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatTime(d: Date): string {
  return d.toLocaleString("en", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

const TEN_MIN = 10 * 60 * 1000;

export function ThreadView({
  thread,
  currentUserId,
  composerLabels,
}: {
  thread: ThreadDetail;
  currentUserId: string;
  composerLabels: { placeholder: string; send: string; sending: string };
}) {
  const messages = thread.messages;

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-pitch-100)] text-sm font-semibold text-[var(--color-pitch-700)] bg-cover bg-center"
          style={thread.other.image ? { backgroundImage: `url(${thread.other.image})` } : undefined}
        >
          {!thread.other.image && initialsOf(thread.other.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{thread.other.name}</div>
          <Link
            href={`/events/${thread.eventSlug}`}
            className="truncate text-xs text-[var(--color-muted)] hover:text-[var(--color-pitch-700)]"
          >
            {thread.eventTitle}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <p className="text-center text-xs text-[var(--color-muted)]">No messages yet.</p>
        )}
        {messages.map((m, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null;
          const sameSender = prev?.senderId === m.senderId;
          const gap = prev ? m.createdAt.getTime() - prev.createdAt.getTime() : Number.POSITIVE_INFINITY;
          const showTimestamp = !prev || gap > TEN_MIN;
          const isMine = m.senderId === currentUserId;
          return (
            <div key={m.id} className="flex flex-col gap-1">
              {showTimestamp && (
                <div className="my-1 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  {formatTime(m.createdAt)}
                </div>
              )}
              <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap break-words rounded-[var(--radius-lg)] px-3.5 py-2 text-sm",
                    isMine
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-foreground)]",
                    sameSender && !showTimestamp && (isMine ? "rounded-tr-sm" : "rounded-tl-sm"),
                  )}
                  title={formatTime(m.createdAt)}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
        <MessageComposer
          threadId={thread.id}
          placeholder={composerLabels.placeholder}
          sendLabel={composerLabels.send}
          sendingLabel={composerLabels.sending}
        />
      </div>
    </div>
  );
}
