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

// ──────────────────────────────────────────────
// Localised application/booking emails
// Each recipient gets the email in *their* language:
//  · applicant emails → the locale the applicant used on the site
//  · organizer emails → the organizer's preferredLocale
// Self-contained dictionaries (no request context) so they also work in crons.
// ──────────────────────────────────────────────

type EmailLocale = "en" | "ru" | "de" | "es";
function loc(x?: string | null): EmailLocale {
  return x === "ru" || x === "de" || x === "es" ? x : "en";
}

function btn(url: string, label: string, primary = false) {
  const bg = primary ? "#00d26a" : "#0a1628";
  const fg = primary ? "#0a1628" : "#ffffff";
  return `<p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:${bg};color:${fg};padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${escape(label)}</a></p>`;
}
function noteBlock(label: string, text: string, color = "#00d26a") {
  return `<p style="background:#fafbfc;border-left:4px solid ${color};padding:12px;border-radius:4px"><strong>${escape(label)}:</strong> ${escape(text)}</p>`;
}

/** 📋 New application landed — to the ORGANIZER, in the organizer's language. */
export function newApplicationEmail(opts: {
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  applicantName: string;
  applicantEmail: string;
  comment?: string | null;
  eventId?: string;
  locale?: string;
}) {
  const L = loc(opts.locale);
  const T = {
    en: { subj: `New application: ${opts.eventTitle}`, title: "New application 📋", hi: `Hi ${escape(opts.organizerName)},`,
      line: `<strong>${escape(opts.applicantName)}</strong> applied to <strong>${escape(opts.eventTitle)}</strong>.`,
      btn: "Review application", hint: "Tip: accept or decline applications so candidates always know where they stand." },
    ru: { subj: `Новая заявка: ${opts.eventTitle}`, title: "Новая заявка 📋", hi: `Здравствуйте, ${escape(opts.organizerName)}!`,
      line: `<strong>${escape(opts.applicantName)}</strong> подал(а) заявку на <strong>${escape(opts.eventTitle)}</strong>.`,
      btn: "Посмотреть заявку", hint: "Совет: принимайте или отклоняйте заявки, чтобы кандидаты всегда знали статус." },
    de: { subj: `Neue Bewerbung: ${opts.eventTitle}`, title: "Neue Bewerbung 📋", hi: `Hallo ${escape(opts.organizerName)},`,
      line: `<strong>${escape(opts.applicantName)}</strong> hat sich für <strong>${escape(opts.eventTitle)}</strong> beworben.`,
      btn: "Bewerbung ansehen", hint: "Tipp: Nimm Bewerbungen an oder lehne sie ab, damit Kandidaten Bescheid wissen." },
    es: { subj: `Nueva solicitud: ${opts.eventTitle}`, title: "Nueva solicitud 📋", hi: `Hola ${escape(opts.organizerName)},`,
      line: `<strong>${escape(opts.applicantName)}</strong> se ha inscrito en <strong>${escape(opts.eventTitle)}</strong>.`,
      btn: "Ver solicitud", hint: "Consejo: acepta o rechaza las solicitudes para que los candidatos sepan su estado." },
  }[L];
  const html = shell(
    T.title,
    `<p>${T.hi}</p>
     <p>${T.line}</p>
     ${opts.comment ? `<p style="background:#fafbfc;border-left:4px solid #00d26a;padding:12px;border-radius:4px"><em>${escape(opts.comment)}</em></p>` : ""}
     ${btn(`${SITE}/${L}/organizer/bookings`, T.btn)}
     <p style="font-size:12px;color:#64748b">${T.hint}</p>`,
  );
  return sendEmail({ to: opts.organizerEmail, subject: T.subj, html, replyTo: opts.applicantEmail });
}

