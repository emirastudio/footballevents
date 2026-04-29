"use client";

import { useState } from "react";
import { LayoutGrid, Map, Calendar, MapPin, Sparkles } from "lucide-react";
import { EventsMap } from "@/components/map/EventsMap";
import { formatDateRange } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/lib/mock-data";

export type MapEventSummary = {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  countryCode: string;
  logoUrl?: string;
  categorySlug: string;
  isFeatured?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  tournaments:   "#00D26A",
  camps:         "#3B82F6",
  festivals:     "#F59E0B",
  masterclasses: "#8B5CF6",
  "match-tours": "#EF4444",
  showcases:     "#EC4899",
};

function MiniEventCard({ event: e, locale }: { event: MapEventSummary; locale: string }) {
  const country = getCountry(e.countryCode);
  const accentColor = CATEGORY_COLORS[e.categorySlug] ?? "#00D26A";

  return (
    <Link
      href={`/events/${e.slug}`}
      className="group relative flex gap-3 border-b border-gray-100 px-3 py-3 transition-colors hover:bg-[#f8fafc]"
    >
      {/* Category left bar */}
      <div
        className="absolute left-0 top-0 h-full w-0.5 rounded-r opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      />

      {/* Logo */}
      <div
        className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-cover bg-center shadow-sm"
        style={
          e.logoUrl
            ? { backgroundImage: `url(${e.logoUrl})` }
            : { background: `${accentColor}22` }
        }
      />

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          <p className="flex-1 truncate text-[13px] font-semibold leading-snug text-[#0A1628] group-hover:text-[#162035]">
            {e.title}
          </p>
          {e.isFeatured && (
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" style={{ color: accentColor }} />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{country?.flag} {country?.name ?? e.countryCode}</span>
        </div>
        {e.startDate && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Calendar className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{formatDateRange(e.startDate, e.endDate, locale)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

type Props = {
  children: React.ReactNode;
  locale: string;
  resultsLabel: React.ReactNode;
  events: MapEventSummary[];
};

export function EventsViewToggle({ children, locale, resultsLabel, events }: Props) {
  const [view, setView] = useState<"list" | "map">("list");

  const ViewToggle = ({ compact = false }: { compact?: boolean }) => (
    <div
      className="flex items-center gap-0.5 rounded-xl p-1"
      style={{ background: "linear-gradient(135deg, #0A1628 0%, #162035 100%)" }}
    >
      <button
        onClick={() => setView("list")}
        aria-label="List view"
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          view === "list"
            ? "bg-white text-[#0A1628] shadow-sm"
            : "text-white/60 hover:text-white"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {!compact && <span className="hidden sm:inline">List</span>}
      </button>
      <button
        onClick={() => setView("map")}
        aria-label="Map view"
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          view === "map"
            ? "bg-white text-[#0A1628] shadow-sm"
            : "text-white/60 hover:text-white"
        }`}
      >
        <Map className="h-3.5 w-3.5" />
        {!compact && <span className="hidden sm:inline">Map</span>}
      </button>
    </div>
  );

  if (view === "list") {
    return (
      <>
        <div className="mb-6 flex items-center justify-between gap-3">
          {resultsLabel}
          <ViewToggle />
        </div>
        {children}
      </>
    );
  }

  // ── Map split view ────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-xl lg:flex-row"
      style={{ height: "calc(100vh - 200px)", minHeight: 540 }}
    >
      {/* ── Left panel: event list ── */}
      <div className="flex w-full flex-col lg:w-[300px] lg:shrink-0">
        {/* Panel header — navy */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ background: "linear-gradient(135deg, #0A1628 0%, #162035 100%)" }}
        >
          <div>
            <p className="text-xs font-semibold text-white">{events.length} events</p>
            <p className="text-[10px] text-white/40">on the map</p>
          </div>
          <ViewToggle compact />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-gray-400">No events match your filters.</p>
            </div>
          ) : (
            events.map((e) => <MiniEventCard key={e.id} event={e} locale={locale} />)
          )}
        </div>
      </div>

      {/* ── Right panel: map ── */}
      <div className="relative flex-1">
        <EventsMap locale={locale} />

        {/* "Map" label watermark */}
        <div
          className="pointer-events-none absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #0A1628cc 0%, #162035cc 100%)", backdropFilter: "blur(6px)" }}
        >
          footballevents.eu
        </div>
      </div>
    </div>
  );
}
