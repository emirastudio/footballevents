import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { CheckCircle2 } from "lucide-react";

export default async function ThanksPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reviews");

  return (
    <Container className="max-w-xl py-16">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--color-pitch-600)]" />
        <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("successTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-strong)]">
          {t("successBody")}
        </p>
        <Link
          href={`/events/${slug}`}
          className="mt-6 inline-block rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-500)]"
        >
          ← {t("backToEvent")}
        </Link>
      </div>
    </Container>
  );
}
