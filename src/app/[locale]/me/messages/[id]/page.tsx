import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { auth } from "@/auth";
import { getInboxThreads, getThreadById } from "@/lib/messages";
import { ThreadList } from "@/components/messages/ThreadList";
import { ThreadView } from "@/components/messages/ThreadView";

export default async function MeThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const t = await getTranslations("messages");
  const userId = session.user.id;

  const [threads, thread] = await Promise.all([
    getInboxThreads(userId),
    getThreadById(id, userId),
  ]);
  if (!thread) notFound();

  return (
    <Container className="py-10">
      <h1 className="font-[family-name:var(--font-manrope)] mb-6 text-2xl font-bold text-[var(--color-foreground)]">
        {t("inboxTitle")}
      </h1>
      <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
        <div className="md:max-h-[calc(100vh-12rem)] md:overflow-y-auto">
          <ThreadList threads={threads} basePath="/me/messages" selectedId={thread.id} />
        </div>
        <div className="min-h-[60vh] md:max-h-[calc(100vh-12rem)]">
          <ThreadView
            thread={thread}
            currentUserId={userId}
            composerLabels={{
              placeholder: t("replyPlaceholder"),
              send: t("send"),
              sending: t("sending"),
            }}
          />
        </div>
      </div>
    </Container>
  );
}
