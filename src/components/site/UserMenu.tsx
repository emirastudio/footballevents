import Image from "next/image";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/app/actions/auth";
import { LogOut, User, LayoutDashboard, Users } from "lucide-react";

export async function UserMenu({
  signInLabel,
  signUpLabel,
  signOutLabel,
  becomeOrganizerLabel,
  openCabinetLabel,
  myClubLabel,
}: {
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
  becomeOrganizerLabel: string;
  openCabinetLabel: string;
  myClubLabel: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link href="/sign-in">{signInLabel}</Link>
        </Button>
        <Button asChild variant="primary" size="sm">
          <Link href="/sign-up">{signUpLabel}</Link>
        </Button>
      </>
    );
  }

  // Capability is the SOURCE OF TRUTH, not `role` — dual-hat (ORGANIZER + CLUB)
  // means relying on role would hide one of the two cabinets. session.user
  // carries the IDs (populated in src/auth.ts callback). See ADR 0001 §D1.
  const hasOrganizer = !!session.user.organizerId;
  const hasClub = !!session.user.clubId;
  const isAdmin = session.user.role === "ADMIN";

  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(/\s+|@/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link href="/admin/dashboard">Admin</Link>
        </Button>
      )}
      {/* Club cabinet — only when the user runs a club. Sits before Organizer
          on dual-hat so the more recent addition is the first thing they reach. */}
      {hasClub && (
        <Button asChild variant="outline" size="sm">
          <Link href="/club/dashboard">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{myClubLabel}</span>
          </Link>
        </Button>
      )}
      {/* Organizer cabinet — present for active organizers; for everyone else we
          keep the "Become organizer" CTA exactly as before (no churn for solo users). */}
      {hasOrganizer ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/organizer/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">{openCabinetLabel}</span>
          </Link>
        </Button>
      ) : !hasClub ? (
        // No hats at all → show the upsell CTA. Hide it when the user already
        // runs a club, to avoid two competing CTAs in the header.
        <Button asChild variant="primary" size="sm">
          <Link href="/onboarding/organizer">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">{becomeOrganizerLabel}</span>
          </Link>
        </Button>
      ) : null}
      <Link
        href="/me"
        className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-sm transition hover:border-[var(--color-pitch-300)]"
        title={session.user.email ?? undefined}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            sizes="28px"
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-pitch-50)] text-xs font-bold text-[var(--color-pitch-700)]">
            {initials || <User className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-[var(--color-foreground)] sm:inline">
          {session.user.name ?? session.user.email}
        </span>
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label={signOutLabel}
          className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted-strong)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
