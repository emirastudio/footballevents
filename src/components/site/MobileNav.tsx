import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { MobileNavClient, type MobileNavUser } from "./MobileNavClient";

type NavLink = { href: string; label: string };

export async function MobileNav({ links }: { links: NavLink[] }) {
  const [session, t, tAuth, tOrg] = await Promise.all([
    auth(),
    getTranslations("nav"),
    getTranslations("auth"),
    getTranslations("organizer"),
  ]);

  let user: MobileNavUser = null;
  if (session?.user) {
    const initials = (session.user.name ?? session.user.email ?? "U")
      .split(/\s+|@/)
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("");

    user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role,
      initials,
    };
  }

  return (
    <MobileNavClient
      links={links}
      user={user}
      labels={{
        signIn: tAuth("signIn"),
        signUp: tAuth("signUp"),
        signOut: tAuth("signOut"),
        becomeOrganizer: tOrg("becomeOrganizer"),
        openCabinet: tOrg("openCabinet"),
      }}
    />
  );
}
