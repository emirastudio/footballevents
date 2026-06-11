/**
 * Telegram notification utility — fire-and-forget, never throws.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your personal chat ID (get via @userinfobot)
 *   TELEGRAM_CHANNEL_TARGETS  — comma-separated list of groups/channels to
 *                               auto-post approved events into. Each item is
 *                               "chatId" or "chatId:topicId" (topicId = numeric
 *                               forum topic). Bot must be admin in each.
 *                               e.g. "-1003477485161:39,-1003938567054"
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

type ChannelTarget = { chatId: string; threadId?: number };

const CHANNEL_TARGETS: ChannelTarget[] = (process.env.TELEGRAM_CHANNEL_TARGETS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((item) => {
    const [chatId, topic] = item.split(":");
    const threadId = topic ? Number(topic) : undefined;
    return { chatId, threadId: Number.isFinite(threadId) ? threadId : undefined };
  });

/** Send a Telegram message to the given chat. Silent no-op if not configured. */
async function post(
  chatId: string | undefined,
  text: string,
  threadId?: number,
): Promise<void> {
  if (!BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram is non-critical — never let it break the main flow
  }
}

/** Send a photo with caption to the given chat. Falls back silently. */
async function postPhoto(
  chatId: string | undefined,
  photoUrl: string,
  caption: string,
  threadId?: number,
): Promise<void> {
  if (!BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // non-critical
  }
}

/** Send a Telegram message to the personal admin chat. */
export async function sendTelegram(text: string): Promise<void> {
  return post(CHAT_ID, text);
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

/** 🐛 User-submitted bug / feedback report from the floating button. */
export function tgBugReport(opts: {
  id: string;
  category: string;
  message: string;
  url: string;
  reporter: string; // "Name <email>" or "anon" or "anon <email>"
  locale: string;
  hasScreenshot: boolean;
  consoleErrorCount: number;
}) {
  const truncated = opts.message.length > 600
    ? opts.message.slice(0, 600) + "…"
    : opts.message;
  return sendTelegram(
    `🐛 <b>Bug report</b> · ${esc(opts.category)}\n` +
    `👤 ${esc(opts.reporter)} · ${esc(opts.locale)}\n` +
    `📄 <code>${esc(opts.url)}</code>\n` +
    `💬 ${esc(truncated)}\n` +
    (opts.consoleErrorCount > 0 ? `⚠️ ${opts.consoleErrorCount} console errors\n` : "") +
    (opts.hasScreenshot ? `📸 Screenshot attached\n` : "") +
    `🔗 <a href="${SITE()}/admin/bug-reports/${opts.id}">Open in admin</a>`,
  );
}

/** 🏆 Event approved & published — public post to the channel */
export function tgEventPublished(opts: {
  title: string;
  slug: string;
  city?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  shortDescription?: string | null;
  coverUrl?: string | null;
}) {
  const url = `${SITE()}/en/events/${opts.slug}`;
  const dateLine = fmtDateRange(opts.startDate, opts.endDate);
  const caption =
    `🏆 <b>${esc(opts.title)}</b>\n` +
    (opts.city ? `📍 ${esc(opts.city)}\n` : "") +
    (dateLine ? `🗓 ${dateLine}\n` : "") +
    (opts.shortDescription ? `\n${esc(opts.shortDescription.slice(0, 300))}\n` : "") +
    `\n👉 <a href="${url}">Open on footballevents.eu</a>`;

  return Promise.all(
    CHANNEL_TARGETS.map((t) =>
      opts.coverUrl
        ? postPhoto(t.chatId, opts.coverUrl!, caption, t.threadId)
        : post(t.chatId, caption, t.threadId),
    ),
  ).then(() => {});
}

/** 🔥 Registration activity — public marketing signal to the channels.
 *  Deliberately NO personal details (who / what they filled): just a "people are
 *  signing up for this event" nudge to drive traffic. */
export function tgEventActivity(opts: {
  title: string;
  slug: string;
  city?: string | null;
}) {
  const url = `${SITE()}/en/events/${opts.slug}`;
  const text =
    `🔥 <b>New activity!</b>\n` +
    `Someone just signed up for <b>${esc(opts.title)}</b>` +
    (opts.city ? ` in ${esc(opts.city)}` : "") +
    ` 🎉\n\n` +
    `👉 <a href="${url}">Join them on footballevents.eu</a>`;
  return Promise.all(CHANNEL_TARGETS.map((t) => post(t.chatId, text, t.threadId))).then(() => {});
}

function fmtDateRange(start?: Date | null, end?: Date | null): string {
  if (!start) return "";
  const f = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (end && end.getTime() !== start.getTime()) return `${f(start)} — ${f(end)}`;
  return f(start);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
