"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tgBugReport } from "@/lib/telegram";

export type BugReportState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | null;

const submitSchema = z.object({
  category: z.enum(["BUG", "TRANSLATION", "WRONG_INFO", "FORM", "OTHER"]),
  message: z.string().trim().min(5, "Tell us a bit more").max(4000),
  url: z.string().max(1000).optional(),
  email: z.string().email().optional().or(z.literal("")),
  locale: z.string().min(2).max(8),
  // Console errors are sent as a JSON-stringified array; parse defensively.
  consoleErrors: z.string().max(20_000).optional(),
  sentryEventId: z.string().max(64).optional(),
  // Honeypot — real users don't fill this hidden field.
  website: z.string().max(0).optional(),
  startedAt: z.coerce.number().int().optional(),
});

/** Hard cap on the screenshot payload to keep one report from blowing up the
 *  table. ~400 KB of base64 ≈ ~300 KB of actual image, which is enough for a
 *  JPEG-compressed viewport at 0.7 quality. */
const SCREENSHOT_MAX_BYTES = 400_000;

const SCREENSHOT_FIELD = "screenshot";

const REPORTS_PER_HOUR_PER_IP = 10;

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export async function submitBugReportAction(
  _prev: BugReportState,
  formData: FormData,
): Promise<BugReportState> {
  const parsed = submitSchema.safeParse({
    category: formData.get("category"),
    message: formData.get("message"),
    url: formData.get("url") ?? "",
    email: formData.get("email") ?? "",
    locale: formData.get("locale") ?? "en",
    consoleErrors: formData.get("consoleErrors") ?? undefined,
    sentryEventId: formData.get("sentryEventId") ?? undefined,
    website: formData.get("website") ?? undefined,
    startedAt: formData.get("startedAt") ?? undefined,
  });
  if (!parsed.success) {
    // Honeypot trip — return generic so bots don't learn.
    if (parsed.error.issues.some((i) => i.path.join(".") === "website")) {
      return { ok: false, error: "Could not submit. Please try again." };
    }
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { category, message, url, email, locale, sentryEventId } = parsed.data;
  const startedAt = parsed.data.startedAt;

  // Timing check — humans take >= 2s to type a meaningful report. Bots fire
  // instantly.
  if (startedAt && Date.now() - startedAt < 2_000) {
    return { ok: false, error: "Please take a moment to describe the issue." };
  }

  // Rate limit per IP/hour so a runaway client can't spam the table.
  const ip = await getClientIp();
  if (ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await db.bugReport.count({
      where: {
        createdAt: { gte: oneHourAgo },
        OR: [{ userAgent: { contains: ip } }, { reporterEmail: email || undefined }],
      },
    });
    if (recent >= REPORTS_PER_HOUR_PER_IP) {
      return { ok: false, error: "Too many reports. Try again later." };
    }
  }

  // Parse console buffer defensively — malformed JSON shouldn't reject the report.
  let consoleErrors: unknown = null;
  if (parsed.data.consoleErrors) {
    try {
      const arr = JSON.parse(parsed.data.consoleErrors);
      if (Array.isArray(arr)) consoleErrors = arr.slice(0, 20);
    } catch {
      /* leave null */
    }
  }

  // Screenshot: enforce the size cap. We store the data URL verbatim so the
  // admin viewer can `<img src={screenshotData} />` without an extra fetch.
  const screenshotRaw = formData.get(SCREENSHOT_FIELD);
  let screenshotData: string | null = null;
  if (typeof screenshotRaw === "string" && screenshotRaw.startsWith("data:image/")) {
    if (screenshotRaw.length <= SCREENSHOT_MAX_BYTES) {
      screenshotData = screenshotRaw;
    }
    // Silently drop oversized screenshots — the report still files without it.
  }

  const h = await headers();
  const userAgent = h.get("user-agent")?.slice(0, 500) ?? null;
  // Reporter ip lands in userAgent for the rate-limit query above so we don't
  // need a dedicated column. Append, not replace.
  const userAgentWithIp = ip ? `${userAgent ?? "—"} (ip:${ip})` : userAgent;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const report = await db.bugReport.create({
    data: {
      userId,
      reporterEmail: email || null,
      category,
      message,
      url: url || "(unknown)",
      locale,
      userAgent: userAgentWithIp,
      consoleErrors: consoleErrors as never,
      sentryEventId: sentryEventId || null,
      screenshotData,
    },
    select: { id: true },
  });

  // Telegram notification — fire-and-forget, never block the response.
  void tgBugReport({
    id: report.id,
    category,
    message,
    url: url || "(unknown)",
    reporter:
      session?.user?.name || session?.user?.email
        ? `${session.user.name ?? "—"} <${session.user.email ?? "no-email"}>`
        : email
          ? `anon <${email}>`
          : "anon",
    locale,
    hasScreenshot: !!screenshotData,
    consoleErrorCount: Array.isArray(consoleErrors) ? (consoleErrors as unknown[]).length : 0,
  });

  return { ok: true, id: report.id };
}
