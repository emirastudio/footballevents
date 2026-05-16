import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 font-[family-name:var(--font-manrope)] text-6xl font-bold text-[var(--color-pitch-200)]">
        404
      </div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--color-muted-strong)]">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-pitch-500)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-pitch-600)]"
        >
          <Search className="h-4 w-4" /> Browse events
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
