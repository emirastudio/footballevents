import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { BrandMark } from "@/components/brand/BrandMark";
import { BrandLockup } from "@/components/brand/BrandLockup";

export const metadata: Metadata = {
  title: "Brand — FootballEvents",
  description: "Mini brand book: logo lockups, color palette, typography, usage rules.",
  robots: { index: false, follow: false },
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-white pb-24">
      {/* HERO */}
      <section className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,#F4F6FA_0%,#FFFFFF_100%)]">
        <Container>
          <div className="grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-strong)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pitch-500)]" />
                Brand Book v1
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-[64px] font-extrabold leading-[0.95] tracking-[-0.03em] text-[var(--color-foreground)]">
                FootballEvents
                <br />
                <span className="text-[var(--color-pitch-600)]">Brand Guidelines</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted-strong)]">
                Минимальный, но достаточный гайд: лого-локапы, цветовая
                палитра, типографика и базовые правила использования.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/brand.svg"
                  download
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-foreground)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  ↓ Download SVG mark
                </a>
                <a
                  href="#palette"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
                >
                  Цветовая палитра
                </a>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-10 shadow-[var(--shadow-lg)]">
                <BrandMark tone="color" size={260} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* LOCKUPS */}
      <Section title="01 / Lockups" subtitle="Версии логотипа для разных контекстов.">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card label="Horizontal" desc="Основная версия. Шапки сайта, письма, документы.">
            <BrandLockup variant="horizontal" tone="color" />
          </Card>
          <Card label="Vertical" desc="Презентации, центрированные блоки, баннеры.">
            <BrandLockup variant="vertical" tone="color" />
          </Card>
          <Card label="Square / App Icon" desc="Соцсети, фавикон, иконка приложения.">
            <div className="flex items-center justify-center rounded-[28px] bg-[var(--color-foreground)] p-10">
              <BrandMark tone="color" size={140} />
            </div>
          </Card>
          <Card label="Monogram FE" desc="Минимальное место, watermark, бэйдж.">
            <BrandLockup variant="monogram" tone="color" />
          </Card>
        </div>
      </Section>

      {/* COLOR VARIANTS */}
      <Section
        title="02 / Color variants"
        subtitle="Шесть утверждённых форм. Не миксовать с другими цветами."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Swatch label="Full color · light" bg="#FFFFFF" border>
            <BrandLockup variant="horizontal" tone="color" showTagline={false} />
          </Swatch>
          <Swatch label="Full color · dark" bg="#0F1E36">
            <BrandLockup variant="horizontal" tone="color" showTagline={false} />
          </Swatch>
          <Swatch label="Mono · navy" bg="#FFFFFF" border>
            <BrandLockup variant="horizontal" tone="navy" showTagline={false} />
          </Swatch>
          <Swatch label="Mono · green" bg="#FFFFFF" border>
            <BrandLockup variant="horizontal" tone="green" showTagline={false} />
          </Swatch>
          <Swatch label="Reversed · white" bg="#16284B">
            <BrandLockup variant="horizontal" tone="white" showTagline={false} />
          </Swatch>
          <Swatch label="1-bit · black" bg="#F4F6FA" border>
            <BrandLockup variant="horizontal" tone="black" showTagline={false} />
          </Swatch>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <SmallSwatch label="Outline · navy" bg="#FFFFFF" border textColor="#16284B">
            <BrandMark tone="outline" size={88} />
          </SmallSwatch>
          <SmallSwatch label="Outline · green" bg="#FFFFFF" border textColor="#0EA865">
            <BrandMark tone="outline" size={88} />
          </SmallSwatch>
          <SmallSwatch label="Outline · white on navy" bg="#16284B" textColor="#FFFFFF">
            <BrandMark tone="outline" size={88} />
          </SmallSwatch>
        </div>
      </Section>

      {/* PALETTE */}
      <Section
        id="palette"
        title="03 / Color palette"
        subtitle="Stadium Night — навигационный синий, пич-зелёный акцент, золото для премиума."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ColorChip name="Pitch Green" hex="#0EA865" textOn="#FFFFFF" role="Primary brand" />
          <ColorChip name="Pitch Deep" hex="#0A8A52" textOn="#FFFFFF" role="Brand · pressed" />
          <ColorChip name="Stadium Navy" hex="#16284B" textOn="#FFFFFF" role="Foreground · titles" />
          <ColorChip name="Night Deep" hex="#0F1E36" textOn="#FFFFFF" role="Dark surface · OG" />
          <ColorChip name="Premium Gold" hex="#D4AF37" textOn="#1A2540" role="Premium · badges" />
          <ColorChip name="Surface Muted" hex="#F4F6FA" textOn="#1A2540" role="Section bg" />
          <ColorChip name="Border" hex="#E5E9F0" textOn="#1A2540" role="Dividers" />
          <ColorChip name="White" hex="#FFFFFF" textOn="#1A2540" role="Surface" />
        </div>

        <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            Pin gradient
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Линейный градиент сверху вниз — даёт объём капле.
          </p>
          <div
            className="mt-4 h-16 w-full rounded-[var(--radius-lg)]"
            style={{
              background:
                "linear-gradient(180deg,#14C079 0%,#0EA865 55%,#0A8A52 100%)",
            }}
          />
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <Stop hex="#14C079" label="0%" />
            <Stop hex="#0EA865" label="55%" />
            <Stop hex="#0A8A52" label="100%" />
          </div>
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section
        title="04 / Typography"
        subtitle="Manrope для заголовков и wordmark, Inter для текста."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <TypeCard
            family="Manrope"
            role="Display · Headings · Wordmark"
            weights="ExtraBold 800 · Bold 700 · SemiBold 600"
            sample="FootballEvents"
            fontVar="var(--font-display)"
            heavy
          />
          <TypeCard
            family="Inter"
            role="UI · Body · Captions"
            weights="Regular 400 · Medium 500 · SemiBold 600"
            sample="Find your next match"
            fontVar="var(--font-sans)"
          />
        </div>

        <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Type scale (Manrope)
          </h3>
          <div className="mt-6 space-y-4 font-[family-name:var(--font-display)] tracking-[-0.02em] text-[var(--color-foreground)]">
            <p className="text-[64px] font-extrabold leading-none">Display 64 / Hero</p>
            <p className="text-[44px] font-extrabold leading-none">Heading 44 / H1</p>
            <p className="text-[32px] font-bold leading-none">Heading 32 / H2</p>
            <p className="text-[22px] font-bold leading-none">Heading 22 / H3</p>
            <p className="font-[family-name:var(--font-sans)] text-[16px] font-normal leading-relaxed text-[var(--color-muted-strong)]">
              Body 16 / Inter — основной размер для контента. Lorem ipsum dolor sit amet.
            </p>
            <p className="font-[family-name:var(--font-sans)] text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Caption 13 / Uppercase
            </p>
          </div>
        </div>
      </Section>

      {/* CLEAR SPACE / MIN SIZE */}
      <Section
        title="05 / Clear space & minimum size"
        subtitle="Сохрани воздух вокруг лого равный высоте «капельки» (×0.5)."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-10">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 -m-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-pitch-500)]/40"
                aria-hidden
              />
              <BrandLockup variant="horizontal" tone="color" showTagline={false} />
            </div>
            <p className="mt-6 text-xs font-medium text-[var(--color-muted)]">
              Минимум — 32 px высота капли в digital. В печати — не меньше 12 мм.
            </p>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Minimum sizes
            </p>
            <div className="mt-6 flex items-end gap-8">
              <div className="flex flex-col items-center gap-2">
                <BrandMark tone="color" size={24} />
                <span className="text-[10px] text-[var(--color-muted)]">24 px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BrandMark tone="color" size={32} />
                <span className="text-[10px] text-[var(--color-muted)]">32 px ✓ min</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BrandMark tone="color" size={48} />
                <span className="text-[10px] text-[var(--color-muted)]">48 px</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BrandMark tone="color" size={72} />
                <span className="text-[10px] text-[var(--color-muted)]">72 px</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* DOS & DONTS */}
      <Section title="06 / Do & Don't" subtitle="Чего НЕ делать с логотипом.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DontCard label="Не сжимай">
            <div className="scale-y-[0.6]">
              <BrandMark tone="color" size={80} />
            </div>
          </DontCard>
          <DontCard label="Не вращай">
            <div className="rotate-[18deg]">
              <BrandMark tone="color" size={80} />
            </div>
          </DontCard>
          <DontCard label="Не перекрашивай">
            <div style={{ filter: "hue-rotate(140deg) saturate(1.6)" }}>
              <BrandMark tone="color" size={80} />
            </div>
          </DontCard>
          <DontCard label="Не добавляй тени">
            <div style={{ filter: "drop-shadow(0 6px 0 #000)" }}>
              <BrandMark tone="color" size={80} />
            </div>
          </DontCard>
        </div>
      </Section>

      {/* FOOTER */}
      <section className="mt-16 border-t border-[var(--color-border)]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 py-8 text-xs text-[var(--color-muted)]">
            <span>© FootballEvents · Brand book v1</span>
            <span>
              Вопросы по бренду —{" "}
              <a href="mailto:hello@footballevents.eu" className="text-[var(--color-foreground)] underline">
                hello@footballevents.eu
              </a>
            </span>
          </div>
        </Container>
      </section>
    </main>
  );
}

