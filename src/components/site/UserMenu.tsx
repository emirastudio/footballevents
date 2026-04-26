import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/app/actions/auth";
import { LogOut, User, LayoutDashboard } from "lucide-react";

export async function UserMenu({
  signInLabel,
  signUpLabel,
  signOutLabel,
  becomeOrganizerLabel,
  openCabinetLabel,
}: {
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
  becomeOrganizerLabel: string;
  openCabinetLabel: string;
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

  const isOrganizer = session.user.role === "ORGANIZER" || session.user.role === "ADMIN";
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
      <Button asChild variant={isOrganizer ? "outline" : "primary"} size="sm" className="hidden md:inline-flex">
        <Link href={isOrganizer ? "/organizer/dashboard" : "/onboarding/organizer"}>
          <LayoutDashboard className="h-4 w-4" />
          {isOrganizer ? openCabinetLabel : becomeOrganizerLabel}
        </Link>
      </Button>
      <Link
        href="/me"
        className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-sm transition hover:border-[var(--color-pitch-300)]"
        title={session.user.email ?? undefined}
      >
        {session.user.image ? (
          <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
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
