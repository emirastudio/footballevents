/**
 * Telegram notification utility — fire-and-forget, never throws.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your personal chat ID (get via @userinfobot)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

/** Send a Telegram message. Silent no-op if env vars are not set. */
export async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram is non-critical — never let it break the main flow
  }
}

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

/** 🟢 New user registered */
export function tgNewUser(opts: {
  name: string;
  email: string;
  method: string;
  country?: string | null;
}) {
  return sendTelegram(
    `🟢 <b>New registration</b>\n` +
    `👤 ${esc(opts.name)} — <code>${esc(opts.email)}</code>\n` +
    `📋 Method: ${opts.method}` +
    (opts.country ? `\n🌍 Country: ${opts.country}` : "") +
    `\n🔗 <a href="${SITE()}/admin/users">Admin → Users</a>`,
  );
}

/** 📋 Event submitted for review */
export function tgEventReview(opts: {
  title: string;
  slug: string;
  organizer: string;
}) {
  return sendTelegram(
    `📋 <b>Event submitted for review</b>\n` +
    `🏆 ${esc(opts.title)}\n` +
    `🏢 ${esc(opts.organizer)}\n` +
    `🔗 <a href="${SITE()}/admin/events">Admin → Events</a>`,
  );
}

/** 🔴 Server error caught by error boundary */
export function tgServerError(opts: {
  digest?: string;
  message?: string;
  url?: string;
}) {
  return sendTelegram(
    `🔴 <b>Server error</b>\n` +
    (opts.url ? `📄 ${esc(opts.url)}\n` : "") +
    (opts.digest ? `🆔 <code>${esc(opts.digest)}</code>\n` : "") +
    (opts.message ? `💬 ${esc(opts.message.slice(0, 200))}` : ""),
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
