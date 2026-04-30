import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { auth } from "@/auth";

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) {
    const role = sp.role;
    if (role === "organizer") {
      const promo = sp.promo ? `?promo=${encodeURIComponent(sp.promo)}` : "";
      redirect(`/${locale}/onboarding/organizer${promo}`);
    }
    redirect(`/${locale}`);
  }

  const t = await getTranslations("auth");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("signUpTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t("signUpSubtitle")}</p>

        <div className="mt-6 space-y-4">
          <GoogleSignInButton label={t("continueWithGoogle")} />
          <div className="relative text-center text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <span className="relative z-10 bg-[var(--color-surface)] px-3">{t("or")}</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)]" aria-hidden />
          </div>
          <SignUpForm
            labels={{
              name: t("name"),
              email: t("email"),
              password: t("password"),
              passwordHint: t("passwordHint"),
              submit: t("signUp"),
              loading: t("loading"),
            }}
          />

          <div className="relative text-center text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <span className="relative z-10 bg-[var(--color-surface)] px-3">{t("or")}</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)]" aria-hidden />
          </div>

          <MagicLinkForm
            labels={{
              email: t("email"),
              submit: t("magicLinkSubmit"),
              loading: t("loading"),
              sentTitle: t("magicLinkSentTitle"),
              sentBody: t("magicLinkSentBody"),
            }}
          />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          {t("haveAccount")}{" "}
          <Link href="/sign-in" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
