"use client";

import { useState, useTransition } from "react";
import { X, Menu, LogOut, LayoutDashboard, ChevronRight, User } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";

export type MobileNavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  initials: string;
} | null;

type NavLink = { href: string; label: string };

type Props = {
  links: NavLink[];
  user: MobileNavUser;
  labels: {
    signIn: string;
    signUp: string;
    signOut: string;
    becomeOrganizer: string;
    openCabinet: string;
  };
};

export function MobileNavClient({ links, user, labels }: Props) {
  const [open, setOpen] = useState(false);
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  function changeLocale(next: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
      setOpen(false);
    });
  }

  return (
    <>
      <button
        className="lg:hidden grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] transition"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--color-surface)] lg:hidden"
          style={{ overscrollBehavior: "contain" }}
        >
          {/* Top bar */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
            <Logo />
            <button
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted-strong)] hover:bg-[var(--color-surface-muted)] transition"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">

            {/* User section */}
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  {user.image ? (
                    <img src={user.image} alt="" className="h-10 w-10 rounded-full shrink-0 object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-pitch-50)] text-sm font-bold text-[var(--color-pitch-700)]">
                      {user.initials || <User className="h-4 w-4" />}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--color-foreground)] truncate">
                      {user.name ?? user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-[var(--color-muted)] truncate">{user.email}</div>
                    )}
                  </div>
                </div>

                <Link
                  href={isOrganizer ? "/organizer/dashboard" : "/onboarding/organizer"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--color-pitch-700)] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[var(--color-pitch-800)] transition"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="flex-1">
                    {isOrganizer ? labels.openCabinet : labels.becomeOrganizer}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] transition"
                  >
                    <span className="flex-1">Admin</span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                  </Link>
                )}

                <Link
                  href="/me"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] transition"
                >
                  <User className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                  <span className="flex-1">Profile</span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{labels.signOut}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild variant="primary" size="lg" className="w-full justify-center">
                  <Link href="/sign-up" onClick={() => setOpen(false)}>
                    {labels.signUp}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full justify-center">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    {labels.signIn}
                  </Link>
                </Button>
              </div>
            )}

            {/* Nav links */}
            <nav>
              <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Menu
              </div>
              <div className="space-y-0.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-[var(--radius-lg)] px-4 py-3.5 text-base font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)] transition"
                  >
                    {l.label}
                    <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                  </Link>
                ))}
              </div>
            </nav>

            {/* Language */}
            <div>
              <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Language
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLocale(l)}
                    disabled={isPending}
                    className={`flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium transition ${
                      l === locale
                        ? "border-[var(--color-pitch-700)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                        : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    <span>{localeFlags[l]}</span>
                    {localeNames[l]}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
