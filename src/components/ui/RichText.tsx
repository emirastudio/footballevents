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
  const safe = isHtml ? stripUnsafe(html) : html;

  return isHtml ? (
    <div
      className={[
        // Typography styles scoped here — matches site design
        "rich-text leading-relaxed text-[var(--color-foreground)]",
        "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--color-foreground)]",
        "[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--color-foreground)]",
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-1",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-pitch-300)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--color-muted-strong)]",
        "[&_hr]:my-4 [&_hr]:border-[var(--color-border)]",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        className,
      ].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  ) : (
    <p className={["text-pretty leading-relaxed text-[var(--color-muted-strong)]", className].filter(Boolean).join(" ")}>
      {html}
    </p>
  );
}
