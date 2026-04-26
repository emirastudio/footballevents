import { Mail, Link as LinkIcon } from "lucide-react";
import { WhatsappGlyph, TelegramGlyph, XGlyph, FacebookGlyph } from "./BrandIcons";

export function ShareRow({
  url,
  title,
  label,
}: {
  url: string;
  title: string;
  label: string;
}) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const items: { href: string; Icon: (p: { className?: string }) => React.ReactElement; name: string }[] = [
    { href: `https://wa.me/?text=${t}%20${u}`,                   Icon: WhatsappGlyph,         name: "WhatsApp" },
    { href: `https://t.me/share/url?url=${u}&text=${t}`,         Icon: TelegramGlyph,         name: "Telegram" },
    { href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, Icon: XGlyph,              name: "X" },
    { href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: FacebookGlyph,         name: "Facebook" },
    { href: `mailto:?subject=${t}&body=${u}`,                    Icon: Mail as never,         name: "Email" },
    { href: url,                                                  Icon: LinkIcon as never,    name: "Open" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ href, Icon, name }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] transition hover:-translate-y-0.5 hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)]"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}
