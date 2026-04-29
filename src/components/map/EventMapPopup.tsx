"use client";

import { Link } from "@/i18n/navigation";
import { Calendar, MapPin, ArrowRight, X, Zap } from "lucide-react";
import { formatDateRange } from "@/lib/format";
import { getCountry } from "@/lib/mock-data";

export type EventPin = {
  id: string;
  slug: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  countryCode: string;
  logoUrl: string | null;
  categorySlug: string;
};

const CATEGORY_COLORS: Record<string, { bg: string; label: string }> = {
  tournaments:   { bg: "#00D26A", label: "Tournament" },
  camps:         { bg: "#3B82F6", label: "Camp" },
  festivals:     { bg: "#F59E0B", label: "Festival" },
  masterclasses: { bg: "#8B5CF6", label: "Masterclass" },
  "match-tours": { bg: "#EF4444", label: "Match Tour" },
  showcases:     { bg: "#EC4899", label: "Showcase" },
};

type Props = {
  event: EventPin;
  locale: string;
  onClose: () => void;
};

export function EventMapPopup({ event: e, locale, onClose }: Props) {
  const country = getCountry(e.countryCode);
  const cat = CATEGORY_COLORS[e.categorySlug] ?? { bg: "#00D26A", label: e.categorySlug };

  return (
    <div className="w-[260px] overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
      {/* Header with logo + category accent */}
      <div
        className="relative flex h-[88px] items-center justify-center"
        style={{ background: `linear-gradient(135deg, #0A1628 0%, #162035 100%)` }}
      >
        {/* Category color stripe */}
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: cat.bg }}
        />

        {e.logoUrl ? (
          <div
            className="h-14 w-14 rounded-xl border-2 border-white/20 bg-cover bg-center shadow-lg"
            style={{ backgroundImage: `url(${e.logoUrl})` }}
          />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/20 shadow-lg"
            style={{ backgroundColor: cat.bg + "33" }}
          >
            <Zap className="h-6 w-6" style={{ color: cat.bg }} />
          </div>
        )}

        {/* Category badge */}
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: cat.bg }}
        >
          {cat.label}
        </span>

        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <h3 className="text-[13px] font-bold leading-snug text-[#0A1628] line-clamp-2">
          {e.title}
        </h3>

        <div className="mt-2 space-y-1">
          {e.startDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3 w-3 shrink-0 text-[#00D26A]" />
              <span>{formatDateRange(e.startDate, e.endDate ?? "", locale)}</span>
            </div>
          )}
          {e.countryCode && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-[#00D26A]" />
              <span>{country?.flag} {country?.name ?? e.countryCode}</span>
            </div>
          )}
        </div>

        <Link
          href={`/events/${e.slug}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #0A1628 0%, #162035 100%)" }}
        >
          View Event
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
