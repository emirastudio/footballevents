"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Filter, X } from "lucide-react";
import { countries, ageGroups, formats, categories } from "@/lib/mock-data";

type Labels = {
  filters: string; reset: string; apply: string;
  search: string; country: string; category: string; ageGroup: string;
  format: string; gender: string; price: string; freeOnly: string;
  any: string; male: string; female: string; mixed: string; from: string; to: string;
  categoryNames: Record<string, string>;
};

export function EventFilters({ labels }: { labels: Labels }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [q,        setQ]        = useState(params.get("q") ?? "");
  const [country,  setCountry]  = useState(params.get("country") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [age,      setAge]      = useState(params.get("age") ?? "");
  const [format,   setFormat]   = useState(params.get("format") ?? "");
  const [gender,   setGender]   = useState(params.get("gender") ?? "");
  const [free,     setFree]     = useState(params.get("free") === "1");
  const [priceMax, setPriceMax] = useState(params.get("priceMax") ?? "");

  useEffect(() => { setOpen(false); }, [pathname]);

  function apply() {
    const sp = new URLSearchParams();
    if (q)        sp.set("q",       q);
    if (country)  sp.set("country", country);
    if (category) sp.set("category", category);
    if (age)      sp.set("age",     age);
    if (format)   sp.set("format",  format);
    if (gender)   sp.set("gender",  gender);
    if (free)     sp.set("free",    "1");
    if (priceMax) sp.set("priceMax", priceMax);
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }
  function reset() {
    setQ(""); setCountry(""); setCategory(""); setAge(""); setFormat(""); setGender(""); setFree(false); setPriceMax("");
    startTransition(() => { router.push(pathname); });
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );

  const selectClass = "w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-8 text-sm text-[var(--color-foreground)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-surface-muted)] lg:hidden"
      >
        <Filter className="h-4 w-4" />
        {labels.filters}
      </button>

      <aside
        className={`fixed inset-0 z-50 lg:static lg:z-auto ${open ? "" : "pointer-events-none lg:pointer-events-auto"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/30 transition-opacity lg:hidden ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div className={`absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-auto bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xl)] transition-transform lg:static lg:h-auto lg:w-full lg:max-w-none lg:translate-x-0 lg:rounded-[var(--radius-lg)] lg:border lg:border-[var(--color-border)] lg:p-5 lg:shadow-none ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-manrope)] text-base font-bold text-[var(--color-foreground)]">
              {labels.filters}
            </h2>
            <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <Field label={labels.search}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={labels.search}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
              />
            </Field>

            <Field label={labels.country}>
              <div className="relative">
                <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
                  <option value="">{labels.any}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              </div>
            </Field>

            <Field label={labels.category}>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                  <option value="">{labels.any}</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{labels.categoryNames[c.slug] ?? c.slug}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={labels.ageGroup}>
                <div className="relative">
                  <select value={age} onChange={(e) => setAge(e.target.value)} className={selectClass}>
                    <option value="">{labels.any}</option>
                    {ageGroups.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                </div>
              </Field>
              <Field label={labels.format}>
                <div className="relative">
                  <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectClass}>
                    <option value="">{labels.any}</option>
                    {formats.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                </div>
              </Field>
            </div>

            <Field label={labels.gender}>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "MALE",   l: labels.male },
                  { v: "FEMALE", l: labels.female },
                  { v: "MIXED",  l: labels.mixed },
                ].map((g) => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => setGender(gender === g.v ? "" : g.v)}
                    className={`rounded-[var(--radius-md)] border px-2 py-1.5 text-xs font-medium transition-colors ${
                      gender === g.v
                        ? "border-[var(--color-pitch-500)] bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] hover:bg-[var(--color-surface-muted)]"
                    }`}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`${labels.price} (€)`}>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder={labels.to}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:border-[var(--color-pitch-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pitch-500)]/20"
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={free}
                onChange={(e) => setFree(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-pitch-500)] focus:ring-[var(--color-pitch-500)]"
              />
              <span className="text-[var(--color-foreground)]">{labels.freeOnly}</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={apply}
                className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-pitch-600)]"
              >
                {labels.apply}
              </button>
              <button
                onClick={reset}
                className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
              >
                {labels.reset}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
