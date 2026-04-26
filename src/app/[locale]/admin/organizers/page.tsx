import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import {
  setOrganizerVerifiedAction,
  setOrganizerTierAction,
} from "@/app/actions/admin";
import type { Prisma } from "@prisma/client";

const TIERS = ["FREE", "PRO", "PREMIUM", "ENTERPRISE"] as const;

export default async function AdminOrganizersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tier?: string; verified?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const tierFilter = sp.tier?.toUpperCase();
  const verifiedFilter = sp.verified;

  const where: Prisma.OrganizerWhereInput = {};
  if (tierFilter && (TIERS as readonly string[]).includes(tierFilter)) {
    where.subscriptionTier = tierFilter as (typeof TIERS)[number];
  }
  if (verifiedFilter === "yes") where.isVerified = true;
  else if (verifiedFilter === "no") where.isVerified = false;

  const organizers = await db.organizer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  });

  const filterChips: Array<{ label: string; href: string; active: boolean }> = [
    { label: "All", href: "/admin/organizers", active: !tierFilter && !verifiedFilter },
    ...TIERS.map((t) => ({
      label: t,
      href: `/admin/organizers?tier=${t.toLowerCase()}`,
      active: tierFilter === t,
    })),
    { label: "Verified", href: "/admin/organizers?verified=yes", active: verifiedFilter === "yes" },
    { label: "Unverified", href: "/admin/organizers?verified=no", active: verifiedFilter === "no" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">
        Organizers
      </h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {filterChips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              c.active
                ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:border-[var(--color-pitch-300)]"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-4 py-2 text-left font-semibold">Name</th>
              <th className="px-4 py-2 text-left font-semibold">Email</th>
              <th className="px-4 py-2 text-left font-semibold">Slug</th>
              <th className="px-4 py-2 text-left font-semibold">Tier</th>
              <th className="px-4 py-2 text-left font-semibold">Sub ends</th>
              <th className="px-4 py-2 text-left font-semibold">Verified</th>
              <th className="px-4 py-2 text-left font-semibold">Grant tier</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((o) => (
              <tr key={o.id} className="border-b border-[var(--color-border)] align-top last:border-0">
                <td className="px-4 py-3 text-[var(--color-foreground)]">{o.name}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted-strong)]">
                  <div>{o.email}</div>
                  {o.user?.email && o.user.email !== o.email && (
                    <div className="text-[var(--color-muted)]">{o.user.email}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <Link
                    href={`/organizers/${o.slug}`}
                    className="font-semibold text-[var(--color-pitch-700)] hover:underline"
                  >
                    {o.slug}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-foreground)]">
                  {o.subscriptionTier}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                  {o.subscriptionEndsAt ? o.subscriptionEndsAt.toISOString().slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-3">
                  <form action={setOrganizerVerifiedAction} className="inline-flex">
                    <input type="hidden" name="organizerId" value={o.id} />
                    <input type="hidden" name="verified" value={o.isVerified ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold ${
                        o.isVerified
                          ? "bg-[var(--color-pitch-500)] text-white hover:bg-[var(--color-pitch-600)]"
                          : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-pitch-300)]"
                      }`}
                    >
                      {o.isVerified ? "Verified ✓" : "Verify"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={setOrganizerTierAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="organizerId" value={o.id} />
                    <select
                      name="tier"
                      defaultValue={o.subscriptionTier}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="monthsValid"
                      min={1}
                      defaultValue={1}
                      className="w-14 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded-[var(--radius-sm)] bg-[var(--color-pitch-500)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--color-pitch-600)]"
                    >
                      Grant
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
