import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("signInTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t("signInSubtitle")}</p>

        <div className="mt-6">
          <SignInForm
            labels={{
              email: t("email"),
              password: t("password"),
              submit: t("signIn"),
              loading: t("loading"),
            }}
          />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {t("noAccount")}{" "}
          <Link href="/sign-up" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
