"use server";

import { tgServerError } from "@/lib/telegram";

/**
 * Called from client-side error boundaries (error.tsx) to report
 * page crashes to Telegram. Fire-and-forget — never throws.
 */
export async function reportErrorAction(opts: {
  digest?: string;
  message?: string;
  url?: string;
}): Promise<void> {
  try {
    await tgServerError(opts);
  } catch {
    // never propagate
  }
}
