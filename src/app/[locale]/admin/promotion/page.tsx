import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Megaphone } from "lucide-react";
import { AD_THEMES } from "@/lib/promotion-ad-themes";
import { AdDownloadCard } from "./AdDownloadCard";

export default async function PromotionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/");
  if (session.user.email !== "Goality360@gmail.com") redirect("/admin/dashboard");

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2.5">
          <Megaphone className="h-6 w-6 text-[var(--color-pitch-600)]" />
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
            Project Promotion Materials
          </h1>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Download ready-made ad creatives for social media — 20 themes × 3 languages (EN / RU / ES) × 3 formats.
          Switch language on each card before downloading.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {[
            { label: "Post", size: "1080×1350 px", hint: "Instagram feed 4:5" },
            { label: "Story", size: "1080×1920 px", hint: "Stories / TikTok / Reels 9:16" },
            { label: "Landscape", size: "1920×1080 px", hint: "YouTube / Facebook / Twitter 16:9" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-[var(--color-muted-strong)]"
            >
              <span className="font-bold">{f.label}</span>
              <span className="text-[var(--color-muted)]">{f.size}</span>
              <span className="hidden text-[var(--color-muted)] sm:inline">· {f.hint}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {AD_THEMES.map((theme) => (
          <AdDownloadCard key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );
}
