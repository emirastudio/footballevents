import { Bell, BellRing, Bookmark, BookmarkCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleFollowOrganizer, toggleSaveEvent } from "@/app/actions/follow";

export async function FollowOrganizerButton({
  organizerId,
  followersCount,
  followLabel,
  followingLabel,
  returnTo,
}: {
  organizerId: string;
  followersCount?: number;
  followLabel: string;
  followingLabel?: string;
  returnTo: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
      >
        <Bell className="h-4 w-4" />
        <span>{followLabel}</span>
        {typeof followersCount === "number" && (
          <CountBadge value={followersCount} />
        )}
      </Link>
    );
  }

  const existing = await db.organizerFollow.findUnique({
    where: { userId_organizerId: { userId, organizerId } },
    select: { id: true },
  });
  const isFollowing = !!existing;

  return (
    <form action={toggleFollowOrganizer.bind(null, organizerId, returnTo)}>
      <button
        type="submit"
        className={`inline-flex items-center gap-2 rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition ${
          isFollowing
            ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
        }`}
      >
        {isFollowing ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        <span>{isFollowing ? (followingLabel ?? followLabel) : followLabel}</span>
        {typeof followersCount === "number" && <CountBadge value={followersCount} />}
      </button>
    </form>
  );
}

export async function SaveEventButton({
  eventId,
  savesCount,
  saveLabel,
  savedLabel,
  returnTo,
}: {
  eventId: string;
  savesCount?: number;
  saveLabel: string;
  savedLabel?: string;
  returnTo: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
      >
        <Bookmark className="h-4 w-4" />
        <span>{saveLabel}</span>
        {typeof savesCount === "number" && savesCount > 0 && <CountBadge value={savesCount} />}
      </Link>
    );
  }

  const existing = await db.eventSave.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { id: true },
  });
  const isSaved = !!existing;

  return (
    <form action={toggleSaveEvent.bind(null, eventId, returnTo)}>
      <button
        type="submit"
        className={`inline-flex items-center gap-2 rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition ${
          isSaved
            ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
        }`}
      >
        {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        <span>{isSaved ? (savedLabel ?? saveLabel) : saveLabel}</span>
        {typeof savesCount === "number" && savesCount > 0 && <CountBadge value={savesCount} />}
      </button>
    </form>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--color-muted-strong)]">
      {value.toLocaleString()}
    </span>
  );
}
