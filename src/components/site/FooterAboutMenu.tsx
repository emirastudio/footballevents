"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";

const aboutLinks = [
  { href: "/about", label: "О проекте" },
  { href: "/about/for-organizers", label: "Для организаторов" },
  { href: "/about/for-clubs", label: "Для клубов" },
  { href: "/about/for-players", label: "Для игроков и родителей" },
  { href: "/about/tournaments", label: "Турниры" },
  { href: "/about/camps", label: "Футбольные лагеря" },
  { href: "/about/festivals", label: "Фестивали" },
  { href: "/about/match-tours", label: "Туры на матчи" },
  { href: "/about/training-camps", label: "Тренировочные сборы" },
  { href: "/about/academy-trials", label: "Просмотры в академиях" },
  { href: "/contact", label: "Контакты" },
  { href: "/blog", label: "Блог" },
];

export function FooterAboutMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        aria-expanded={open}
      >
        О проекте
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="mt-4 space-y-2.5">
          {aboutLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-[var(--color-foreground)] transition-colors hover:text-[var(--color-pitch-700)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
