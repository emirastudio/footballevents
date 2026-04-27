import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { Mail } from "lucide-react";

export default async function CheckEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)] ring-1 ring-[var(--color-pitch-200)]">
          <Mail className="h-6 w-6" />
        </span>
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("magicLinkSentTitle")}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{t("magicLinkSentBody")}</p>
        <p className="mt-6 text-xs text-[var(--color-muted)]">{t("magicLinkExpiry")}</p>
        <Link href="/sign-in" className="mt-6 inline-block text-sm font-semibold text-[var(--color-pitch-700)] hover:underline">
          ← {t("backToSignIn")}
        </Link>
      </div>
    </Container>
  );
}