/* ───────────────── small UI helpers ───────────────── */

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-b border-[var(--color-border)] py-16">
      <Container>
        <div className="mb-10 max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-extrabold tracking-tight text-[var(--color-foreground)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-base text-[var(--color-muted-strong)]">{subtitle}</p>
          )}
        </div>
        {children}
      </Container>
    </section>
  );
}

function Card({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white">
      <div className="flex min-h-[220px] items-center justify-center bg-[var(--color-surface-muted)] p-10">
        {children}
      </div>
      <div className="border-t border-[var(--color-border)] p-5">
        <p className="text-sm font-bold text-[var(--color-foreground)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{desc}</p>
      </div>
    </div>
  );
}

function Swatch({
  label,
  bg,
  border = false,
  children,
}: {
  label: string;
  bg: string;
  border?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-xl)] ${border ? "border border-[var(--color-border)]" : ""}`}
    >
      <div className="flex min-h-[160px] items-center justify-center p-10" style={{ backgroundColor: bg }}>
        {children}
      </div>
      <div className="bg-white p-4 text-xs">
        <p className="font-semibold text-[var(--color-foreground)]">{label}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase text-[var(--color-muted)]">{bg}</p>
      </div>
    </div>
  );
}

function SmallSwatch({
  label,
  bg,
  border = false,
  textColor,
  children,
}: {
  label: string;
  bg: string;
  border?: boolean;
  textColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-[var(--radius-xl)] ${border ? "border border-[var(--color-border)]" : ""}`}>
      <div
        className="flex min-h-[180px] items-center justify-center p-8"
        style={{ backgroundColor: bg, color: textColor }}
      >
        {children}
      </div>
      <div className="bg-white p-4 text-xs">
        <p className="font-semibold text-[var(--color-foreground)]">{label}</p>
      </div>
    </div>
  );
}

