import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { EmailChangeForm } from "@/components/profile/EmailChangeForm";
import { DeleteAccountForm } from "@/components/profile/DeleteAccountForm";
import { ChevronLeft } from "lucide-react";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("me");
  const tNav = await getTranslations("nav");

  const [user, pendingEmail, googleAccount] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.emailChangeRequest.findUnique({ where: { userId: session.user.id } }),
    db.account.findFirst({ where: { userId: session.user.id, provider: "google" } }),
  ]);
  if (!user) redirect("/sign-in");

  const sp = await searchParams;
  const emailFlash =
    sp.email === "changed" ? { kind: "ok" as const, msg: t("settings.emailChangedOk") }
    : sp.email === "expired" ? { kind: "err" as const, msg: t("settings.emailLinkExpired") }
    : sp.email === "taken" ? { kind: "err" as const, msg: t("settings.emailTaken") }
    : sp.email === "invalid" ? { kind: "err" as const, msg: t("settings.emailLinkInvalid") }
    : null;

  return (
    <Container className="py-10">
      <Link href="/me" className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
        <ChevronLeft className="h-4 w-4" /> {t("backToProfile")}
      </Link>

      <h1 className="mb-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
        {t("settings.title")}
      </h1>
      <p className="mb-8 text-sm text-[var(--color-muted-strong)]">{t("settings.subtitle")}</p>

      {emailFlash && (
        <div className={`mb-6 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
          emailFlash.kind === "ok"
            ? "border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-800)]"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {emailFlash.msg}
        </div>
      )}

      <div className="space-y-8">
        <Section title={t("settings.profileTitle")} subtitle={t("settings.profileSubtitle")}>
          <ProfileForm
            defaults={{
              name: user.name ?? "",
              image: user.image ?? "",
              preferredLocale: user.preferredLocale,
            }}
            labels={{
              name: t("settings.name"),
              avatar: t("settings.avatar"),
              locale: t("settings.locale"),
              submit: t("settings.save"),
              loading: t("settings.loading"),
              saved: t("settings.saved"),
              uploadLabel: t("settings.avatar"),
            }}
          />
        </Section>

        <Section title={t("settings.passwordTitle")} subtitle={user.passwordHash ? t("settings.passwordChangeSubtitle") : t("settings.passwordSetSubtitle")}>
          <PasswordForm
            labels={{
              hasPassword: !!user.passwordHash,
              current: t("settings.passwordCurrent"),
              next: t("settings.passwordNew"),
              submit: user.passwordHash ? t("settings.passwordChange") : t("settings.passwordSet"),
              loading: t("settings.loading"),
              saved: t("settings.passwordSaved"),
              hint: t("settings.passwordHint"),
            }}
          />
        </Section>

        <Section title={t("settings.emailTitle")} subtitle={t("settings.emailSubtitle")}>
          <EmailChangeForm
            currentEmail={user.email}
            pendingEmail={pendingEmail?.newEmail ?? null}
            labels={{
              current: t("settings.emailCurrent"),
              next: t("settings.emailNew"),
              submit: t("settings.emailSubmit"),
              loading: t("settings.loading"),
              sent: t("settings.emailSent"),
              pending: t("settings.emailPending"),
            }}
          />
        </Section>

        <Section title={t("settings.connectionsTitle")} subtitle={t("settings.connectionsSubtitle")}>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5">
              <span>Google</span>
              <span className={`text-xs font-semibold ${googleAccount ? "text-[var(--color-pitch-700)]" : "text-[var(--color-muted)]"}`}>
                {googleAccount ? t("settings.linked") : t("settings.notLinked")}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5">
              <span>{t("settings.password")}</span>
              <span className={`text-xs font-semibold ${user.passwordHash ? "text-[var(--color-pitch-700)]" : "text-[var(--color-muted)]"}`}>
                {user.passwordHash ? t("settings.set") : t("settings.notSet")}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2.5">
              <span>{t("settings.magicLink")}</span>
              <span className="text-xs font-semibold text-[var(--color-pitch-700)]">{t("settings.alwaysOn")}</span>
            </li>
          </ul>
        </Section>

        <Section title={t("settings.dangerTitle")} subtitle={t("settings.dangerSubtitle")} danger>
          <DeleteAccountForm
            labels={{
              warning: t("settings.deleteWarning"),
              confirmHint: t("settings.deleteConfirmHint"),
              submit: t("settings.deleteSubmit"),
              loading: t("settings.loading"),
              cancel: t("settings.cancel"),
              open: t("settings.deleteOpen"),
            }}
          />
        </Section>
      </div>
    </Container>
  );
}

function Section({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`rounded-[var(--radius-2xl)] border bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xs)] ${
      danger ? "border-red-200" : "border-[var(--color-border)]"
    }`}>
      <h2 className={`font-[family-name:var(--font-manrope)] text-lg font-bold ${
        danger ? "text-red-700" : "text-[var(--color-foreground)]"
      }`}>
        {title}
      </h2>
      {subtitle && <p className="mt-1 mb-5 text-sm text-[var(--color-muted-strong)]">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-5"}>{children}</div>
    </section>
  );
}
