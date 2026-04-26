// Inline brand SVGs (lucide-react v1 dropped most brand icons).
// Sized via parent (className: h/w + currentColor for stroke/fill).

type IconProps = { className?: string };

export function InstagramGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function FacebookGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3-.04-1.2-.14-2.3-.14-2.3 0-3.9 1.4-3.9 4v2.24H8.3v3h2.5V21h2.7Z"
      />
    </svg>
  );
}

export function XGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.6 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.1 21H2l7.3-8.3L1.7 3h6.4l4.4 5.8L17.6 3Zm-1.1 16h1.7L7.6 4.9H5.8l10.7 14.1Z"
      />
    </svg>
  );
}

export function YoutubeGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.3 22 12 22 12s0-3.3-.4-4.8ZM10 15V9l5.2 3-5.2 3Z"
      />
    </svg>
  );
}

export function TiktokGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M16.5 3.2c.1 1 .5 2 1.2 2.6.7.7 1.6 1.1 2.6 1.2v3a6.4 6.4 0 0 1-3.8-1.2v6.4a5.6 5.6 0 1 1-5.6-5.6c.4 0 .8 0 1.1.1v3a2.6 2.6 0 1 0 1.5 2.5V3.2h3Z"
      />
    </svg>
  );
}

export function WhatsappGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5A9.5 9.5 0 0 0 3.7 17l-1.2 4.4 4.5-1.2A9.5 9.5 0 1 0 12 2.5Zm0 17a7.5 7.5 0 0 1-3.8-1l-.3-.2-2.7.7.7-2.6-.2-.3a7.5 7.5 0 1 1 6.3 3.4Zm4.3-5.5c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-1.7-1.1c-.6-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L9.4 8c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.3.1.2 1.6 2.4 3.8 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4 0 1.4-.6 1.6-1.1.2-.6.2-1 .2-1.1-.1-.1-.2-.2-.4-.3Z"
      />
    </svg>
  );
}

export function TelegramGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="m21.5 4.4-3 14.4c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.2c-.3.3-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2l-10.4 6.5-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.4 1Z"
      />
    </svg>
  );
}
