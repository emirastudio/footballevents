import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ next?: string; email?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const sp = await searchParams;
  const callbackUrl = sp?.next ?? undefined;
  const defaultEmail = sp?.email ?? undefined;
  const fromInvite = !!callbackUrl && callbackUrl.startsWith("/join/");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
        <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
          {t("signInTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t("signInSubtitle")}</p>

        {fromInvite && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] p-3 text-sm text-[var(--color-pitch-800)]">
            <p className="font-semibold">{t("inviteBannerTitle")}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-strong)]">{t("inviteBannerBody")}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <GoogleSignInButton label={t("continueWithGoogle")} callbackUrl={callbackUrl} />
          <div className="relative text-center text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <span className="relative z-10 bg-[var(--color-surface)] px-3">{t("or")}</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)]" aria-hidden />
          </div>
          <SignInForm
            callbackUrl={callbackUrl}
            defaultEmail={defaultEmail}
            labels={{
              email: t("email"),
              password: t("password"),
              submit: t("signIn"),
              loading: t("loading"),
            }}
          />

          <div className="relative text-center text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <span className="relative z-10 bg-[var(--color-surface)] px-3">{t("or")}</span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)]" aria-hidden />
          </div>

          <MagicLinkForm
            callbackUrl={callbackUrl}
            defaultEmail={defaultEmail}
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
          {t("noAccount")}{" "}
          <Link href="/sign-up" className="font-semibold text-[var(--color-pitch-700)] hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
