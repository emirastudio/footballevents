import { Globe, Phone } from "lucide-react";
import {
  InstagramGlyph, FacebookGlyph, XGlyph, YoutubeGlyph, TiktokGlyph, WhatsappGlyph,
} from "./BrandIcons";

type Socials = {
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
};

export function SocialLinks({
  socials,
  website,
  size = "md",
}: {
  socials?: Socials;
  website?: string;
  size?: "sm" | "md";
}) {
  const items: { url?: string; Icon: (p: { className?: string }) => React.ReactElement; label: string }[] = [
    { url: website,             Icon: Globe as never,    label: "Website" },
    { url: socials?.instagram,  Icon: InstagramGlyph,    label: "Instagram" },
    { url: socials?.facebook,   Icon: FacebookGlyph,     label: "Facebook" },
    { url: socials?.x,          Icon: XGlyph,            label: "X" },
    { url: socials?.youtube,    Icon: YoutubeGlyph,      label: "YouTube" },
    { url: socials?.tiktok,     Icon: TiktokGlyph,       label: "TikTok" },
    { url: socials?.whatsapp,   Icon: WhatsappGlyph,     label: "WhatsApp" },
  ].filter((i) => !!i.url) as { url: string; Icon: (p: { className?: string }) => React.ReactElement; label: string }[];

  if (items.length === 0) return null;

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconDim = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`grid ${dim} place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-strong)] transition hover:-translate-y-0.5 hover:border-[var(--color-pitch-500)] hover:text-[var(--color-pitch-700)] hover:shadow-[var(--shadow-xs)]`}
        >
          <Icon className={iconDim} />
        </a>
      ))}
    </div>
  );
}
