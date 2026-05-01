import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSocialImageFonts } from "@/lib/social-image-fonts";
import { AD_THEMES, SIZES, type AdLang, type AdFormat } from "@/lib/promotion-ad-themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NIGHT  = "#0A1628";
const NIGHT2 = "#0F1F36";
const PITCH  = "#10B981";
const PITCH2 = "#047857";
const WHITE  = "#FFFFFF";
const MUTED  = "#94A3B8";
const LIGHT  = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT   = "#0F172A";

// ─── small atoms ─────────────────────────────────────────────────────────────

function Chip({ label, color = PITCH, bg = `${PITCH}22` }: { label: string; color?: string; bg?: string }) {
  return (
    <div style={{ display: "flex", background: bg, color, fontSize: 13, fontWeight: 800,
      padding: "4px 12px", borderRadius: 999, letterSpacing: 0.2 }}>
      {label}
    </div>
  );
}

function StatusChip({ status }: { status: "new" | "accepted" | "pending" | "waitlist" }) {
  const cfg: Record<string, [string, string, string]> = {
    new:      ["NEW",      "#3B82F6", "#EFF6FF"],
    accepted: ["ACCEPTED", "#10B981", "#ECFDF5"],
    pending:  ["PENDING",  "#F59E0B", "#FFFBEB"],
    waitlist: ["WAITLIST", "#8B5CF6", "#F5F3FF"],
  };
  const [label, color, bg] = cfg[status];
  return <div style={{ display: "flex", background: bg, color, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{label}</div>;
}

function LogoBar({ dark }: { dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 5, height: 34, background: PITCH, borderRadius: 3, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: dark ? TEXT : WHITE, display: "flex" }}>footballevents.eu</div>
        <div style={{ fontSize: 11, color: dark ? "#94A3B8" : `${WHITE}80`, display: "flex" }}>International football events catalog</div>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

type ECardProps = { title: string; tag?: string; date: string; city: string; price: string; featured?: boolean; inverted?: boolean };

function ECard({ title, tag, date, city, price, featured, inverted }: ECardProps) {
  const bg         = inverted ? NIGHT2 : WHITE;
  const titleColor = inverted ? WHITE  : TEXT;
  const metaColor  = inverted ? MUTED  : "#64748B";
  const border     = featured ? `2px solid ${PITCH}` : `1px solid ${inverted ? `${PITCH}25` : BORDER}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", background: bg, borderRadius: 16, overflow: "hidden", border, flexShrink: 0 }}>
      {/* cover */}
      <div style={{ height: 96, background: `linear-gradient(135deg, ${PITCH2} 0%, #065f46 100%)`,
        display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 6, padding: "12px 14px" }}>
        {featured && <Chip label="⭐ FEATURED" color="#000" bg="#F59E0B" />}
        {tag      && <Chip label={tag}         color={WHITE} bg={`${WHITE}22`} />}
      </div>
      {/* body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: titleColor, display: "flex" }}>{title}</div>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: metaColor }}>
          <span style={{ display: "flex" }}>📅 {date}</span>
          <span style={{ display: "flex" }}>📍 {city}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: PITCH, display: "flex" }}>{price}</div>
          <div style={{ background: PITCH, color: NIGHT, fontSize: 12, fontWeight: 700,
            padding: "5px 14px", borderRadius: 999, display: "flex" }}>Apply →</div>
        </div>
      </div>
    </div>
  );
}

// ─── Application row ──────────────────────────────────────────────────────────

function AppRow({ name, team, flag, status }: { name: string; team: string; flag: string; status: "new" | "accepted" | "pending" | "waitlist" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      background: NIGHT2, borderRadius: 12, padding: "10px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: WHITE, display: "flex" }}>{name}</div>
        <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>{flag} {team}</div>
      </div>
      <StatusChip status={status} />
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, trend, accent }: { label: string; value: string; trend?: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1,
      background: accent ? `${PITCH}18` : NIGHT2, borderRadius: 14, padding: "16px 18px",
      border: `1px solid ${accent ? PITCH : `${PITCH}20`}` }}>
      <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>{label}</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 38, color: accent ? PITCH : WHITE, lineHeight: 1, display: "flex" }}>{value}</div>
      {trend && <div style={{ fontSize: 12, color: PITCH, display: "flex" }}>{trend}</div>}
    </div>
  );
}

// ─── Browser frame mockup ─────────────────────────────────────────────────────

function BrowserFrame({ children, url = "footballevents.eu/events" }: { children: React.ReactNode; url?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden",
      border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>
      {/* chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1E293B", padding: "10px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#EF4444","#F59E0B","#10B981"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 999, background: c, display: "flex" }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "#0F172A", borderRadius: 6, padding: "4px 12px",
          fontSize: 12, color: "#475569", display: "flex" }}>🔒 {url}</div>
      </div>
      {/* page */}
      <div style={{ display: "flex", flexDirection: "column", background: LIGHT, padding: 16, gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ─── CINEMATIC ────────────────────────────────────────────────────────────────

function Cinematic({ headline, sub, cta, width, height, themeId }: {
  headline: string; sub: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const isStory    = height > 1500;
  const pad        = 64;

  const titleSize = isStory ? 88 : isPortrait ? 72 : 66;
  const subSize   = isStory ? 28 : isPortrait ? 24 : 22;

  // Cards by theme
  const cards: ECardProps[] = themeId === 7
    ? [{ title: "FC Barcelona Academy", tag: "OPEN TRIAL", date: "24 Mar", city: "Madrid, ES", price: "€0 entry", featured: true },
       { title: "Ajax Youth Trial", tag: "ELITE", date: "12 Apr", city: "Amsterdam", price: "€0 entry", inverted: true }]
    : themeId === 8
    ? [{ title: "Real Madrid vs Man City", tag: "UCL", date: "Apr 9", city: "Madrid", price: "from €420", featured: true },
       { title: "Arsenal vs Liverpool", tag: "PL", date: "Apr 22", city: "London", price: "from €380", inverted: true }]
    : [{ title: "Madrid Summer Cup U14", tag: "TOURNAMENT", date: "Jun 15–18", city: "Madrid, ES", price: "from €120", featured: true },
       { title: "Elite Football Camp", tag: "CAMP", date: "Jul 7–14", city: "Barcelona, ES", price: "from €890", inverted: true }];

  // filters shown in browser frame
  const filters = themeId === 7 ? ["All", "Trials", "U14", "U16", "Europe"] :
                  themeId === 8 ? ["All", "Match Tours", "UCL", "Premier League"] :
                  ["All", "Tournaments", "Camps", "Trials"];

  const mockupWidth = isPortrait ? (isStory ? 520 : 480) : 480;

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row",
      background: `linear-gradient(150deg, ${NIGHT} 0%, #0F1F38 55%, ${PITCH2} 100%)`,
      color: WHITE, fontFamily: "Inter", position: "relative", overflow: "hidden" }}>

      {/* Pitch SVG background */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.07, display: "flex" }}>
        <rect x={width*0.05} y={height*0.05} width={width*0.9} height={height*0.9}
          fill="none" stroke={WHITE} strokeWidth="3" />
        {isPortrait
          ? <line x1={width*0.05} y1={height/2} x2={width*0.95} y2={height/2} stroke={WHITE} strokeWidth="2" />
          : <line x1={width/2} y1={height*0.05} x2={width/2} y2={height*0.95} stroke={WHITE} strokeWidth="2" />}
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.13} fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx={width/2} cy={height/2} r={5} fill={WHITE} />
      </svg>
      {/* bottom green glow */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height*0.08,
        display: "flex", background: `linear-gradient(0deg, ${PITCH2}BB 0%, transparent 100%)` }} />

      {isPortrait ? (
        // ── PORTRAIT: column layout ──────────────────────────────────────────
        <>
          {/* Logo */}
          <div style={{ display: "flex", padding: `${pad}px ${pad}px 0` }}>
            <LogoBar />
          </div>

          {/* Browser frame mockup */}
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center",
            padding: `32px ${pad}px 24px` }}>
            <div style={{ display: "flex", width: mockupWidth }}>
              <BrowserFrame>
                {/* filter chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {filters.map((f, i) => (
                    <div key={f} style={{ display: "flex", background: i === 1 ? PITCH : "#E2E8F0",
                      color: i === 1 ? WHITE : "#64748B", fontSize: 12, fontWeight: 700,
                      padding: "4px 12px", borderRadius: 999 }}>{f}</div>
                  ))}
                </div>
                {/* event cards */}
                {cards.map((c) => (
                  <div key={c.title} style={{ display: "flex", flexDirection: "column" }}>
                    <ECard {...c} featured={false} inverted={false} />
                  </div>
                ))}
              </BrowserFrame>
            </div>
          </div>

          {/* Text block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16,
            padding: `0 ${pad}px ${pad}px` }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[cards[0].tag ?? "", cards[1].tag ?? ""].filter(Boolean).map(t =>
                <Chip key={t} label={t} color={PITCH} bg={`${PITCH}22`} />
              )}
            </div>
            <div style={{ fontSize: subSize, color: PITCH, fontWeight: 700, display: "flex" }}>{sub}</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE,
              display: "flex", flexWrap: "wrap" }}>{headline}</div>
            <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT,
              fontSize: subSize, fontWeight: 700, padding: "14px 32px", borderRadius: 999 }}>{cta}</div>
          </div>
        </>
      ) : (
        // ── LANDSCAPE: row layout ────────────────────────────────────────────
        <>
          {/* Left: text */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center",
            gap: 24, padding: `${pad}px 48px ${pad}px ${pad}px`, width: 840 }}>
            <LogoBar />
            <div style={{ fontSize: subSize, color: PITCH, fontWeight: 700, display: "flex" }}>{sub}</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0,
              color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>
            <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT,
              fontSize: 22, fontWeight: 700, padding: "14px 32px", borderRadius: 999 }}>{cta}</div>
          </div>
          {/* Right: browser mockup */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: `${pad}px ${pad}px ${pad}px 0` }}>
            <div style={{ display: "flex", width: 460 }}>
              <BrowserFrame>
                <div style={{ display: "flex", gap: 6 }}>
                  {filters.map((f, i) => (
                    <div key={f} style={{ display: "flex", background: i === 1 ? PITCH : "#E2E8F0",
                      color: i === 1 ? WHITE : "#64748B", fontSize: 11, fontWeight: 700,
                      padding: "4px 10px", borderRadius: 999 }}>{f}</div>
                  ))}
                </div>
                {cards.map((c) => (
                  <div key={c.title} style={{ display: "flex", flexDirection: "column" }}>
                    <ECard {...c} featured={false} inverted={false} />
                  </div>
                ))}
              </BrowserFrame>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── SPLIT ────────────────────────────────────────────────────────────────────

