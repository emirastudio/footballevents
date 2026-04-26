import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { getInboxThreads } from "@/lib/messages";
import { ThreadList } from "@/components/messages/ThreadList";

export default async function MeMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("messages");
  const threads = await getInboxThreads(session.user.id);

  return (
    <Container className="py-10">
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        {t("inboxTitle")}
      </h1>
      <div className="mt-6">
        {threads.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-muted)]">
            {t("emptyInbox")}
          </p>
        ) : (
          <ThreadList threads={threads} basePath="/me/messages" />
        )}
      </div>
    </Container>
  );
}
