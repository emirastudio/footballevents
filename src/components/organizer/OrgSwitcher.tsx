"use client";

import { useState } from "react";
import { switchOrganizerAction } from "@/app/actions/team";
import { Check, ChevronsUpDown, Crown } from "lucide-react";

export type OrgSwitcherItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  tier: string; // SubscriptionTier as a string
  role: "OWNER" | "MANAGER" | "STAFF";
};

export function OrgSwitcher({
  active,
  items,
  labels,
}: {
  active: OrgSwitcherItem;
  items: OrgSwitcherItem[];
  labels: {
    switchTo: string;       // "Switch to" header in dropdown
    owner: string;          // role badge: "Owner"
    manager: string;        // role badge: "Manager"
    staff: string;          // role badge: "Staff"
    activeBadge: string;    // shown next to the active item: "Current"
  };
}) {
  const [open, setOpen] = useState(false);
  const roleLabel = (r: OrgSwitcherItem["role"]) =>
    r === "OWNER" ? labels.owner : r === "MANAGER" ? labels.manager : labels.staff;

  // Only show the dropdown affordance when there's actually something to switch
  // between. Single-org users get the read-only card they had before.
  const isMulti = items.length > 1;

  const card = (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-cover bg-center bg-[var(--color-bg-muted)]"
        style={active.logoUrl ? { backgroundImage: `url(${active.logoUrl})` } : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{active.name}</div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {active.role === "OWNER" ? active.tier : roleLabel(active.role)}
        </div>
      </div>
      {isMulti && <ChevronsUpDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />}
    </div>
  );

  if (!isMulti) {
    return (
      <a
        href={`/org/${active.slug}`}
        className="mb-5 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-pitch-300)]"
      >
        {card}
      </a>
    );
  }

  return (
    <div className="relative mb-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:border-[var(--color-pitch-300)]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {card}
      </button>

      {open && (
        <>
          {/* click-away catcher */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-lg)]"
          >
            <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {labels.switchTo}
            </p>
            {items.map((it) => {
              const isActive = it.id === active.id;
              return (
                <form key={it.id} action={switchOrganizerAction}>
                  <input type="hidden" name="organizerId" value={it.id} />
                  <button
                    type="submit"
                    role="option"
                    aria-selected={isActive}
                    className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-left transition ${
                      isActive
                        ? "bg-[var(--color-pitch-50)]"
                        : "hover:bg-[var(--color-bg-muted)]"
                    }`}
                  >
                    <div
                      className="h-7 w-7 shrink-0 rounded-[var(--radius-sm)] bg-cover bg-center bg-[var(--color-bg-muted)]"
                      style={it.logoUrl ? { backgroundImage: `url(${it.logoUrl})` } : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                          {it.name}
                        </span>
                        {it.role === "OWNER" && (
                          <Crown className="h-3 w-3 shrink-0 text-[var(--color-pitch-600)]" aria-hidden />
                        )}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                        {it.role === "OWNER" ? `${roleLabel(it.role)} · ${it.tier}` : roleLabel(it.role)}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-pitch-700)]">
                        <Check className="h-3 w-3" />
                        {labels.activeBadge}
                      </span>
                    ) : null}
                  </button>
                </form>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