/** ✅ Application received — to the APPLICANT, in the applicant's language. */
export function applicationReceivedEmail(opts: {
  applicantEmail: string;
  applicantName: string;
  eventTitle: string;
  eventSlug: string;
  organizerName?: string;
  locale?: string;
}) {
  const L = loc(opts.locale);
  const T = {
    en: { subj: `Application received: ${opts.eventTitle}`, title: "Application received ✅", hi: `Hi ${escape(opts.applicantName)},`,
      p1: `Thanks for applying to <strong>${escape(opts.eventTitle)}</strong>! Your application has been sent to the organizer and you're now on the candidate list.`,
      p2: "We'll email you as soon as the organizer reviews your application — no action is needed from you right now.", btn: "View event" },
    ru: { subj: `Заявка получена: ${opts.eventTitle}`, title: "Заявка получена ✅", hi: `Здравствуйте, ${escape(opts.applicantName)}!`,
      p1: `Спасибо за заявку на <strong>${escape(opts.eventTitle)}</strong>! Ваша заявка отправлена организатору, и теперь вы в списке кандидатов на участие.`,
      p2: "Мы напишем вам, как только организатор рассмотрит заявку. Сейчас от вас ничего не требуется.", btn: "Открыть событие" },
    de: { subj: `Bewerbung erhalten: ${opts.eventTitle}`, title: "Bewerbung erhalten ✅", hi: `Hallo ${escape(opts.applicantName)},`,
      p1: `Danke für deine Bewerbung zu <strong>${escape(opts.eventTitle)}</strong>! Sie wurde an den Veranstalter gesendet und du stehst jetzt auf der Kandidatenliste.`,
      p2: "Wir benachrichtigen dich per E-Mail, sobald der Veranstalter deine Bewerbung geprüft hat. Du musst gerade nichts tun.", btn: "Event ansehen" },
    es: { subj: `Solicitud recibida: ${opts.eventTitle}`, title: "Solicitud recibida ✅", hi: `Hola ${escape(opts.applicantName)},`,
      p1: `¡Gracias por inscribirte en <strong>${escape(opts.eventTitle)}</strong>! Tu solicitud se ha enviado al organizador y ahora estás en la lista de candidatos.`,
      p2: "Te escribiremos en cuanto el organizador revise tu solicitud. Por ahora no tienes que hacer nada.", btn: "Ver evento" },
  }[L];
  const html = shell(T.title, `<p>${T.hi}</p><p>${T.p1}</p><p>${T.p2}</p>${btn(`${SITE}/${L}/events/${opts.eventSlug}`, T.btn, true)}`);
  return sendEmail({ to: opts.applicantEmail, subject: T.subj, html });
}

