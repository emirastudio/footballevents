import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { DestinationsMenu } from "./DestinationsMenu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tAuth = await getTranslations("auth");
  const tOrg = await getTranslations("organizer");
  const tClub = await getTranslations("club");
  const tCommon = await getTranslations("common");

  // Try locale-specific labels with sensible English fallbacks so missing
  // translation keys never crash the header.
  const safe = (fn: () => string, fallback: string) => {
    try { return fn(); } catch { return fallback; }
  };
  const byCountryLabel = safe(() => t("byCountry"), "By country");
  const byCityLabel    = safe(() => t("byCity"),    "By city");
  const viewAllLabel   = safe(() => t("viewAll"),   safe(() => tCommon("viewAll"), "View all events"));

  // Mobile drawer keeps Events as a top-level item (no hover-menu room).
  // Desktop replaces it with the DestinationsMenu dropdown below.
  const mobileLinks = [
    { href: "/events", label: t("events") },
    { href: "/org", label: t("organizers") },
    { href: "/stadiums", label: t("stadiums") },
    { href: "/advertise", label: t("advertise") },
  ];
  const desktopSecondaryLinks = [
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
              {/* Destinations dropdown — exposes city/country pSEO hubs to crawlers */}
              <DestinationsMenu
                label={t("events")}
                byCountryLabel={byCountryLabel}
                byCityLabel={byCityLabel}
                viewAllLabel={viewAllLabel}
              />
              {desktopSecondaryLinks.map((l) => (
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
            {/* Desktop: locale + full user menu */}
            <div className="hidden lg:flex items-center gap-2">
              <LocaleSwitcher />
              <UserMenu
                signInLabel={tAuth("signIn")}
                signUpLabel={tAuth("signUp")}
                signOutLabel={tAuth("signOut")}
                becomeOrganizerLabel={tOrg("becomeOrganizer")}
                openCabinetLabel={tOrg("openCabinet")}
                myClubLabel={tClub("myClubMenuLabel")}
              />
            </div>

            {/* Mobile: hamburger → full-screen drawer */}
            <MobileNav links={mobileLinks} />
          </div>
        </div>
      </Container>
    </header>
  );
}
