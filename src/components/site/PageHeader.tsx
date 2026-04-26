import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-hero-stadium">
      <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
      <Container className="relative py-12 sm:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-[var(--color-muted)]">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {c.href ? (
                  <Link href={c.href} className="hover:text-[var(--color-pitch-700)]">{c.label}</Link>
                ) : (
                  <span className="text-[var(--color-foreground)]">{c.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
            {eyebrow}
          </div>
        )}
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-pretty text-[var(--color-muted-strong)]">{subtitle}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </section>
  );
}
