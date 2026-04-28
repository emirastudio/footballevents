"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import type { MockEvent } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Star, MapPin, Calendar } from "lucide-react";
import { formatDateRange } from "@/lib/format";

type Props = {
  events: MockEvent[];
  locale: string;
  labels: {
    badge: string;       // "Premium"
    cta: string;         // "View event"
    prev: string;        // "Previous"
    next: string;        // "Next"
  };
};

const ROTATE_MS = 6000;

export function PremiumHero({ events, locale, labels }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-rotate every ROTATE_MS unless the user is hovering or there's only one slide.
  useEffect(() => {
    if (events.length < 2 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % events.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [events.length, paused]);

  if (events.length === 0) return null;
  const e = events[idx];

  return (
    <section
      className="relative overflow-hidden border-y border-[var(--color-premium)]/30 bg-[var(--color-pitch-900)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cover background — crossfade by stacking absolutely with key */}
      <div
        key={e.id}
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={e.coverUrl ? { backgroundImage: `url(${e.coverUrl})` } : undefined}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-pitch-900)]/95 via-[var(--color-pitch-900)]/70 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-pitch-900)]/60 to-transparent" aria-hidden />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl text-white">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-premium)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
            <Star className="h-3.5 w-3.5 fill-current" /> {labels.badge}
          </span>
          <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {e.title}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            {e.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[var(--color-pitch-300)]" /> {e.city}
              </span>
            )}
            {e.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[var(--color-pitch-300)]" />
                {formatDateRange(e.startDate, e.endDate, locale)}
              </span>
            )}
          </div>
          <div className="mt-6">
            <Button asChild size="lg" variant="accent">
              <Link href={`/events/${e.slug}`}>{labels.cta}</Link>
            </Button>
          </div>
        </div>

        {/* Controls — only render if more than one slide */}
        {events.length > 1 && (
          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              type="button"
              aria-label={labels.prev}
              onClick={() => setIdx((i) => (i - 1 + events.length) % events.length)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {events.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-[var(--color-premium)]" : "w-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label={labels.next}
              onClick={() => setIdx((i) => (i + 1) % events.length)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