function Split({ headline, cta, width, height }: { headline: string; cta: string; width: number; height: number }) {
  const isPortrait = height >= width;
  const pad = 48;
  const halfW = Math.round(width / 2);
  const halfH = Math.round(height / 2);
  const titleSize = isPortrait ? 46 : 44;

  const chaos = [
    { icon: "💬", label: "WhatsApp Group", sub: "24 unread · \"Who applied?\"" },
    { icon: "📊", label: "Google Sheets", sub: "participants_final_v3.xlsx" },
    { icon: "📘", label: "Facebook Post", sub: "Reach: 12 people · 2 likes" },
    { icon: "📧", label: "Email chains", sub: "RE: RE: RE: Application" },
  ];

  const apps: Array<{ name: string; team: string; flag: string; status: "new" | "accepted" | "pending" | "waitlist" }> = [
    { name: "Lucas Meyer",    team: "FC Eagles",    flag: "🇩🇪", status: "accepted" },
    { name: "Ivan Petrov",    team: "Spartak U14",  flag: "🇷🇺", status: "new" },
    { name: "Carlos Ruiz",    team: "Valencia B",   flag: "🇪🇸", status: "accepted" },
    { name: "Adam Kowalski",  team: "Lech Youth",   flag: "🇵🇱", status: "pending" },
  ];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row",
      fontFamily: "Inter", position: "relative" }}>

      {/* BEFORE panel */}
      <div style={{ width: isPortrait ? width : halfW, height: isPortrait ? halfH : height,
        display: "flex", flexDirection: "column", background: "#1C2333", padding: pad, gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Chip label="✕ BEFORE" color={WHITE} bg="#EF4444" />
          <div style={{ fontSize: 16, color: MUTED, display: "flex" }}>Chaos. Spreadsheets. Missed leads.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {chaos.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12,
              background: "#0F172A", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 22, display: "flex", width: 32, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#CBD5E1", display: "flex" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#64748B", display: "flex" }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AFTER panel */}
      <div style={{ width: isPortrait ? width : halfW, height: isPortrait ? halfH : height,
        display: "flex", flexDirection: "column", background: NIGHT, padding: pad, gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Chip label="✓ AFTER" color={NIGHT} bg={PITCH} />
          <div style={{ fontSize: 16, color: MUTED, display: "flex" }}>footballevents.eu dashboard</div>
        </div>
        {/* mini stats */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: NIGHT2, borderRadius: 12, padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>Applications</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: WHITE, display: "flex" }}>142</div>
            <div style={{ fontSize: 12, color: PITCH, display: "flex" }}>↑ 34% this week</div>
          </div>
          <div style={{ flex: 1, background: NIGHT2, borderRadius: 12, padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>Countries</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: PITCH, display: "flex" }}>12</div>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>active regions</div>
          </div>
          <div style={{ flex: 1, background: NIGHT2, borderRadius: 12, padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>Accepted</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: WHITE, display: "flex" }}>78%</div>
            <div style={{ fontSize: 12, color: PITCH, display: "flex" }}>rate</div>
          </div>
        </div>
        {/* app rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {apps.map((r) => <AppRow key={r.name} {...r} />)}
        </div>
      </div>

      {/* CENTER DIVIDER with headline */}
      <div style={{
        position: "absolute",
        left:   isPortrait ? 0          : halfW - 80,
        top:    isPortrait ? halfH - 44 : 0,
        width:  isPortrait ? width      : 160,
        height: isPortrait ? 88         : height,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", background: PITCH2, padding: "0 20px", gap: 8,
      }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, color: WHITE,
          textAlign: "center", lineHeight: 1.0, display: "flex", flexWrap: "wrap",
          justifyContent: "center" }}>{headline}</div>
        <div style={{ background: WHITE, color: PITCH2, fontSize: 16, fontWeight: 700,
          padding: "8px 18px", borderRadius: 999, display: "flex" }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────

function Card({ headline, sub, body, cta, width, height, themeId }: {
  headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const isStory    = height > 1500;
  const pad        = isStory ? 72 : isPortrait ? 64 : 72;
  const titleSize  = isStory ? 72 : isPortrait ? 64 : 56;
  const accent     = themeId === 20 ? "#F59E0B" : PITCH;
  const bullets    = body.includes(" · ") ? body.split(" · ").map(s => s.trim()) : [body];

  // per-theme mockup content
  const Mockup = () => {
    if (themeId === 5) return ( // Boost
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[["Basic",    "€5",  "7 days bumped in listings",       false],
          ["Featured", "€19", "14 days at category top + badge", false],
          ["Premium",  "€59", "Homepage hero + gold border",     true]] .map(([n, p, d, hi]) => (
          <div key={n as string} style={{ display: "flex", alignItems: "center",
            justifyContent: "space-between", background: hi ? `${PITCH}12` : "#F1F5F9",
            borderRadius: 12, padding: "12px 16px", border: `1px solid ${hi ? PITCH : BORDER}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, display: "flex" }}>{n} Boost</div>
              <div style={{ fontSize: 12, color: "#64748B", display: "flex" }}>{d}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: hi ? PITCH : PITCH2, display: "flex" }}>{p}</div>
          </div>
        ))}
        <ECard title="U14 Tournament Madrid" tag="TOURNAMENT" date="Jun 15" city="Madrid" price="from €120" featured />
      </div>
    );

    if (themeId === 11) return ( // Verified
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[{ name: "FC Academy Madrid",       tier: "PRO",     ev: 8,  fl: 312, v: true },
          { name: "Baltic Cup Organisation", tier: "PREMIUM", ev: 14, fl: 891, v: true },
          { name: "New Organizer",           tier: "FREE",    ev: 2,  fl: 8,   v: false }]
          .map((o) => (
          <div key={o.name} style={{ display: "flex", alignItems: "center", gap: 14,
            background: o.v ? WHITE : "#F1F5F9", borderRadius: 14,
            border: `1px solid ${o.v ? BORDER : "#E2E8F0"}`, padding: "12px 16px",
            opacity: o.v ? 1 : 0.6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: o.v ? PITCH : "#E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0 }}>{o.v ? "⚽" : "?"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, display: "flex" }}>{o.name}</div>
              <div style={{ fontSize: 12, color: "#64748B", display: "flex" }}>{o.ev} events · {o.fl} followers</div>
            </div>
            {o.v
              ? <Chip label="✓ VERIFIED" color={PITCH2} bg={`${PITCH}18`} />
              : <Chip label="UNVERIFIED" color="#94A3B8" bg="#E2E8F0" />}
          </div>
        ))}
      </div>
    );

    if (themeId === 15) return ( // Free start
      <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", gap: 12 }}>
        {[{ n: "1", icon: "🧑‍💼", title: "Create profile",   time: "2 min",  accent: false },
          { n: "2", icon: "📋",   title: "Publish event",    time: "5 min",  accent: false },
          { n: "3", icon: "📨",   title: "Get applications", time: "Instant", accent: true }]
          .map((s) => (
          <div key={s.n} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8,
            background: s.accent ? `${PITCH}12` : "#F1F5F9", borderRadius: 14, padding: "16px",
            border: `1px solid ${s.accent ? PITCH : BORDER}` }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: s.accent ? PITCH : NIGHT,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: WHITE, fontWeight: 800 }}>{s.n}</div>
            <div style={{ fontSize: 24, display: "flex" }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, display: "flex" }}>{s.title}</div>
            <div style={{ fontSize: 12, color: s.accent ? PITCH2 : "#64748B", fontWeight: 600, display: "flex" }}>{s.time}</div>
          </div>
        ))}
      </div>
    );

    if (themeId === 20) return ( // Launch
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["25 active events", "YouTube / Vimeo embed in hero", "Featured homepage carousel",
          "Social sharing kit (all formats)", "Dedicated account manager", "3 free boosts / month"]
          .map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#000", fontWeight: 800, flexShrink: 0 }}>✓</div>
            <div style={{ fontSize: isStory ? 20 : 18, color: TEXT, display: "flex" }}>{item}</div>
          </div>
        ))}
        <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <div style={{ fontSize: 20, display: "flex" }}>⏳</div>
          <div style={{ fontSize: 14, color: "#92400E", fontWeight: 700, display: "flex" }}>
            50 spots only · No credit card required
          </div>
        </div>
      </div>
    );

    if (themeId === 19) return ( // Sharing kit
      <div style={{ display: "flex", gap: 16 }}>
        {/* phone */}
        <div style={{ display: "flex", flexDirection: "column", background: "#1A1A2E",
          borderRadius: 24, padding: "12px 8px", gap: 8, width: 180, alignItems: "center" }}>
          <div style={{ width: 48, height: 5, background: "#333", borderRadius: 3, display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", width: 160,
            background: WHITE, borderRadius: 16, overflow: "hidden", gap: 6, padding: 10 }}>
            <div style={{ height: 90, background: `linear-gradient(135deg, ${PITCH2}, #065f46)`,
              borderRadius: 10, display: "flex", flexDirection: "column",
              alignItems: "flex-start", padding: "8px 10px", gap: 2 }}>
              <div style={{ fontSize: 10, color: `${WHITE}80`, display: "flex" }}>footballevents.eu</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, display: "flex" }}>U14 Summer Cup</div>
              <div style={{ fontSize: 10, color: `${WHITE}70`, display: "flex" }}>Jun 15–18 · Madrid</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {["📥 Save", "FB", "IG", "TT"].map(l => (
                <div key={l} style={{ background: l === "📥 Save" ? PITCH : "#E2E8F0",
                  color: l === "📥 Save" ? WHITE : "#64748B", fontSize: 10, fontWeight: 700,
                  padding: "4px 8px", borderRadius: 999, display: "flex" }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 999, border: "2px solid #333", display: "flex" }} />
        </div>
        {/* formats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, display: "flex" }}>Download formats</div>
          {[["Post", "1080×1350", true], ["Story", "1080×1920", false], ["Landscape", "1920×1080", false]]
            .map(([f, s, hi]) => (
            <div key={f as string} style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", background: hi ? `${PITCH}10` : "#F1F5F9",
              borderRadius: 10, padding: "10px 14px",
              border: `1px solid ${hi ? PITCH : BORDER}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, display: "flex" }}>{f}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", display: "flex" }}>{s}</div>
              </div>
              <div style={{ fontSize: 18, color: PITCH, fontWeight: 700, display: "flex" }}>↓</div>
            </div>
          ))}
          <Chip label="✨ Premium feature" color={PITCH2} bg={`${PITCH}15`} />
        </div>
      </div>
    );

    // Default: bullets
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bullets.map((b) => (
          <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: accent,
              display: "flex", flexShrink: 0, marginTop: 6 }} />
            <div style={{ fontSize: isStory ? 22 : isPortrait ? 19 : 17, color: "#334155", display: "flex" }}>{b}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column",
      background: LIGHT, fontFamily: "Inter", overflow: "hidden" }}>
      {/* top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${PITCH2})`, display: "flex" }} />
      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: isStory ? 28 : 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoBar dark />
          {themeId === 20 && <Chip label="🎉 LAUNCH OFFER" color="#92400E" bg="#FEF3C7" />}
          {themeId === 4  && <Chip label="Most Popular"    color={PITCH2}  bg={`${PITCH}15`} />}
        </div>
        <div style={{ fontSize: isStory ? 22 : 18, fontWeight: 700, color: accent, display: "flex" }}>{sub}</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0,
          color: TEXT, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <Mockup />
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignSelf: "flex-start", background: accent,
          color: themeId === 20 ? "#000" : NIGHT, fontSize: isStory ? 26 : 22, fontWeight: 700,
          padding: `${isStory ? 16 : 14}px ${isStory ? 36 : 28}px`, borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────

function Stats({ headline, sub, cta, width, height, themeId }: {
  headline: string; sub: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 56 : 60;
  const titleSize = isPortrait ? 56 : 50;

  const statsRows: Array<{ label: string; value: string; trend?: string; accent?: boolean }> =
    themeId === 9
      ? [{ label: "Page views",    value: "2,847", trend: "↑ 34%",   accent: false },
         { label: "Applications",  value: "142",   trend: "↑ 22%",   accent: true  },
         { label: "Acceptance",    value: "78%",   trend: "↑ 12pp",  accent: false },
         { label: "Countries",     value: "12",    trend: "reached", accent: false }]
      : themeId === 18
      ? [{ label: "Boost discount", value: "50%",  trend: "all types",  accent: false },
         { label: "Boosts/month",   value: "10×",  trend: "included",   accent: true  },
         { label: "Moderation",     value: "1h",   trend: "SLA",        accent: false },
         { label: "Events",         value: "25+",  trend: "by agreement", accent: false }]
      : [{ label: "Countries",  value: "50+",   trend: "worldwide",  accent: false },
         { label: "Events",     value: "1000+", trend: "listed",     accent: true  },
         { label: "Organizers", value: "200+",  trend: "verified",   accent: false },
         { label: "Formats",    value: "6",     trend: "categories", accent: false }];

  const apps: Array<{ name: string; team: string; flag: string; status: "new" | "accepted" | "pending" | "waitlist" }> = [
    { name: "Lucas Meyer",   team: "FC Eagles",   flag: "🇩🇪", status: "accepted" },
    { name: "Ivan Petrov",   team: "Spartak U14", flag: "🇷🇺", status: "new"      },
    { name: "Carlos Ruiz",   team: "Valencia B",  flag: "🇪🇸", status: "accepted" },
    { name: "Adam Kowalski", team: "Lech Youth",  flag: "🇵🇱", status: "pending"  },
    { name: "Ali Hassan",    team: "Dubai FC",    flag: "🇦🇪", status: "waitlist" },
  ];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row",
      background: NIGHT, fontFamily: "Inter", color: WHITE, overflow: "hidden" }}>

      {/* sidebar */}
      <div style={{
        width: isPortrait ? width : 320, height: isPortrait ? 210 : height,
        background: `linear-gradient(145deg, ${PITCH2}, #064E3B)`,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: pad, gap: 16,
      }}>
        <LogoBar />
        <div style={{ fontFamily: "Bebas Neue", fontSize: isPortrait ? 40 : titleSize,
          lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <div style={{ fontSize: 17, color: `${WHITE}CC`, display: "flex" }}>{sub}</div>
      </div>

      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: 16 }}>
        {/* stats */}
        <div style={{ display: "flex", gap: 10 }}>
          {statsRows.map((s) => <StatBox key={s.label} {...s} />)}
        </div>

        {/* app rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, marginBottom: 2, display: "flex" }}>
            {themeId === 18 ? "Managed organizers" : "Recent applications"}
          </div>
          {(themeId === 18
            ? [{ name: "Baltic Cup Org", team: "14 events", flag: "🇪🇪", status: "accepted" as const },
               { name: "FC Madrid Acad", team: "8 events",  flag: "🇪🇸", status: "accepted" as const },
               { name: "Warsaw League",  team: "22 events", flag: "🇵🇱", status: "new"      as const }]
            : apps.slice(0, isPortrait ? 3 : 5)
          ).map((r) => <AppRow key={r.name} {...r} />)}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT,
          fontSize: 20, fontWeight: 700, padding: "12px 28px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── WORLD ────────────────────────────────────────────────────────────────────

function World({ headline, body, cta, width, height, themeId }: {
  headline: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const isStory    = height > 1500;
  const pad        = isStory ? 72 : 64;
  const titleSize  = isStory ? 80 : isPortrait ? 70 : 64;
  const isFreeAll  = themeId === 17;

  const dots = [
    [0.12,0.35],[0.18,0.27],[0.22,0.38],[0.27,0.44],[0.33,0.52],
    [0.45,0.28],[0.48,0.34],[0.52,0.30],[0.55,0.36],[0.58,0.40],
    [0.62,0.27],[0.65,0.33],[0.70,0.38],[0.75,0.42],[0.82,0.46],
    [0.50,0.58],[0.42,0.62],[0.55,0.68],[0.78,0.60],[0.86,0.36],
  ];

  const bubbles = [
    { x: 0.52, y: 0.26, label: "127", flag: "🇪🇸" },
    { x: 0.47, y: 0.24, label: "89",  flag: "🇩🇪" },
    { x: 0.43, y: 0.29, label: "43",  flag: "🇬🇧" },
    { x: 0.63, y: 0.28, label: "61",  flag: "🇷🇺" },
    { x: 0.76, y: 0.38, label: "28",  flag: "🇦🇪" },
  ];

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column",
      background: `linear-gradient(180deg, ${NIGHT} 0%, #0D2240 100%)`,
      fontFamily: "Inter", color: WHITE, position: "relative", overflow: "hidden" }}>

      {/* dot network */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
        {dots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x*width} cy={y*height} r={5} fill={PITCH} opacity={0.9} />
            <circle cx={x*width} cy={y*height} r={18} fill={PITCH} opacity={0.1} />
            {i < dots.length - 1 && (
              <line x1={x*width} y1={y*height}
                x2={dots[i+1][0]*width} y2={dots[i+1][1]*height}
                stroke={PITCH} strokeWidth={1} opacity={0.15} />
            )}
          </g>
        ))}
      </svg>

      {/* event count bubbles */}
      {bubbles.map((b) => (
        <div key={b.label} style={{ position: "absolute",
          left: b.x*width - 44, top: b.y*height - 16,
          display: "flex", background: `${NIGHT}E8`, border: `1px solid ${PITCH}50`,
          borderRadius: 20, padding: "4px 10px", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 14, display: "flex" }}>{b.flag}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: PITCH, display: "flex" }}>{b.label} events</span>
        </div>
      ))}

      {/* bottom gradient */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height*0.58,
        display: "flex", background: `linear-gradient(0deg, ${NIGHT}F8 0%, ${NIGHT}90 45%, transparent 100%)` }} />

      {/* logo */}
      <div style={{ position: "absolute", top: pad, left: pad, display: "flex" }}><LogoBar /></div>

      {/* bottom content */}
      <div style={{ position: "absolute", bottom: pad, left: pad, right: pad,
        display: "flex", flexDirection: "column", gap: isStory ? 24 : 20 }}>

        {/* stat pills */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Chip label="50+ Countries" color={NIGHT} bg={PITCH} />
          <Chip label="1,000+ Events" color={PITCH} bg={`${PITCH}22`} />
          <Chip label="200+ Organizers" color={WHITE} bg={`${WHITE}15`} />
        </div>

        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0,
          color: WHITE, display: "flex", flexWrap: "wrap", maxWidth: "88%" }}>{headline}</div>

        {isFreeAll ? (
          // search bar mockup
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 660 }}>
            <div style={{ display: "flex", alignItems: "center", background: WHITE,
              borderRadius: 14, padding: "12px 18px", gap: 12, border: `2px solid ${PITCH}` }}>
              <div style={{ fontSize: 18, display: "flex" }}>🔍</div>
              <div style={{ fontSize: 15, color: "#94A3B8", flex: 1, display: "flex" }}>Search tournaments, camps, cities…</div>
              <div style={{ background: PITCH, color: NIGHT, fontSize: 13, fontWeight: 700,
                padding: "6px 16px", borderRadius: 999, display: "flex" }}>Search</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["🏆 Tournaments", "⛺ Camps", "🎪 Festivals", "🎓 Trials"].map((f, i) => (
                <div key={f} style={{ display: "flex", background: i === 0 ? PITCH : `${WHITE}18`,
                  color: i === 0 ? NIGHT : WHITE, fontSize: 14, fontWeight: 600,
                  padding: "7px 16px", borderRadius: 999 }}>{f}</div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: isStory ? 24 : 20, color: MUTED, maxWidth: "80%", display: "flex" }}>{body}</div>
        )}

        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT,
          fontSize: isStory ? 24 : 20, fontWeight: 700,
          padding: `${isStory ? 14 : 12}px ${isStory ? 32 : 26}px`, borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── QUOTE ────────────────────────────────────────────────────────────────────

function Quote({ headline, sub, body, cta, width, height, themeId }: {
  headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait  = height >= width;
  const isStory     = height > 1500;
  const pad         = isStory ? 72 : isPortrait ? 64 : 68;
  const titleSize   = isStory ? 72 : isPortrait ? 64 : 58;
  const isParents   = themeId === 6;
  const isFestivals = themeId === 10;
  const isTraining  = themeId === 14;

  const bgGrad = isFestivals ? `linear-gradient(145deg, #1E1B4B 0%, #312E81 100%)`
               : isTraining  ? `linear-gradient(145deg, #0C1A2E 0%, #1E3A5F 100%)`
               : `linear-gradient(145deg, ${NIGHT} 0%, #0F2740 100%)`;

  const rightCards: ECardProps[] | null = isPortrait ? null
    : isParents || themeId === 13
      ? [{ title: "Football Camp Spain",  tag: "CAMP",     date: "Jul 7–14",  city: "Malaga, ES",    price: "from €890", featured: true },
         { title: "Summer Academy U12",   tag: "CAMP",     date: "Aug 3–10",  city: "Barcelona, ES", price: "from €720", inverted: true }]
      : isTraining
      ? [{ title: "Pre-Season Camp 2025", tag: "TRAINING", date: "Jan 20–26", city: "Antalya, TR",   price: "from €650", featured: true },
         { title: "Tactical Prep Camp",   tag: "TRAINING", date: "Feb 10–14", city: "Algarve, PT",   price: "from €480", inverted: true }]
      : isFestivals
      ? [{ title: "Barcelona Street Cup", tag: "FESTIVAL", date: "Jun 21–23", city: "Barcelona",     price: "FREE",       featured: true },
         { title: "Beach Soccer Fest",    tag: "FESTIVAL", date: "Jul 5–7",   city: "Alicante, ES",  price: "from €30",   inverted: true }]
      : null;

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row",
      background: bgGrad, fontFamily: "Inter", color: WHITE,
      position: "relative", overflow: "hidden" }}>

      {/* decorative circle */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400,
        borderRadius: "50%", border: `2px solid ${PITCH}22`, display: "flex" }} />

      {/* text column */}
      <div style={{ display: "flex", flexDirection: "column", gap: isStory ? 28 : isPortrait ? 24 : 26,
        padding: pad, flex: 1 }}>
        <LogoBar />
        <div style={{ fontSize: isStory ? 24 : 20, color: PITCH, fontWeight: 700, display: "flex" }}>{sub}</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0,
          color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>

        {isParents && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["✓ Verified organizers", "✓ Full programme & coach info",
              "✓ Reviews from other parents", "✓ Free to search & apply"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12,
                fontSize: isStory ? 24 : 20, color: `${WHITE}CC` }}>{item}</div>
            ))}
          </div>
        )}

        {isTraining && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["🇪🇸 Spain","🇵🇹 Portugal","🇹🇷 Turkey","🇦🇪 UAE","🇩🇪 Germany","🇭🇷 Croatia"]
              .map((d) => (
              <div key={d} style={{ display: "flex", background: `${WHITE}15`, color: WHITE,
                fontSize: 17, fontWeight: 600, padding: "7px 16px", borderRadius: 999,
                border: `1px solid ${WHITE}22` }}>{d}</div>
            ))}
          </div>
        )}

        {body && (
          <div style={{ background: `${WHITE}10`, borderLeft: `4px solid ${PITCH}`,
            borderRadius: "0 14px 14px 0", padding: "16px 20px",
            fontSize: isStory ? 22 : isPortrait ? 20 : 18,
            color: `${WHITE}CC`, lineHeight: 1.5, fontStyle: "italic", display: "flex" }}>
            {body}
          </div>
        )}

        {/* portrait event cards */}
        {isPortrait && !isParents && !isTraining && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ECard
              title={isFestivals ? "Barcelona Street Cup" : "Football Camp Spain"}
              tag={isFestivals ? "FESTIVAL" : "CAMP"}
              date={isFestivals ? "Jun 21–23" : "Jul 7–14"}
              city={isFestivals ? "Barcelona" : "Malaga, ES"}
              price={isFestivals ? "FREE" : "from €890"}
              featured
            />
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT,
          fontSize: isStory ? 24 : 20, fontWeight: 700,
          padding: `${isStory ? 14 : 12}px ${isStory ? 32 : 26}px`, borderRadius: 999 }}>{cta}</div>
      </div>

      {/* landscape right panel: event cards */}
      {rightCards && (
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 12,
          padding: `${pad}px ${pad}px ${pad}px 0`, justifyContent: "center" }}>
          {rightCards.map((c) => <ECard key={c.title} {...c} />)}
        </div>
      )}
    </div>
  );
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.email?.toLowerCase() !== "goality360@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url     = new URL(req.url);
  const themeId = parseInt(url.searchParams.get("theme") ?? "1", 10);
  const lang    = (url.searchParams.get("lang") ?? "en") as AdLang;
  const format  = (url.searchParams.get("format") ?? "portrait") as AdFormat;

  const theme = AD_THEMES.find((t) => t.id === themeId);
  if (!theme)           return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  if (!(format in SIZES)) return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  const { width, height } = SIZES[format];
  const { headline, sub, body, cta } = theme.content[lang] ?? theme.content.en;
  const fonts  = await getSocialImageFonts();
  const props  = { headline, sub, body, cta, width, height, themeId };

  let node: React.ReactElement;
  switch (theme.visual) {
    case "cinematic": node = <Cinematic {...props} />; break;
    case "split":     node = <Split     {...props} />; break;
    case "card":      node = <Card      {...props} />; break;
    case "stats":     node = <Stats     {...props} />; break;
    case "world":     node = <World     {...props} />; break;
    case "quote":     node = <Quote     {...props} />; break;
    default:          node = <Cinematic {...props} />;
  }

  return new ImageResponse(node, {
    width, height, fonts,
    headers: {
      "Content-Disposition": `attachment; filename="feu-theme${themeId}-${lang}-${format}.jpg"`,
      "Cache-Control": "no-store",
    },
  });
}
