"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { joinWaitlist } from "@/app/[locale]/actions/waitlist";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { PlusCircle, CheckCircle2 } from "lucide-react";

export function WaitlistEmptyState({
  countryCode,
  locationName,
  cityId,
}: {
  countryCode?: string;
  locationName: string;
  cityId?: string;
}) {
  const t = useTranslations("countries");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const role = formData.get("role") as any;

    startTransition(async () => {
      const res = await joinWaitlist({ email, role, countryCode, cityId });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || t("waitlistError"));
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="grid divide-y divide-[var(--color-border)] md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Left Side: Users */}
        <div className="p-8 sm:p-10">
          <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("waitlistTitle", { country: locationName })}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-strong)]">
            {t("waitlistSubtitle")}
          </p>

          {success ? (
            <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] bg-green-50 p-4 border border-green-200">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <div className="text-sm font-semibold text-green-900">{t("waitlistSuccessTitle")}</div>
                <div className="text-sm text-green-700">{t("waitlistSuccessText")}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium text-[var(--color-foreground)]">
                  {t("waitlistRoleLabel")}
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-transparent px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-pitch-500)]"
                  defaultValue=""
                >
                  <option value="" disabled>{t("waitlistRolePlaceholder")}</option>
                  <option value="PARENT">{t("roleParent")}</option>
                  <option value="COACH">{t("roleCoach")}</option>
                  <option value="CLUB_MANAGER">{t("roleClubManager")}</option>
                  <option value="PLAYER">{t("rolePlayer")}</option>
                  <option value="OTHER">{t("roleOther")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
                  {t("waitlistEmailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder={t("waitlistEmailPlaceholder")}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-transparent px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-pitch-500)]"
                />
              </div>

              <Button type="submit" variant="accent" className="w-full" disabled={isPending}>
                {isPending ? t("waitlistSubmitting") : t("waitlistSubmit")}
              </Button>
            </form>
          )}
        </div>

        {/* Right Side: Organizers */}
        <div className="flex flex-col justify-center bg-[var(--color-soft-cream)]/30 p-8 sm:p-10 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--color-pitch-100)] text-[var(--color-pitch-600)]">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight text-[var(--color-foreground)]">
            {t("waitlistOrgTitle", { country: locationName })}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted-strong)]">
            {t("waitlistOrgSubtitle")}
          </p>
          <div className="mt-6">
            <Button variant="outline" size="lg" asChild>
              <Link href="/organizer/events/new">
                {t("ctaList")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
