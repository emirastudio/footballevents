import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "FootballEvents.eu <support@footballevents.eu>";
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@footballevents.eu";

const resend = apiKey ? new Resend(apiKey) : null;

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export async function sendEmail({ to, subject, html, text, replyTo, headers }: SendArgs) {
  const finalReplyTo = replyTo ?? DEFAULT_REPLY_TO;
  // List-Unsubscribe is the single biggest deliverability signal for Gmail/iCloud
  // outside of DKIM/SPF/DMARC — even on transactional mail.
  const listUnsubUrl = `${SITE}/api/unsubscribe?email=${encodeURIComponent(Array.isArray(to) ? to[0] : to)}`;
  const baseHeaders: Record<string, string> = {
    "List-Unsubscribe": `<${listUnsubUrl}>, <mailto:${DEFAULT_REPLY_TO}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
  const finalHeaders = { ...baseHeaders, ...(headers ?? {}) };
  const finalText = text ?? htmlToText(html);

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[email:dev] would send", { to, subject, replyTo: finalReplyTo, length: html.length });
    }
    return { ok: false as const, skipped: true as const };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text: finalText,
      replyTo: finalReplyTo,
      headers: finalHeaders,
    });
    if (error) {
      console.error("[email] send failed", error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (e) {
    console.error("[email] threw", e);
    return { ok: false as const, error: String(e) };
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/h\d>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

function shell(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a1628;">
<div style="max-width:560px;margin:32px auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e9f0">
  <h1 style="font-size:20px;margin:0 0 16px">⚽ ${escape(title)}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #e5e9f0;margin:24px 0">
  <p style="font-size:12px;color:#64748b;margin:0">FootballEvents.eu · <a href="${SITE}" style="color:#00b85b;text-decoration:none">${SITE.replace(/^https?:\/\//, "")}</a></p>
</div></body></html>`;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ──────────────────────────────────────────────
// Templates
// ──────────────────────────────────────────────

export function magicLinkEmail(opts: { to: string; url: string; expiresMinutes: number }) {
  const safeUrl = escape(opts.url);
  const html = shell(
    "Your sign-in link",
    `<p>Click the button below to sign in to FootballEvents.eu. This link expires in <strong>${opts.expiresMinutes} minutes</strong> and can only be used once.</p>
     <p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;background:#00d26a;color:#0a1628;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Sign in</a></p>
     <p style="font-size:12px;color:#64748b">If the button doesn't work, paste this URL into your browser:<br><span style="word-break:break-all">${safeUrl}</span></p>
     <p style="font-size:12px;color:#64748b">If you didn't request this email, you can safely ignore it — no account changes were made.</p>`,
  );
  const text = [
    `Sign in to FootballEvents.eu`,
    ``,
    `Open this link to finish signing in (expires in ${opts.expiresMinutes} minutes, one-time use):`,
    opts.url,
    ``,
    `If you didn't request this email, you can safely ignore it.`,
  ].join("\n");
  return sendEmail({ to: opts.to, subject: "Sign in to FootballEvents.eu", html, text });
}

export function emailChangeVerifyEmail(opts: { to: string; url: string; expiresMinutes: number }) {
  const safeUrl = escape(opts.url);
  const html = shell(
    "Confirm your new email",
    `<p>Click the button below to confirm this address as your new sign-in email for FootballEvents.eu. This link expires in <strong>${opts.expiresMinutes} minutes</strong>.</p>
     <p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;background:#00d26a;color:#0a1628;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Confirm new email</a></p>
     <p style="font-size:12px;color:#64748b">If you didn't request this change, ignore this email — your account is safe and the change will not happen.</p>`,
  );
  const text = [
    `Confirm your new email for FootballEvents.eu`,
    ``,
    `Open this link within ${opts.expiresMinutes} minutes:`,
    opts.url,
    ``,
    `If you didn't request this, ignore this email.`,
  ].join("\n");
  return sendEmail({ to: opts.to, subject: "Confirm your new email", html, text });
}

export function welcomeEmail(opts: { to: string; name: string }) {
  const html = shell(
    "Welcome to FootballEvents.eu",
    `<p>Hi ${escape(opts.name)},</p>
     <p>You're in. Browse the catalog, save events you like and follow organizers to get updates.</p>
     <p><a href="${SITE}/events" style="display:inline-block;background:#00d26a;color:#0a1628;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Browse events</a></p>`,
  );
  return sendEmail({ to: opts.to, subject: "Welcome to FootballEvents.eu", html });
}

export function newApplicationEmail(opts: {
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  applicantName: string;
  applicantEmail: string;
  comment?: string | null;
  eventId: string;
}) {
  const html = shell(
    `New application: ${opts.eventTitle}`,
    `<p>Hi ${escape(opts.organizerName)},</p>
     <p><strong>${escape(opts.applicantName)}</strong> applied to <strong>${escape(opts.eventTitle)}</strong>.</p>
     ${opts.comment ? `<p style="background:#fafbfc;border-left:4px solid #00d26a;padding:12px;border-radius:4px"><em>${escape(opts.comment)}</em></p>` : ""}
     <p><a href="${SITE}/organizer/bookings" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Review application</a></p>`,
  );
  return sendEmail({
    to: opts.organizerEmail,
    subject: `New application: ${opts.eventTitle}`,
    html,
    replyTo: opts.applicantEmail,
  });
}

export function bookingResponseEmail(opts: {
  applicantEmail: string;
  applicantName: string;
  eventTitle: string;
  eventSlug: string;
  decision: "accept" | "decline";
  organizerName: string;
  organizerEmail: string;
  note?: string | null;
}) {
  const accepted = opts.decision === "accept";
  const html = shell(
    accepted ? `Application accepted: ${opts.eventTitle}` : `Application declined: ${opts.eventTitle}`,
    `<p>Hi ${escape(opts.applicantName)},</p>
     <p><strong>${escape(opts.organizerName)}</strong> ${accepted ? "accepted" : "declined"} your application to <strong>${escape(opts.eventTitle)}</strong>.</p>
     ${opts.note ? `<p style="background:#fafbfc;border-left:4px solid #00d26a;padding:12px;border-radius:4px">${escape(opts.note)}</p>` : ""}
     <p><a href="${SITE}/events/${opts.eventSlug}" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View event</a></p>`,
  );
  return sendEmail({
    to: opts.applicantEmail,
    subject: accepted ? `Accepted: ${opts.eventTitle}` : `Declined: ${opts.eventTitle}`,
    html,
    replyTo: opts.organizerEmail,
  });
}

export function newMessageNotification(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  eventTitle: string;
  threadUrl: string;
  bodyPreview: string;
}) {
  const html = shell(
    `New message from ${opts.senderName}`,
    `<p>Hi ${escape(opts.recipientName)},</p>
     <p><strong>${escape(opts.senderName)}</strong> sent you a message about <strong>${escape(opts.eventTitle)}</strong>.</p>
     <p style="background:#fafbfc;border-left:4px solid #00d26a;padding:12px;border-radius:4px;white-space:pre-wrap">${escape(opts.bodyPreview)}</p>
     <p><a href="${opts.threadUrl}" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reply on FootballEvents.eu</a></p>`,
  );
  return sendEmail({
    to: opts.recipientEmail,
    subject: `New message from ${opts.senderName} on ${opts.eventTitle}`,
    html,
  });
}

export function subscriptionExpiringEmail(opts: {
  to: string;
  organizerName: string;
  tierName: string;
  expiresAt: Date;
  daysLeft: number;
}) {
  const dateStr = opts.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const html = shell(
    `Your ${opts.tierName} plan expires in ${opts.daysLeft} days`,
    `<p>Hi ${escape(opts.organizerName)},</p>
     <p>Your <strong>${escape(opts.tierName)}</strong> plan on FootballEvents.eu expires on <strong>${escape(dateStr)}</strong>.</p>
     <p>After that, your account switches to the <strong>Free</strong> plan. Your events, applications and data stay safe — but Premium features (Featured placement, video embeds, extra boosts) will be paused.</p>
     <p style="margin:24px 0">
       <a href="${SITE}/pricing" style="display:inline-block;background:#00d26a;color:#0a1628;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Renew or upgrade →</a>
     </p>
     <p style="font-size:12px;color:#64748b">Questions? Reply to this email — we read everything.</p>`,
  );
  const text = [
    `Your ${opts.tierName} plan expires in ${opts.daysLeft} days`,
    ``,
    `Hi ${opts.organizerName},`,
    ``,
    `Your ${opts.tierName} plan expires on ${dateStr}. After that your account moves to Free.`,
    `Your events and data are safe, but Premium features will be paused.`,
    ``,
    `Renew or upgrade: ${SITE}/pricing`,
  ].join("\n");
  return sendEmail({
    to: opts.to,
    subject: `Your ${opts.tierName} plan expires in ${opts.daysLeft} days — FootballEvents.eu`,
    html,
    text,
  });
}

export function reviewRequestEmail(opts: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventSlug: string;
  locale: string;
}) {
  const url = `${SITE}/${opts.locale}/events/${opts.eventSlug}/review`;
  const html = shell(
    `How was ${opts.eventTitle}?`,
    `<p>Hi ${escape(opts.participantName)},</p>
     <p>Thanks for joining <strong>${escape(opts.eventTitle)}</strong>! Your honest review helps the next participants and rewards good organizers.</p>
     <p style="margin:24px 0">
       <a href="${url}" style="display:inline-block;background:#00d26a;color:#0a1628;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Write a review (60 sec)</a>
     </p>
     <p style="font-size:12px;color:#64748b">If you didn't attend, you can ignore this email.</p>`,
  );
  return sendEmail({
    to: opts.to,
    subject: `How was ${opts.eventTitle}?`,
    html,
  });
}

