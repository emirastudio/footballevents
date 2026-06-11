import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { acceptInviteAction } from "@/app/actions/team";
import { signOutAction } from "@/app/actions/auth";
import { UserPlus } from "lucide-react";

const L: Record<string, {
  title: string; body: string; as: string; manager: string; staff: string;
  accept: string; invalid: string; invalidBody: string; home: string;
  mismatchTitle: string; mismatchBody: string; mismatchSignedInAs: string; signOut: string;
}> = {
  en: { title: "Team invitation", body: "You're invited to join", as: "as", manager: "Manager", staff: "Staff",
    accept: "Accept & join", invalid: "Invitation unavailable", invalidBody: "This invitation is invalid or has already been used.", home: "Go to homepage",
    mismatchTitle: "Wrong account",
    mismatchBody: "This invitation is for {inviteEmail}. Please sign out and sign in with that email — then open the link from the invitation email again.",
    mismatchSignedInAs: "You're signed in as {currentEmail}.",
    signOut: "Sign out" },
  ru: { title: "Приглашение в команду", body: "Вас приглашают в", as: "роль:", manager: "Менеджер", staff: "Сотрудник",
    accept: "Принять и войти", invalid: "Приглашение недоступно", invalidBody: "Это приглашение недействительно или уже использовано.", home: "На главную",
    mismatchTitle: "Не тот аккаунт",
    mismatchBody: "Это приглашение для {inviteEmail}. Выйдите из аккаунта и войдите под этим email, затем откройте ссылку из письма ещё раз.",
    mismatchSignedInAs: "Сейчас вы вошли как {currentEmail}.",
    signOut: "Выйти" },
  de: { title: "Team-Einladung", body: "Du wurdest eingeladen zu", as: "als", manager: "Manager", staff: "Mitarbeiter",
    accept: "Annehmen & beitreten", invalid: "Einladung nicht verfügbar", invalidBody: "Diese Einladung ist ungültig oder wurde bereits verwendet.", home: "Zur Startseite",
    mismatchTitle: "Falsches Konto",
    mismatchBody: "Diese Einladung ist für {inviteEmail}. Bitte abmelden und mit dieser E-Mail anmelden — dann den Link aus der Einladungs-E-Mail erneut öffnen.",
    mismatchSignedInAs: "Du bist angemeldet als {currentEmail}.",
    signOut: "Abmelden" },
  es: { title: "Invitación al equipo", body: "Te han invitado a unirte a", as: "como", manager: "Mánager", staff: "Personal",
    accept: "Aceptar y unirse", invalid: "Invitación no disponible", invalidBody: "Esta invitación no es válida o ya se ha usado.", home: "Ir al inicio",
    mismatchTitle: "Cuenta incorrecta",
    mismatchBody: "Esta invitación es para {inviteEmail}. Cierra sesión e inicia con ese correo — luego abre de nuevo el enlace del correo de invitación.",
    mismatchSignedInAs: "Has iniciado sesión como {currentEmail}.",
    signOut: "Cerrar sesión" },
};

export default async function JoinPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = L[locale] ?? L.en;

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?next=/join/${token}`);

  const invite = await db.organizerInvite.findUnique({
    where: { token },
    include: { organizer: { select: { name: true } } },
  });

  const invalid = !invite || invite.acceptedAt;
  const roleLabel = invite?.role === "MANAGER" ? t.manager : t.staff;

  // Email mismatch: the signed-in user is not the one the invite was sent to.
  // The invite token is bearer auth, so a forwarded link could otherwise let
  // a stranger grant themselves a role. Lock acceptance to the invited mailbox
  // and surface a recoverable error here (sign-out → sign-in → re-open link).
  const currentEmail = session.user.email?.toLowerCase() ?? null;
  const inviteEmail = invite?.email?.toLowerCase() ?? null;
  const emailMismatch =
    !invalid && !!currentEmail && !!inviteEmail && currentEmail !== inviteEmail;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-sm)]">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-600)]">
          <UserPlus className="h-7 w-7" />
        </div>
        {invalid ? (
          <>
            <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{t.invalid}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-strong)]">{t.invalidBody}</p>
            <Button asChild variant="outline" size="lg" className="mt-6"><a href={`/${locale}`}>{t.home}</a></Button>
          </>
        ) : emailMismatch ? (
          <>
            <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{t.mismatchTitle}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
              {t.mismatchBody.replace("{inviteEmail}", invite!.email)}
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {t.mismatchSignedInAs.replace("{currentEmail}", session.user.email ?? "—")}
            </p>
            <form action={signOutAction} className="mt-6">
              <Button type="submit" variant="outline" size="lg" className="w-full">{t.signOut}</Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">{t.title}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
              {t.body} <strong>{invite!.organizer.name}</strong> · {t.as} <strong>{roleLabel}</strong>
            </p>
            <form action={acceptInviteAction} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="accent" size="lg" className="w-full">{t.accept}</Button>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
