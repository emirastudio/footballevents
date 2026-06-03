import { db } from "@/lib/db";
import { translateBatch } from "@/lib/translate";

// Locales we auto-fill from the EN base. EN is the canonical source.
const TARGETS = ["ru", "de", "es"] as const;

/**
 * Fill missing event locales by machine-translating the EN translation.
 * - Skips locales the organizer filled manually (auto=false) — never overwrites.
 * - Refreshes locales previously auto-filled (auto=true).
 * Fire-and-forget; never throws. No-op without OPENAI_API_KEY.
 */
export async function autoTranslateEvent(eventId: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;
  try {
    const ev = await db.event.findUnique({
      where: { id: eventId },
      include: { translations: true },
    });
    const en = ev?.translations.find((t) => t.locale === "en");
    if (!en) return;

    for (const loc of TARGETS) {
      const existing = ev!.translations.find((t) => t.locale === loc);
      if (existing && !existing.auto) continue; // organizer-provided — leave it

      const [title, shortDescription, description] = await translateBatch(
        [en.title, en.shortDescription ?? "", en.description ?? ""],
        loc,
        "en",
      );
      // If translation produced nothing usable, skip (don't store empty).
      if (!title) continue;

      await db.eventTranslation.upsert({
        where: { eventId_locale: { eventId, locale: loc } },
        create: {
          eventId, locale: loc, title,
          shortDescription: shortDescription || null,
          description: description || en.description,
          auto: true,
        },
        update: {
          title,
          shortDescription: shortDescription || null,
          description: description || en.description,
          auto: true,
        },
      });
    }
  } catch (e) {
    console.error("[autoTranslateEvent]", (e as Error).message);
  }
}
