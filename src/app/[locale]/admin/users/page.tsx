import { setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { setUserRoleAction } from "@/app/actions/admin";

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { organizer: { select: { id: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)]">Users</h1>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <th className="px-4 py-2 text-left font-semibold">Email</th>
              <th className="px-4 py-2 text-left font-semibold">Name</th>
              <th className="px-4 py-2 text-left font-semibold">Role</th>
              <th className="px-4 py-2 text-left font-semibold">Organizer</th>
              <th className="px-4 py-2 text-left font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 text-[var(--color-foreground)]">{u.email}</td>
                <td className="px-4 py-3 text-[var(--color-muted-strong)]">{u.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <form action={setUserRoleAction} className="inline-flex">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="role" defaultValue={u.role} className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs">
                      <option value="USER">USER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button type="submit" className="ml-2 text-xs font-semibold text-[var(--color-pitch-700)] hover:underline">Save</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{u.organizer ? u.organizer.slug : "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{u.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