/** 🎉 Organizer accepted/declined — to the APPLICANT, in the applicant's language. */
export function bookingResponseEmail(opts: {
  applicantEmail: string;
  applicantName: string;
  eventTitle: string;
  eventSlug: string;
  decision: "accept" | "decline";
  organizerName: string;
  organizerEmail: string;
  note?: string | null;
  locale?: string;
}) {
  const L = loc(opts.locale);
  const accepted = opts.decision === "accept";
  const ev = `<strong>${escape(opts.eventTitle)}</strong>`;
  const org = `<strong>${escape(opts.organizerName)}</strong>`;
  const T = {
    en: {
      subj: accepted ? `You're in! ${opts.eventTitle}` : `Update on your application: ${opts.eventTitle}`,
      title: accepted ? "You're in! 🎉" : "Application update",
      body: accepted ? `Great news — ${org} accepted your application to ${ev}. Welcome aboard, ${escape(opts.applicantName)}!`
                     : `Hi ${escape(opts.applicantName)}, unfortunately ${org} couldn't accept your application to ${ev} this time.`,
      note: "Note from the organizer", btn: accepted ? "View event" : "Find other events" },
    ru: {
      subj: accepted ? `Вас приняли! ${opts.eventTitle}` : `Статус вашей заявки: ${opts.eventTitle}`,
      title: accepted ? "Вас приняли! 🎉" : "Обновление по заявке",
      body: accepted ? `Отличные новости — ${org} принял(а) вашу заявку на ${ev}. Добро пожаловать, ${escape(opts.applicantName)}!`
                     : `Здравствуйте, ${escape(opts.applicantName)}. К сожалению, ${org} не смог(ла) принять вашу заявку на ${ev} в этот раз.`,
      note: "Сообщение от организатора", btn: accepted ? "Открыть событие" : "Найти другие события" },
    de: {
      subj: accepted ? `Du bist dabei! ${opts.eventTitle}` : `Update zu deiner Bewerbung: ${opts.eventTitle}`,
      title: accepted ? "Du bist dabei! 🎉" : "Bewerbungs-Update",
      body: accepted ? `Gute Nachrichten — ${org} hat deine Bewerbung zu ${ev} angenommen. Willkommen, ${escape(opts.applicantName)}!`
                     : `Hallo ${escape(opts.applicantName)}, leider konnte ${org} deine Bewerbung zu ${ev} diesmal nicht annehmen.`,
      note: "Nachricht vom Veranstalter", btn: accepted ? "Event ansehen" : "Andere Events finden" },
    es: {
      subj: accepted ? `¡Estás dentro! ${opts.eventTitle}` : `Novedades sobre tu solicitud: ${opts.eventTitle}`,
      title: accepted ? "¡Estás dentro! 🎉" : "Actualización de solicitud",
      body: accepted ? `Buenas noticias: ${org} ha aceptado tu solicitud para ${ev}. ¡Bienvenido/a, ${escape(opts.applicantName)}!`
                     : `Hola ${escape(opts.applicantName)}, lamentablemente ${org} no ha podido aceptar tu solicitud para ${ev} esta vez.`,
      note: "Mensaje del organizador", btn: accepted ? "Ver evento" : "Buscar otros eventos" },
  }[L];
  const url = accepted ? `${SITE}/${L}/events/${opts.eventSlug}` : `${SITE}/${L}/events`;
  const html = shell(
    T.title,
    `<p>${T.body}</p>
     ${opts.note ? noteBlock(T.note, opts.note, accepted ? "#00d26a" : "#dc2626") : ""}
     ${btn(url, T.btn, accepted)}`,
  );
  return sendEmail({ to: opts.applicantEmail, subject: T.subj, html, replyTo: opts.organizerEmail });
}