function ColorChip({
  name,
  hex,
  textOn,
  role,
}: {
  name: string;
  hex: string;
  textOn: string;
  role: string;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]">
      <div className="flex h-32 items-end p-4" style={{ backgroundColor: hex, color: textOn }}>
        <span className="font-mono text-xs uppercase tracking-wide">{hex}</span>
      </div>
      <div className="bg-white p-4">
        <p className="text-sm font-bold text-[var(--color-foreground)]">{name}</p>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{role}</p>
      </div>
    </div>
  );
}

function Stop({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-4 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: hex }} />
      <span className="font-mono text-[11px] text-[var(--color-foreground)]">{hex}</span>
      <span className="text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

function TypeCard({
  family,
  role,
  weights,
  sample,
  fontVar,
  heavy = false,
}: {
  family: string;
  role: string;
  weights: string;
  sample: string;
  fontVar: string;
  heavy?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-8">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold text-[var(--color-foreground)]" style={{ fontFamily: fontVar }}>
          {family}
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">{role}</p>
      </div>
      <p
        className="mt-6 text-[56px] leading-none tracking-tight text-[var(--color-foreground)]"
        style={{ fontFamily: fontVar, fontWeight: heavy ? 800 : 600 }}
      >
        {sample}
      </p>
      <p className="mt-6 text-xs text-[var(--color-muted)]">{weights}</p>
      <div className="mt-4 flex gap-2 text-[11px] font-mono uppercase text-[var(--color-muted)]">
        <span className="rounded bg-[var(--color-surface-muted)] px-2 py-1">Aa Bb 123</span>
        <span className="rounded bg-[var(--color-surface-muted)] px-2 py-1">— · • →</span>
      </div>
    </div>
  );
}

function DontCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white">
      <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden bg-[var(--color-surface-muted)] p-6">
        {children}
        <span
          className="pointer-events-none absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: "#DC2626" }}
          aria-hidden
        >
          ×
        </span>
      </div>
      <div className="p-4 text-center">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{label}</p>
      </div>
    </div>
  );
}