export function newReviewNotificationEmail(opts: {
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  rating: number;
  bodyPreview: string;
}) {
  const stars = "★".repeat(opts.rating) + "☆".repeat(5 - opts.rating);
  const html = shell(
    `New review on ${opts.eventTitle}`,
    `<p>Hi ${escape(opts.organizerName)},</p>
     <p>You received a new review on <strong>${escape(opts.eventTitle)}</strong>:</p>
     <p style="font-size:22px;color:#f59e0b;letter-spacing:2px;margin:8px 0">${stars} <span style="font-size:14px;color:#64748b">${opts.rating}/5</span></p>
     <p style="background:#fafbfc;border-left:4px solid #00d26a;padding:12px;border-radius:4px;white-space:pre-wrap">${escape(opts.bodyPreview)}${opts.bodyPreview.length >= 200 ? "…" : ""}</p>
     <p>It's pending moderation — open your cabinet to approve, reply or escalate.</p>
     <p style="margin:24px 0"><a href="${SITE}/organizer/reviews" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Moderate review</a></p>
     <p style="font-size:12px;color:#64748b">Reviews you don't moderate within 72 hours auto-publish.</p>`,
  );
  return sendEmail({
    to: opts.organizerEmail,
    subject: `New ${opts.rating}-star review on ${opts.eventTitle}`,
    html,
  });
}

