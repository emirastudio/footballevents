/**
 * Renders HTML from the RichEditor safely.
 * Only allows the subset we generate — no inline styles, no scripts.
 */

interface RichTextProps {
  html: string;
  className?: string;
}

// Tags the editor can produce
const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "h2", "h3", "ul", "ol", "li", "blockquote", "hr"]);

function stripUnsafe(html: string): string {
  // Remove any tag not in our allowed set (keep content inside unknown tags)
  return html
    .replace(/<\/?([a-z][a-z0-9]*)[^>]*>/gi, (match, tag: string) => {
      const t = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(t)) return ""; // strip unknown tags
      // Strip all attributes from allowed tags (no onclick, style, class, etc.)
      return match.replace(/\s[^>]*/i, "");
    });
}

export function RichText({ html, className }: RichTextProps) {
  if (!html?.trim()) return null;

  const isHtml = /^\s*</.test(html);

  // For plain text (legacy), convert to structured HTML before rendering
  const rendered = isHtml ? stripUnsafe(html) : plainToHtml(html);

  const classes = [
    "rich-text leading-relaxed text-[var(--color-foreground)]",
    "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold",
    "[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold",
    "[&_p]:mb-3 [&_p:last-child]:mb-0",
    "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
    "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
    "[&_li]:mb-1",
    "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-pitch-300)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--color-muted-strong)]",
    "[&_hr]:my-4 [&_hr]:border-[var(--color-border)]",
    "[&_strong]:font-semibold [&_em]:italic",
    className,
  ].filter(Boolean).join(" ");

  return <div className={classes} dangerouslySetInnerHTML={{ __html: rendered }} />;
}

// Convert legacy plain text to clean HTML for display
function plainToHtml(raw: string): string {
  const blocks: string[] = [];
  const paragraphs = raw.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split(/\n/);
    const allBullets = lines.length > 1 && lines.every(l => /^[*\-•]\s/.test(l.trim()));

    if (allBullets) {
      const items = lines.map(l => `<li>${esc(l.replace(/^[*\-•]\s+/, "").trim())}</li>`).join("");
      blocks.push(`<ul>${items}</ul>`);
    } else if (trimmed.includes(" * ")) {
      // Inline "text * item * item" → intro paragraph + bullet list
      const parts = trimmed.split(/\s+\*\s+/);
      const intro = parts[0].trim();
      const items = parts.slice(1);
      if (intro) blocks.push(`<p>${esc(intro)}</p>`);
      if (items.length) blocks.push(`<ul>${items.map(i => `<li>${esc(i.trim())}</li>`).join("")}</ul>`);
    } else {
      blocks.push(`<p>${trimmed.replace(/\n/g, "<br>")}</p>`);
    }
  }

  return blocks.join("") || `<p>${esc(raw)}</p>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
