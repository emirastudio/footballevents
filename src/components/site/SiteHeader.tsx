import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tAuth = await getTranslations("auth");
  const tOrg = await getTranslations("organizer");

  const links = [
    { href: "/events", label: t("events") },
    { href: "/org", label: t("organizers") },
    { href: "/stadiums", label: t("stadiums") },
    { href: "/advertise", label: t("advertise") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <UserMenu
              signInLabel={tAuth("signIn")}
              signUpLabel={tAuth("signUp")}
              signOutLabel={tAuth("signOut")}
              becomeOrganizerLabel={tOrg("becomeOrganizer")}
              openCabinetLabel={tOrg("openCabinet")}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