export function reviewModerationEmail(opts: {
  to: string;
  authorName: string;
  eventTitle: string;
  eventSlug: string;
  decision: "approve" | "reject";
  reason?: string | null;
}) {
  const approved = opts.decision === "approve";
  const html = shell(
    approved ? `Your review is live` : `Your review wasn't published`,
    `<p>Hi ${escape(opts.authorName)},</p>
     <p>${approved
       ? `Your review on <strong>${escape(opts.eventTitle)}</strong> is now live for other participants to see.`
       : `Your review on <strong>${escape(opts.eventTitle)}</strong> wasn't published by the organizer.`}</p>
     ${opts.reason ? `<p style="background:#fafbfc;border-left:4px solid #dc2626;padding:12px;border-radius:4px"><strong>Reason:</strong> ${escape(opts.reason)}</p>` : ""}
     <p><a href="${SITE}/events/${opts.eventSlug}" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View event</a></p>
     ${approved ? "" : `<p style="font-size:12px;color:#64748b">If you believe this was a mistake, reply to this email and we'll review it.</p>`}`,
  );
  return sendEmail({
    to: opts.to,
    subject: approved ? `Your review is live` : `Your review wasn't published`,
    html,
  });
}

export function eventModerationEmail(opts: {
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  eventSlug: string;
  decision: "approve" | "reject";
  reason?: string | null;
}) {
  const approved = opts.decision === "approve";
  const html = shell(
    approved ? `Event approved: ${opts.eventTitle}` : `Event needs changes: ${opts.eventTitle}`,
    `<p>Hi ${escape(opts.organizerName)},</p>
     <p>Your event <strong>${escape(opts.eventTitle)}</strong> ${approved ? "is now live in the catalog." : "was returned for revisions."}</p>
     ${opts.reason ? `<p style="background:#fafbfc;border-left:4px solid #dc2626;padding:12px;border-radius:4px"><strong>Reviewer's note:</strong> ${escape(opts.reason)}</p>` : ""}
     <p><a href="${approved ? `${SITE}/events/${opts.eventSlug}` : `${SITE}/organizer/events`}" style="display:inline-block;background:#0a1628;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${approved ? "View public page" : "Edit event"}</a></p>`,
  );
  return sendEmail({
    to: opts.organizerEmail,
    subject: approved ? `Approved: ${opts.eventTitle}` : `Revisions requested: ${opts.eventTitle}`,
    html,
  });
}
