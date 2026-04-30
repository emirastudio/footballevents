import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Megaphone } from "lucide-react";
import { MarketingClient } from "@/components/organizer/MarketingClient";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const organizer = await db.organizer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, subscriptionTier: true },
  });
  if (!organizer) redirect("/onboarding/organizer");

  const rawEvents = await db.event.findMany({
    where: { organizerId: organizer.id },
    select: {
      id: true,
      slug: true,
      status: true,
      coverUrl: true,
      galleryUrls: true,
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  const slugs = rawEvents.map((e) => e.slug);
  const translations = slugs.length
    ? await db.eventTranslation.findMany({
        where: { event: { slug: { in: slugs } }, locale: { in: ["en", locale as never] } },
        select: { eventId: true, locale: true, title: true },
      })
    : [];

  const trMap = new Map<string, string>();
  for (const tr of translations) {
    if (!trMap.has(tr.eventId) || tr.locale === locale) {
      trMap.set(tr.eventId, tr.title);
    }
  }

  const events = rawEvents.map((e) => ({
    id: e.id,
    slug: e.slug,
    status: e.status,
    coverUrl: e.coverUrl,
    galleryUrls: e.galleryUrls,
    title: trMap.get(e.id) ?? e.slug,
  }));

  const t = await getTranslations("organizer");
  const mp = await getTranslations("organizer.marketingPage");

  const labels = {
    selectEvent: mp("selectEvent"),
    noEvents: mp("noEvents"),
    socialImage: {
      title: mp("socialImage.title"),
      hint: mp("socialImage.hint"),
      photoSection: mp("socialImage.photoSection"),
      useEventCover: mp("socialImage.useEventCover"),
      fromGallery: mp("socialImage.fromGallery"),
      uploadCustom: mp("socialImage.uploadCustom"),
      uploading: mp("socialImage.uploading"),
      noPhoto: mp("socialImage.noPhoto"),
      preview: mp("socialImage.preview"),
      download: mp("socialImage.download"),
      lockHint: mp("socialImage.lockHint"),
      upgrade: mp("socialImage.upgrade"),
    },
    pushNotifications: {
      title: mp("pushNotifications.title"),
      comingSoon: mp("pushNotifications.comingSoon"),
    },
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-[var(--color-pitch-600)]" />
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            {t("marketing")}
          </h1>
          <p className="text-sm text-[var(--color-muted-strong)]">{mp("subtitle")}</p>
        </div>
      </div>

      <MarketingClient
        events={events}
        tier={organizer.subscriptionTier}
        locale={locale}
        labels={labels}
      />
    </div>
  );
}
