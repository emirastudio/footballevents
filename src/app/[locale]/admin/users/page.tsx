import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { setUserRoleAction, banUserAction, unbanUserAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const session = await auth();
  const currentUserId = session?.user?.id;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { organizer: { select: { id: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">{t("users.title")}</h1>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.email")}</th>
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.name")}</th>
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.role")}</th>
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.organizer")}</th>
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.created")}</th>
              <th className="px-4 py-2 text-left font-semibold">{t("users.table.ban")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "ADMIN";
              const banned = !!u.bannedAt;
              return (
                <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--color-foreground)]">
                    <div className="flex items-center gap-2">
                      <span>{u.email}</span>
                      {banned && (
                        <span
                          title={u.banReason ?? undefined}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700"
                        >
                          {t("users.bannedBadge")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-strong)]">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={setUserRoleAction} className="inline-flex">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs">
                        <option value="USER">USER</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <button type="submit" className="ml-2 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline">{t("users.save")}</button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{u.organizer ? u.organizer.slug : "—"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{u.createdAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    {isSelf || isAdmin ? (
                      <span className="text-xs text-[var(--color-muted)]">—</span>
                    ) : banned ? (
                      <form action={unbanUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <ConfirmSubmitButton
                          message={t("users.confirmUnban", { email: u.email })}
                          className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-pitch-300)]"
                        >
                          {t("users.unban")}
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <form action={banUserAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="text"
                          name="reason"
                          placeholder={t("users.reasonPlaceholder")}
                          className="w-28 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                        />
                        <ConfirmSubmitButton
                          message={t("users.confirmBan", { email: u.email })}
                          className="rounded-[var(--radius-sm)] bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          {t("users.ban")}
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
