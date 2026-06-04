import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInboxThreads } from "@/lib/messages";
import { requireOrgPage } from "@/lib/organizer-access";
import { ThreadList } from "@/components/messages/ThreadList";

export default async function OrganizerMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { organizer } = await requireOrgPage(session.user.id, "messages");

  const t = await getTranslations("messages");
  const threads = await getInboxThreads(organizer.userId);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        {t("inboxTitle")}
      </h1>
      <div className="mt-6">
        {threads.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-muted)]">
            {t("emptyInboxOrganizer")}
          </p>
        ) : (
          <ThreadList threads={threads} basePath="/organizer/messages" />
        )}
      </div>
    </div>
  );
}
