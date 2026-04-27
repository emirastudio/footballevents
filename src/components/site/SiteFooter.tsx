import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";

export async function SiteFooter() {
  const tNav = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tMeta = await getTranslations("meta");

  const cols = [
    {
      title: tFooter("explore"),
      items: [
        { href: "/events", label: tNav("events") },
        { href: "/categories/tournaments", label: tNav("tournaments") },
        { href: "/categories/camps", label: tNav("camps") },
        { href: "/categories/festivals", label: tNav("festivals") },
        { href: "/categories/match-tours", label: tNav("matchTours") },
      ],
    },
    {
      title: tFooter("forBusiness"),
      items: [
        { href: "/organizer/events/new", label: tNav("postEvent") },
        { href: "/advertise", label: tNav("advertise") },
        { href: "/pricing", label: "Pricing" },
      ],
    },
    {
      title: tFooter("company"),
      items: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/blog", label: "Blog" },
      ],
    },
    {
      title: tFooter("legal"),
      items: [
        { href: "/legal/terms", label: tFooter("terms") },
        { href: "/legal/privacy", label: tFooter("privacy") },
        { href: "/legal/refund", label: tFooter("refund") },
        { href: "/legal/cookies", label: tFooter("cookies") },
        { href: "/legal/imprint", label: tFooter("imprint") },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs font-[family-name:var(--font-manrope)] text-base font-semibold text-[var(--color-foreground)]">
              {tMeta("slogan")}.
            </p>
            <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
              {tFooter("tagline")}
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {c.title}
              </h4>
              <ul className="space-y-2.5">
                {c.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className="text-sm text-[var(--color-foreground)] transition-colors hover:text-[var(--color-pitch-700)]"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-[var(--color-border)] py-6 text-sm text-[var(--color-muted)] md:flex-row md:items-center">
          <span>
            © {new Date().getFullYear()} footballevents.eu — {tFooter("rights")}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest">
            Made for football fans worldwide ⚽
          </span>
        </div>
      </Container>
    </footer>
  );
}
