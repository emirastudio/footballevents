"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";

const primary = [
  { href: "/about", label: "О проекте" },
  { href: "/about/tournaments", label: "Турниры" },
  { href: "/about/camps", label: "Лагеря" },
  { href: "/about/for-organizers", label: "Для организаторов" },
  { href: "/about/for-clubs", label: "Для клубов" },
  { href: "/about/academy-trials", label: "Просмотры в академиях" },
];

const secondary = [
  { href: "/about/for-players", label: "Для игроков и родителей" },
  { href: "/about/festivals", label: "Фестивали" },
  { href: "/about/match-tours", label: "Туры на матчи" },
  { href: "/about/training-camps", label: "Тренировочные сборы" },
  { href: "/contact", label: "Контакты" },
  { href: "/blog", label: "Блог" },
];

export function FooterAboutMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        О проекте
      </h4>
      <ul className="space-y-2.5">
        {primary.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[var(--color-foreground)] transition-colors hover:text-[var(--color-pitch-700)]"
            >
              {link.label}
            </Link>
          </li>
        ))}

        <li>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
          >
            {open ? "Скрыть" : "Ещё"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </li>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {secondary.map((link) => (
            <li key={link.href} className="pt-2.5">
              <Link
                href={link.href}
                className="text-sm text-[var(--color-foreground)] transition-colors hover:text-[var(--color-pitch-700)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
}