/** ⏳ Application still unanswered after 3 days — to the ORGANIZER, in their language. */
export function bookingReminderEmail(opts: {
  organizerEmail: string;
  organizerName: string;
  applicantName: string;
  eventTitle: string;
  locale?: string;
}) {
  const L = loc(opts.locale);
  const ev = `<strong>${escape(opts.eventTitle)}</strong>`;
  const ap = `<strong>${escape(opts.applicantName)}</strong>`;
  const T = {
    en: { subj: `Reminder: application waiting — ${opts.eventTitle}`, title: "Application still waiting ⏳", hi: `Hi ${escape(opts.organizerName)},`,
      p1: `${ap}'s application to ${ev} has been waiting for 3 days.`, p2: "Please accept or decline it so the candidate knows where they stand.", btn: "Review application" },
    ru: { subj: `Напоминание: заявка ждёт ответа — ${opts.eventTitle}`, title: "Заявка ждёт ответа ⏳", hi: `Здравствуйте, ${escape(opts.organizerName)}!`,
      p1: `Заявка от ${ap} на ${ev} ждёт ответа уже 3 дня.`, p2: "Пожалуйста, примите или отклоните её, чтобы кандидат знал статус.", btn: "Посмотреть заявку" },
    de: { subj: `Erinnerung: Bewerbung wartet — ${opts.eventTitle}`, title: "Bewerbung wartet ⏳", hi: `Hallo ${escape(opts.organizerName)},`,
      p1: `Die Bewerbung von ${ap} zu ${ev} wartet seit 3 Tagen.`, p2: "Bitte nimm sie an oder lehne sie ab, damit der Kandidat Bescheid weiß.", btn: "Bewerbung ansehen" },
    es: { subj: `Recordatorio: solicitud pendiente — ${opts.eventTitle}`, title: "Solicitud pendiente ⏳", hi: `Hola ${escape(opts.organizerName)},`,
      p1: `La solicitud de ${ap} para ${ev} lleva 3 días esperando.`, p2: "Acéptala o recházala para que el candidato sepa su estado.", btn: "Ver solicitud" },
  }[L];
  const html = shell(T.title, `<p>${T.hi}</p><p>${T.p1}</p><p>${T.p2}</p>${btn(`${SITE}/${L}/organizer/bookings`, T.btn, true)}`);
  return sendEmail({ to: opts.organizerEmail, subject: T.subj, html });
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

export function paymentFailedEmail(opts: {
  to: string;
  organizerName: string;
  tierName: string;
  amountCents: number;
  currency: string;
  attemptCount: number;
  nextAttemptAt: Date | null;
}) {
  const amount = (opts.amountCents / 100).toFixed(2);
  const nextStr = opts.nextAttemptAt
    ? opts.nextAttemptAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const html = shell(
    `Payment failed for your ${opts.tierName} plan`,
    `<p>Hi ${escape(opts.organizerName)},</p>
     <p>We couldn't charge your card for the renewal of your <strong>${escape(opts.tierName)}</strong> plan (${escape(opts.currency.toUpperCase())} ${escape(amount)}).</p>
     ${nextStr ? `<p>Stripe will automatically retry on <strong>${escape(nextStr)}</strong>.</p>` : `<p>This was attempt #${opts.attemptCount}. After several failures the subscription will be cancelled.</p>`}
     <p>Update your card to keep your plan active:</p>
     <p style="margin:24px 0">
       <a href="${SITE}/me" style="display:inline-block;background:#00d26a;color:#0a1628;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Update payment method →</a>
     </p>
     <p style="font-size:12px;color:#64748b">Click "Manage subscription" on your profile, then "Update payment method".</p>`,
  );
  return sendEmail({
    to: opts.to,
    subject: `Payment failed — ${opts.tierName} plan on FootballEvents.eu`,
    html,
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

export function savedSearchAlertEmail(opts: {
  to: string;
  name: string;
  searchLabel: string;
  filterUrl: string; // absolute URL to /events?...
  manageUrl: string; // absolute URL to /me/alerts
  events: { title: string; city: string | null; dateRange: string; priceLine: string; coverUrl: string | null; eventUrl: string }[];
}) {
  const eventsCount = opts.events.length;
  const list = opts.events
    .map(
      (e) => `<tr>
<td style="width:96px;padding:0 12px 12px 0;vertical-align:top">
  ${e.coverUrl
    ? `<a href="${e.eventUrl}" style="display:block;width:96px;height:64px;border-radius:8px;background:#f4f7fa center/cover no-repeat url('${escape(e.coverUrl)}');"></a>`
    : `<div style="width:96px;height:64px;border-radius:8px;background:#f4f7fa;display:block"></div>`}
</td>
<td style="padding:0 0 16px 0;vertical-align:top">
  <a href="${e.eventUrl}" style="display:block;font-size:15px;font-weight:600;color:#0a1628;text-decoration:none;line-height:1.3;margin-bottom:4px">${escape(e.title)}</a>
  <div style="font-size:13px;color:#64748b;line-height:1.4">${e.city ? `${escape(e.city)} · ` : ""}${escape(e.dateRange)}</div>
  <div style="font-size:13px;color:#0a1628;font-weight:600;margin-top:4px">${escape(e.priceLine)}</div>
</td>
</tr>`,
    )
    .join("");

  const html = shell(
    `${eventsCount} new ${eventsCount === 1 ? "event matches" : "events match"} your search`,
    `<p>Hi ${escape(opts.name)},</p>
     <p style="margin-bottom:24px"><strong>${eventsCount}</strong> new ${eventsCount === 1 ? "event" : "events"} matched your saved search <em>${escape(opts.searchLabel)}</em>:</p>
     <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px">${list}</table>
     <p style="margin-top:24px"><a href="${opts.filterUrl}" style="display:inline-block;background:#00d26a;color:#0a1628;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">See all matches →</a></p>
     <p style="font-size:12px;color:#64748b;margin-top:24px">Don't want these? <a href="${opts.manageUrl}" style="color:#64748b">Pause or delete this alert</a>.</p>`,
  );
  return sendEmail({
    to: opts.to,
    subject: `${eventsCount} new ${eventsCount === 1 ? "match" : "matches"}: ${opts.searchLabel}`,
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
