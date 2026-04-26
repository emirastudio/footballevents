import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "FootballEvents.eu <noreply@footballevents.eu>";

const resend = apiKey ? new Resend(apiKey) : null;

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendArgs) {
  if (!resend) {
    // Dev / pre-prod: log to console instead of throwing.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[email:dev] would send", { to, subject, replyTo, length: html.length });
    }
    return { ok: false as const, skipped: true as const };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, replyTo });
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
