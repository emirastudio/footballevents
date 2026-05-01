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
const SLATE  = "#1E293B";
const LIGHT  = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT   = "#0F172A";

// ─── reusable UI building blocks ──────────────────────────────────────────────

function Badge({ label, color = PITCH, bg = `${PITCH}20` }: { label: string; color?: string; bg?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: bg, color, fontSize: 14, fontWeight: 800, padding: "4px 12px", borderRadius: 999, letterSpacing: 0.3 }}>
      {label}
    </div>
  );
}

function StatusDot({ status }: { status: "new" | "accepted" | "pending" | "waitlist" }) {
  const map = { new: ["NEW", "#3B82F6", "#EFF6FF"], accepted: ["ACCEPTED", "#10B981", "#ECFDF5"], pending: ["PENDING", "#F59E0B", "#FFFBEB"], waitlist: ["WAITLIST", "#8B5CF6", "#F5F3FF"] };
  const [label, color, bg] = map[status];
  return <div style={{ display: "flex", background: bg, color, fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{label}</div>;
}

function EventCard({ title, subtitle, date, city, price, featured, dark }: {
  title: string; subtitle?: string; date: string; city: string; price: string; featured?: boolean; dark?: boolean;
}) {
  const cardBg = dark ? NIGHT2 : WHITE;
  const titleColor = dark ? WHITE : TEXT;
  const metaColor = dark ? MUTED : "#64748B";
  const borderColor = dark ? `${PITCH}33` : BORDER;

  return (
    <div style={{ display: "flex", flexDirection: "column", background: cardBg, borderRadius: 18, overflow: "hidden", border: `1px solid ${featured ? PITCH : borderColor}`, width: "100%", boxShadow: featured ? `0 0 0 2px ${PITCH}` : "none" }}>
      {/* cover */}
      <div style={{ height: 110, background: `linear-gradient(135deg, ${PITCH2} 0%, #065f46 60%, #064E3B 100%)`, display: "flex", alignItems: "flex-start", padding: "12px 14px", gap: 6 }}>
        {featured && <Badge label="⭐ FEATURED" color="#000" bg="#F59E0B" />}
        {subtitle && <Badge label={subtitle} color={WHITE} bg={`${WHITE}25`} />}
      </div>
      {/* info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: titleColor, lineHeight: 1.2, display: "flex" }}>{title}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 14, color: metaColor }}>
          <span style={{ display: "flex" }}>📅 {date}</span>
          <span style={{ display: "flex" }}>📍 {city}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: PITCH, display: "flex" }}>{price}</div>
          <div style={{ background: PITCH, color: NIGHT, fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 999, display: "flex" }}>Apply →</div>
        </div>
      </div>
    </div>
  );
}

function AppRow({ name, team, country, status }: { name: string; team: string; country: string; status: "new" | "accepted" | "pending" | "waitlist" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: NIGHT2, borderRadius: 12, padding: "10px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: WHITE, display: "flex" }}>{name}</div>
        <div style={{ fontSize: 13, color: MUTED, display: "flex" }}>{team} · {country}</div>
      </div>
      <StatusDot status={status} />
    </div>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, background: accent ? `${PITCH}15` : NIGHT2, borderRadius: 14, padding: "16px 20px", border: `1px solid ${accent ? PITCH : `${PITCH}20`}` }}>
      <div style={{ fontSize: 13, color: MUTED, display: "flex" }}>{label}</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, color: accent ? PITCH : WHITE, lineHeight: 1, display: "flex" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: PITCH, display: "flex" }}>{sub}</div>}
    </div>
  );
}

function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: WHITE, borderRadius: 14, padding: "12px 18px", gap: 12, border: `2px solid ${PITCH}` }}>
      <div style={{ fontSize: 20, display: "flex" }}>🔍</div>
      <div style={{ fontSize: 16, color: "#94A3B8", display: "flex", flex: 1 }}>{placeholder}</div>
      <div style={{ background: PITCH, color: NIGHT, fontSize: 14, fontWeight: 700, padding: "6px 16px", borderRadius: 999, display: "flex" }}>Search</div>
    </div>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", background: active ? PITCH : `${WHITE}15`, color: active ? NIGHT : WHITE, fontSize: 14, fontWeight: 600, padding: "6px 14px", borderRadius: 999, border: `1px solid ${active ? PITCH : `${WHITE}30`}` }}>
      {label}
    </div>
  );
}

function OrganizerCard({ name, tier, events, followers, verified }: { name: string; tier: string; events: number; followers: number; verified: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: WHITE, borderRadius: 18, overflow: "hidden", border: `1px solid ${BORDER}` }}>
      <div style={{ height: 70, background: `linear-gradient(90deg, ${NIGHT} 0%, ${NIGHT2} 100%)`, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: PITCH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginTop: -20, border: "3px solid white" }}>⚽</div>
          {verified && <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${PITCH}15`, color: PITCH2, fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999, marginTop: -10 }}>✓ Verified</div>}
          <div style={{ display: "flex", background: `${NIGHT}10`, color: NIGHT, fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999, marginTop: -10 }}>{tier}</div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, display: "flex" }}>{name}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#64748B" }}>
          <span style={{ display: "flex" }}>📅 {events} events</span>
          <span style={{ display: "flex" }}>👥 {followers} followers</span>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#1A1A2E", borderRadius: 36, padding: "16px 10px", border: "3px solid #333", width: 240, alignItems: "center", gap: 10 }}>
      <div style={{ width: 60, height: 6, background: "#333", borderRadius: 3, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 8, background: LIGHT, borderRadius: 24, overflow: "hidden", padding: 12 }}>
        {children}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 999, border: "2px solid #333", display: "flex" }} />
    </div>
  );
}

// ─── logo bar (reused) ────────────────────────────────────────────────────────
function LogoBar({ light }: { light?: boolean }) {
  const c = light ? "#64748B" : MUTED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 5, height: 32, background: PITCH, borderRadius: 3, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: light ? TEXT : WHITE, display: "flex" }}>footballevents.eu</div>
        <div style={{ fontSize: 11, color: c, display: "flex" }}>International football events catalog</div>
      </div>
    </div>
  );
}

// ─── CINEMATIC ────────────────────────────────────────────────────────────────
function Cinematic({ headline, sub, cta, width, height, themeId }: {
  headline: string; sub: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 64 : 72;
  const titleSize = height >= 1900 ? 92 : isPortrait ? 76 : 68;

  const isTrials = themeId === 7;
  const isMatchTour = themeId === 8;

  return (
    <div style={{ width, height, display: "flex", position: "relative", background: `linear-gradient(150deg, ${NIGHT} 0%, #0F1F38 50%, ${PITCH2} 100%)`, color: WHITE, fontFamily: "Inter" }}>
      {/* pitch lines */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0, opacity: 0.07, display: "flex" }}>
        <rect x={width * 0.04} y={height * 0.04} width={width * 0.92} height={height * 0.92} fill="none" stroke={WHITE} strokeWidth="3" />
        {isPortrait
          ? <line x1={width * 0.04} y1={height / 2} x2={width * 0.96} y2={height / 2} stroke={WHITE} strokeWidth="2" />
          : <line x1={width / 2} y1={height * 0.04} x2={width / 2} y2={height * 0.96} stroke={WHITE} strokeWidth="2" />}
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.13} fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx={width / 2} cy={height / 2} r={5} fill={WHITE} />
      </svg>

      {/* bottom green scrim */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.08, display: "flex", background: `linear-gradient(0deg, ${PITCH2}CC 0%, transparent 100%)` }} />

      {/* logo */}
      <div style={{ position: "absolute", top: pad, left: pad, display: "flex" }}><LogoBar /></div>

      {/* MOCKUP AREA */}
      {isPortrait ? (
        // portrait: cards stacked in center-right
        <div style={{ position: "absolute", top: "18%", right: pad, display: "flex", flexDirection: "column", gap: 14, width: "55%" }}>
          {isTrials ? (
            // Academy trial cards
            <>
              <div style={{ display: "flex", flexDirection: "column", background: WHITE, borderRadius: 16, overflow: "hidden", border: `2px solid ${PITCH}` }}>
                <div style={{ height: 80, background: `linear-gradient(90deg, ${PITCH2}, #065f46)`, display: "flex", alignItems: "flex-start", padding: "10px 14px", gap: 6 }}>
                  <Badge label="OPEN TRIAL" color={WHITE} bg={`${WHITE}25`} />
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, display: "flex" }}>FC Barcelona Academy</div>
                  <div style={{ fontSize: 13, color: "#64748B", display: "flex" }}>U15–U17 · Spain · 24 Mar 2025</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge label="12 spots left" color={PITCH2} bg={`${PITCH}15`} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", background: NIGHT2, borderRadius: 16, border: `1px solid ${PITCH}30`, overflow: "hidden" }}>
                <div style={{ height: 70, background: `linear-gradient(90deg, #1E3A5F, #0C2A44)`, display: "flex", alignItems: "flex-start", padding: "10px 14px" }}>
                  <Badge label="ELITE" color="#F59E0B" bg="#FEF3C7" />
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: WHITE, display: "flex" }}>Ajax Youth Academy</div>
                  <div style={{ fontSize: 13, color: MUTED, display: "flex" }}>U14–U16 · Netherlands</div>
                </div>
              </div>
            </>
          ) : isMatchTour ? (
            // Match tour cards
            <>
              <div style={{ display: "flex", flexDirection: "column", background: WHITE, borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                <div style={{ height: 80, background: `linear-gradient(90deg, #1a1a2e, #16213e)`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 14px" }}>
                  <Badge label="🏆 CHAMPIONS LEAGUE" color="#F59E0B" bg="#FEF3C7" />
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, display: "flex" }}>Real Madrid vs Man City</div>
                  <div style={{ fontSize: 13, color: "#64748B", display: "flex" }}>📅 Apr 9 · 📍 Madrid · ✈️ + 🏨 included</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: PITCH, display: "flex" }}>from €420</div>
                    <div style={{ background: PITCH, color: NIGHT, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, display: "flex" }}>Book →</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", background: NIGHT2, borderRadius: 16, border: `1px solid ${PITCH}30`, padding: "12px 14px", gap: 6 }}>
                <Badge label="🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE" color={WHITE} bg={`${WHITE}15`} />
                <div style={{ fontSize: 15, fontWeight: 700, color: WHITE, display: "flex" }}>Arsenal vs Liverpool</div>
                <div style={{ fontSize: 13, color: MUTED, display: "flex" }}>Apr 22 · London · from €380</div>
              </div>
            </>
          ) : (
            // Default: two event cards
            <>
              <EventCard title="Madrid Summer Cup U14" subtitle="TOURNAMENT" date="Jun 15–18" city="Madrid, ES" price="from €120" featured />
              <EventCard title="Elite Football Camp" subtitle="CAMP" date="Jul 7–14" city="Barcelona, ES" price="from €890" dark />
            </>
          )}
        </div>
      ) : (
        // landscape: cards on right half
        <div style={{ position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 12, width: "38%" }}>
          <EventCard title="Madrid Summer Cup U14" subtitle="TOURNAMENT" date="Jun 15–18" city="Madrid, ES" price="from €120" featured />
          <EventCard title="Elite Football Camp" subtitle="CAMP" date="Jul 7–14" city="Barcelona" price="from €890" dark />
        </div>
      )}

      {/* content block */}
      <div style={{ position: "absolute", bottom: pad, left: pad, display: "flex", flexDirection: "column", gap: 20, maxWidth: isPortrait ? "100%" : "52%" }}>
        <div style={{ fontSize: isPortrait ? 26 : 22, color: PITCH, fontWeight: 700, letterSpacing: 0.5, display: "flex" }}>{sub}</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap", maxWidth: isPortrait ? "90%" : "100%" }}>{headline}</div>
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT, fontSize: isPortrait ? 26 : 22, fontWeight: 700, padding: isPortrait ? "16px 36px" : "12px 28px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── SPLIT (Before / After) ───────────────────────────────────────────────────
function Split({ headline, sub, cta, width, height }: { headline: string; sub: string; cta: string; width: number; height: number }) {
  const isPortrait = height >= width;
  const pad = 48;
  const halfW = isPortrait ? width : Math.round(width / 2);
  const halfH = isPortrait ? Math.round(height / 2) : height;
  const titleSize = isPortrait ? 52 : 46;

  const beforeItems = [
    { icon: "💬", label: "WhatsApp Group", sub: "24 unread messages…" },
    { icon: "📊", label: "Google Sheets", sub: "participant_list_final_v3.xlsx" },
    { icon: "📘", label: "Facebook Post", sub: "Reach: 12 people • 2 comments" },
    { icon: "📧", label: "Email chains", sub: "RE: RE: RE: Tournament application" },
  ];

  const afterRows: Array<{ name: string; team: string; country: string; status: "new" | "accepted" | "pending" | "waitlist" }> = [
    { name: "Lucas Meyer",    team: "FC Eagles",  country: "🇩🇪 Germany",   status: "accepted" },
    { name: "Ivan Petrov",    team: "Spartak U14", country: "🇷🇺 Russia",    status: "new" },
    { name: "Carlos Ruiz",    team: "Valencia B",  country: "🇪🇸 Spain",     status: "accepted" },
    { name: "Adam Kowalski",  team: "Lech Youth",  country: "🇵🇱 Poland",    status: "pending" },
  ];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row", fontFamily: "Inter", position: "relative" }}>
      {/* BEFORE */}
      <div style={{ width: halfW, height: halfH, display: "flex", flexDirection: "column", background: "#1C2333", padding: pad, gap: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#EF4444", color: WHITE, fontSize: 13, fontWeight: 800, padding: "4px 12px", borderRadius: 999, display: "flex" }}>✕ BEFORE</div>
          <div style={{ fontSize: 18, color: MUTED, display: "flex" }}>Managing applications</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {beforeItems.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0F172A", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 24, display: "flex", width: 36, alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#CBD5E1", display: "flex" }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "#64748B", display: "flex" }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16, color: "#EF444470", marginTop: 4, display: "flex" }}>Scattered. Slow. Losing participants.</div>
      </div>

      {/* AFTER */}
      <div style={{ width: halfW, height: halfH, display: "flex", flexDirection: "column", background: NIGHT, padding: pad, gap: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: PITCH, color: NIGHT, fontSize: 13, fontWeight: 800, padding: "4px 12px", borderRadius: 999, display: "flex" }}>✓ AFTER</div>
          <div style={{ fontSize: 18, color: MUTED, display: "flex" }}>footballevents.eu dashboard</div>
        </div>
        {/* mini stats */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: NIGHT2, borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>Applications</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: WHITE, fontFamily: "Bebas Neue", display: "flex" }}>142</div>
            <div style={{ fontSize: 11, color: PITCH, display: "flex" }}>↑ 34% this week</div>
          </div>
          <div style={{ flex: 1, background: NIGHT2, borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>Countries</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: PITCH, fontFamily: "Bebas Neue", display: "flex" }}>12</div>
            <div style={{ fontSize: 11, color: MUTED, display: "flex" }}>active regions</div>
          </div>
        </div>
        {/* application rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {afterRows.map((r) => <AppRow key={r.name} {...r} />)}
        </div>
        <div style={{ fontSize: 14, color: `${PITCH}90`, marginTop: 2, display: "flex" }}>Real-time · Auto-notifications · No missed leads</div>
      </div>

      {/* CENTER HEADLINE STRIP */}
      <div style={{
        position: "absolute",
        [isPortrait ? "top" : "left"]: isPortrait ? halfH - 52 : halfW - 96,
        left: isPortrait ? 0 : undefined,
        right: isPortrait ? 0 : undefined,
        top: isPortrait ? undefined : 0,
        bottom: isPortrait ? undefined : 0,
        width: isPortrait ? width : 192,
        height: isPortrait ? 104 : height,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: PITCH2, padding: "0 24px", gap: 10,
      }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, color: WHITE, textAlign: "center", lineHeight: 1.05, display: "flex", flexWrap: "wrap", justifyContent: "center" }}>{headline}</div>
        <div style={{ background: WHITE, color: PITCH2, fontSize: 18, fontWeight: 700, padding: "8px 20px", borderRadius: 999, display: "flex" }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
function Card({ headline, sub, body, cta, width, height, themeId }: {
  headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 64 : 72;
  const titleSize = isPortrait ? 68 : 56;
  const bullets = body.includes(" · ") ? body.split(" · ").map(s => s.trim()) : [body];

  const isBoosting  = themeId === 5;
  const isVerified  = themeId === 11;
  const isLaunch    = themeId === 20;
  const isFreeStart = themeId === 15;
  const isSharingKit = themeId === 19;
  const accent = isLaunch ? "#F59E0B" : PITCH;

  // Mockup content per theme
  const Mockup = () => {
    if (isBoosting) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { name: "Basic", price: "€5", desc: "7 days bumped in listings", highlight: false },
          { name: "Featured", price: "€19", desc: "14 days at category top + badge", highlight: false },
          { name: "Premium", price: "€59", desc: "Homepage hero carousel + gold border", highlight: true },
        ].map((b) => (
          <div key={b.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: b.highlight ? `${PITCH}12` : "#F1F5F9", borderRadius: 14, padding: "14px 18px", border: `1px solid ${b.highlight ? PITCH : BORDER}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, display: "flex" }}>{b.name} Boost</div>
              <div style={{ fontSize: 13, color: "#64748B", display: "flex" }}>{b.desc}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: b.highlight ? PITCH : PITCH2, display: "flex" }}>{b.price}</div>
          </div>
        ))}
        <EventCard title="U14 Tournament Madrid" subtitle="TOURNAMENT" date="Jun 15" city="Madrid" price="from €120" featured />
      </div>
    );

    if (isVerified) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OrganizerCard name="FC Academy Madrid" tier="PRO" events={8} followers={312} verified />
        <OrganizerCard name="Baltic Cup Organisation" tier="PREMIUM" events={14} followers={891} verified />
        <div style={{ display: "flex", flexDirection: "column", background: "#F1F5F9", borderRadius: 14, border: `1px solid ${BORDER}`, padding: "12px 16px", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E2E8F0", display: "flex" }} />
            <div style={{ fontSize: 15, color: "#94A3B8", display: "flex" }}>New organizer</div>
            <div style={{ background: "#E2E8F0", color: "#94A3B8", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999, display: "flex" }}>NOT VERIFIED</div>
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", display: "flex" }}>Lower trust → fewer applications</div>
        </div>
      </div>
    );

    if (isFreeStart) return (
      <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", gap: 12, alignItems: isPortrait ? "stretch" : "flex-start" }}>
        {[
          { step: "1", icon: "🧑‍💼", title: "Create profile", time: "2 min", color: NIGHT },
          { step: "2", icon: "📋", title: "Publish event", time: "5 min", color: PITCH2 },
          { step: "3", icon: "📨", title: "Get applications", time: "Auto", color: PITCH },
        ].map((s, i) => (
          <div key={s.step} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, background: i === 2 ? `${PITCH}10` : "#F1F5F9", borderRadius: 16, padding: "16px 18px", border: `1px solid ${i === 2 ? PITCH : BORDER}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: WHITE, fontWeight: 800 }}>{s.step}</div>
            <div style={{ fontSize: 28, display: "flex" }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, display: "flex" }}>{s.title}</div>
            <div style={{ fontSize: 13, color: i === 2 ? PITCH2 : "#64748B", fontWeight: 600, display: "flex" }}>{s.time}</div>
          </div>
        ))}
      </div>
    );

    if (isSharingKit) return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <PhoneMockup>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${PITCH2}, #065f46)`, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "10px 12px", gap: 4 }}>
            <div style={{ fontSize: 12, color: `${WHITE}90`, display: "flex" }}>footballevents.eu</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, display: "flex" }}>U14 Summer Cup</div>
            <div style={{ fontSize: 12, color: `${WHITE}80`, display: "flex" }}>Jun 15–18 · Madrid</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <div style={{ background: PITCH, color: WHITE, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, display: "flex" }}>📥 Download</div>
            <div style={{ background: "#1877F2", color: WHITE, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, display: "flex" }}>Facebook</div>
            <div style={{ background: "#E1306C", color: WHITE, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, display: "flex" }}>Instagram</div>
          </div>
        </PhoneMockup>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, display: "flex" }}>Generated formats</div>
          {["Post 1080×1350", "Story 1080×1920", "Landscape 1920×1080"].map((f, i) => (
            <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F1F5F9", borderRadius: 10, padding: "8px 12px", border: `1px solid ${i === 0 ? PITCH : BORDER}` }}>
              <div style={{ fontSize: 13, color: TEXT, display: "flex" }}>{f}</div>
              <div style={{ fontSize: 12, color: PITCH2, fontWeight: 700, display: "flex" }}>↓</div>
            </div>
          ))}
          <div style={{ background: `${PITCH}15`, color: PITCH2, fontSize: 12, fontWeight: 700, padding: "8px 12px", borderRadius: 10, display: "flex" }}>✨ Premium feature</div>
        </div>
      </div>
    );

    if (isLaunch) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["25 active events", "YouTube / Vimeo embed in hero", "Featured homepage carousel", "Social sharing kit", "Dedicated account manager", "3 free boosts / month"].map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: NIGHT, fontWeight: 800, flexShrink: 0 }}>✓</div>
            <div style={{ fontSize: isPortrait ? 20 : 17, color: TEXT, display: "flex" }}>{item}</div>
          </div>
        ))}
        <div style={{ background: "#FEF3C7", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 24, display: "flex" }}>⏳</div>
          <div style={{ fontSize: 15, color: "#92400E", fontWeight: 700, display: "flex" }}>Only {50} spots available · No credit card required</div>
        </div>
      </div>
    );

    // Default: bullets + small event card
    return (
      <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: accent, display: "flex", flexShrink: 0 }} />
              <div style={{ fontSize: isPortrait ? 20 : 17, color: "#334155", display: "flex" }}>{b}</div>
            </div>
          ))}
        </div>
        {!isPortrait && (
          <div style={{ width: 260, display: "flex" }}>
            <EventCard title="U14 Tournament" subtitle="TOURNAMENT" date="Jun 15–18" city="Madrid" price="from €120" featured />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: LIGHT, fontFamily: "Inter", position: "relative", overflow: "hidden" }}>
      <div style={{ width: "100%", height: 6, background: `linear-gradient(90deg, ${accent}, ${PITCH2})`, display: "flex" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: isPortrait ? 28 : 22 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <LogoBar light />
          {isLaunch && <div style={{ background: "#FEF3C7", color: "#92400E", fontSize: 15, fontWeight: 800, padding: "6px 14px", borderRadius: 999, display: "flex" }}>🎉 LAUNCH</div>}
          {isVerified && <div style={{ background: `${PITCH}15`, color: PITCH2, fontSize: 15, fontWeight: 800, padding: "6px 14px", borderRadius: 999, display: "flex" }}>✓ Trust = Conversions</div>}
        </div>
        {/* sub */}
        <div style={{ fontSize: isPortrait ? 24 : 20, fontWeight: 700, color: accent, display: "flex" }}>{sub}</div>
        {/* headline */}
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: TEXT, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        {/* mockup */}
        <Mockup />
        <div style={{ flex: 1 }} />
        {/* CTA */}
        <div style={{ display: "flex", alignSelf: "flex-start", background: accent, color: isLaunch ? "#000" : NIGHT, fontSize: isPortrait ? 26 : 22, fontWeight: 700, padding: isPortrait ? "16px 36px" : "12px 28px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── STATS (dashboard) ────────────────────────────────────────────────────────
function Stats({ headline, sub, cta, width, height, themeId }: {
  headline: string; sub: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 56 : 60;
  const titleSize = isPortrait ? 60 : 52;

  const isAnalytics = themeId === 9;
  const isEnterprise = themeId === 18;

  const statsData = isAnalytics
    ? [{ label: "Page views", value: "2,847", sub: "↑ 34%", accent: false },
       { label: "Applications", value: "142", sub: "↑ 22%", accent: true },
       { label: "Acceptance", value: "78%", sub: "↑ 12pp", accent: false },
       { label: "Countries", value: "12", sub: "reached", accent: false }]
    : isEnterprise
    ? [{ label: "Events managed", value: "200+", sub: "unlimited", accent: false },
       { label: "API calls / day", value: "50k+", sub: "full access", accent: true },
       { label: "Boost discount", value: "50%", sub: "all types", accent: false },
       { label: "Moderation SLA", value: "1h", sub: "guaranteed", accent: false }]
    : [{ label: "Tournaments", value: "500+", sub: "worldwide", accent: false },
       { label: "Organizers", value: "200+", sub: "verified", accent: true },
       { label: "Countries", value: "50+", sub: "covered", accent: false },
       { label: "Events live", value: "1k+", sub: "right now", accent: false }];

  const appRows: Array<{ name: string; team: string; country: string; status: "new" | "accepted" | "pending" | "waitlist" }> = [
    { name: "Lucas Meyer",   team: "FC Eagles",    country: "🇩🇪 Germany",  status: "accepted" },
    { name: "Ivan Petrov",   team: "Spartak U14",  country: "🇷🇺 Russia",   status: "new" },
    { name: "Carlos Ruiz",   team: "Valencia B",   country: "🇪🇸 Spain",    status: "accepted" },
    { name: "Adam Kowalski", team: "Lech Youth",   country: "🇵🇱 Poland",   status: "pending" },
    { name: "Ali Hassan",    team: "Dubai FC",     country: "🇦🇪 UAE",      status: "waitlist" },
  ];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row", background: NIGHT, fontFamily: "Inter", color: WHITE, overflow: "hidden" }}>
      {/* sidebar */}
      <div style={{ width: isPortrait ? width : 340, height: isPortrait ? 220 : height, background: `linear-gradient(145deg, ${PITCH2}, #064E3B)`, display: "flex", flexDirection: "column", padding: pad, justifyContent: "center", gap: 16 }}>
        <LogoBar />
        <div style={{ fontFamily: "Bebas Neue", fontSize: isPortrait ? 44 : titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <div style={{ fontSize: 18, color: `${WHITE}CC`, display: "flex" }}>{sub}</div>
      </div>

      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: 18, overflow: "hidden" }}>
        {/* stats grid */}
        <div style={{ display: "flex", gap: 12 }}>
          {statsData.map((s) => <StatBox key={s.label} {...s} />)}
        </div>

        {/* application rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 14, color: MUTED, fontWeight: 600, marginBottom: 2, display: "flex" }}>
            {isAnalytics ? "Recent applications" : isEnterprise ? "Managed organizers" : "Active on platform"}
          </div>
          {isEnterprise
            ? [
                { name: "Baltic Cup Organisation", tier: "ENTERPRISE", country: "🇪🇪 Estonia", events: 14 },
                { name: "FC Academy Madrid",        tier: "PREMIUM",    country: "🇪🇸 Spain",   events: 8 },
                { name: "Warsaw Football League",   tier: "PRO",        country: "🇵🇱 Poland",  events: 22 },
              ].map((o) => (
                <div key={o.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: NIGHT2, borderRadius: 12, padding: "10px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: WHITE, display: "flex" }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, display: "flex" }}>{o.country} · {o.events} events</div>
                  </div>
                  <Badge label={o.tier} color={o.tier === "ENTERPRISE" ? "#F59E0B" : o.tier === "PREMIUM" ? PITCH : MUTED} bg={`${PITCH}15`} />
                </div>
              ))
            : appRows.slice(0, isPortrait ? 3 : 5).map((r) => <AppRow key={r.name} {...r} />)
          }
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT, fontSize: 20, fontWeight: 700, padding: "12px 28px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── WORLD ────────────────────────────────────────────────────────────────────
function World({ headline, body, cta, width, height, themeId }: {
  headline: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 64 : 72;
  const titleSize = isPortrait ? 76 : 66;
  const isFreeForAll = themeId === 17;

  const dots = [
    [0.12, 0.35], [0.18, 0.27], [0.22, 0.38], [0.27, 0.44], [0.33, 0.52],
    [0.45, 0.28], [0.48, 0.34], [0.52, 0.30], [0.55, 0.36], [0.58, 0.40],
    [0.62, 0.27], [0.65, 0.33], [0.70, 0.38], [0.75, 0.42], [0.82, 0.46],
    [0.50, 0.58], [0.42, 0.62], [0.55, 0.68], [0.78, 0.60], [0.86, 0.36],
  ];

  const bubbles = [
    { x: 0.52, y: 0.30, label: "127 events", country: "🇪🇸" },
    { x: 0.49, y: 0.27, label: "89 events", country: "🇩🇪" },
    { x: 0.44, y: 0.32, label: "43 events", country: "🇬🇧" },
    { x: 0.62, y: 0.30, label: "61 events", country: "🇷🇺" },
    { x: 0.75, y: 0.40, label: "28 events", country: "🇦🇪" },
  ];

  return (
    <div style={{ width, height, display: "flex", position: "relative", background: `linear-gradient(180deg, ${NIGHT} 0%, #0D2240 100%)`, fontFamily: "Inter", color: WHITE, overflow: "hidden" }}>
      {/* network */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
        {dots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x * width} cy={y * height} r={5} fill={PITCH} opacity={0.9} />
            <circle cx={x * width} cy={y * height} r={16} fill={PITCH} opacity={0.12} />
            {i < dots.length - 1 && (
              <line x1={x * width} y1={y * height} x2={dots[i + 1][0] * width} y2={dots[i + 1][1] * height} stroke={PITCH} strokeWidth={1} opacity={0.18} />
            )}
          </g>
        ))}
      </svg>

      {/* event count bubbles on map */}
      {bubbles.map((b) => (
        <div key={b.label} style={{ position: "absolute", left: b.x * width - 50, top: b.y * height - 18, display: "flex", background: `${NIGHT}E0`, border: `1px solid ${PITCH}60`, borderRadius: 20, padding: "4px 10px", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 14, display: "flex" }}>{b.country}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: PITCH, display: "flex" }}>{b.label}</span>
        </div>
      ))}

      {/* gradient overlay bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.6, display: "flex", background: `linear-gradient(0deg, ${NIGHT}F5 0%, ${NIGHT}80 50%, transparent 100%)` }} />

      {/* logo */}
      <div style={{ position: "absolute", top: pad, left: pad, display: "flex" }}><LogoBar /></div>

      {/* bottom content */}
      <div style={{ position: "absolute", bottom: pad, left: pad, right: pad, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* stat pills */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ background: PITCH, color: NIGHT, fontSize: 16, fontWeight: 800, padding: "7px 18px", borderRadius: 999, display: "flex" }}>50+ Countries</div>
          <div style={{ background: `${PITCH}20`, color: PITCH, fontSize: 16, fontWeight: 700, padding: "7px 18px", borderRadius: 999, border: `1px solid ${PITCH}40`, display: "flex" }}>1,000+ Events</div>
          <div style={{ background: `${WHITE}10`, color: WHITE, fontSize: 16, fontWeight: 700, padding: "7px 18px", borderRadius: 999, border: `1px solid ${WHITE}20`, display: "flex" }}>200+ Organizers</div>
        </div>

        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap", maxWidth: "85%" }}>{headline}</div>

        {isFreeForAll ? (
          // free for all: show search bar mockup
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
            <SearchBar placeholder="Search tournaments, camps, cities…" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["🏆 Tournaments", "⛺ Camps", "🎪 Festivals", "🎓 Trials", "🚌 Match Tours"].map((f) => (
                <FilterChip key={f} label={f} active={f.startsWith("🏆")} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: isPortrait ? 24 : 20, color: MUTED, display: "flex", maxWidth: "80%" }}>{body}</div>
        )}

        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT, fontSize: isPortrait ? 24 : 20, fontWeight: 700, padding: isPortrait ? "14px 32px" : "12px 26px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

// ─── QUOTE ────────────────────────────────────────────────────────────────────
function Quote({ headline, sub, body, cta, width, height, themeId }: {
  headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number;
}) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 64 : 72;
  const titleSize = isPortrait ? 68 : 58;

  const isParents   = themeId === 6;
  const isFestivals = themeId === 10;
  const isSummer    = themeId === 13;
  const isTraining  = themeId === 14;

  const bgGrad = isFestivals
    ? `linear-gradient(145deg, #1E1B4B 0%, #312E81 100%)`
    : isTraining
    ? `linear-gradient(145deg, #0C1A2E 0%, #1E3A5F 100%)`
    : `linear-gradient(145deg, ${NIGHT} 0%, #0F2740 100%)`;

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row", background: bgGrad, fontFamily: "Inter", color: WHITE, position: "relative", overflow: "hidden" }}>
      {/* decorative */}
      <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", border: `2px solid ${PITCH}25`, display: "flex" }} />
      <div style={{ position: "absolute", top: -40, right: -40, width: 240, height: 240, borderRadius: "50%", border: `2px solid ${PITCH}15`, display: "flex" }} />

      {/* left / top: text content */}
      <div style={{ flex: isPortrait ? "none" : 1, display: "flex", flexDirection: "column", gap: isPortrait ? 24 : 28, padding: pad }}>
        <LogoBar />
        <div style={{ fontSize: isPortrait ? 24 : 20, color: PITCH, fontWeight: 700, display: "flex" }}>{sub}</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>

        {isParents && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["✓ Verified organizers", "✓ Full programme & coach info", "✓ Reviews from other parents", "✓ Free to search & apply"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: isPortrait ? 24 : 20, color: `${WHITE}CC` }}>{item}</div>
            ))}
          </div>
        )}

        {isTraining && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["🇪🇸 Spain", "🇵🇹 Portugal", "🇹🇷 Turkey", "🇦🇪 UAE", "🇩🇪 Germany", "🇭🇷 Croatia"].map((d) => (
              <div key={d} style={{ background: `${WHITE}15`, color: WHITE, fontSize: 18, fontWeight: 600, padding: "8px 16px", borderRadius: 999, border: `1px solid ${WHITE}25`, display: "flex" }}>{d}</div>
            ))}
          </div>
        )}

        {body && (
          <div style={{ background: `${WHITE}10`, borderLeft: `4px solid ${PITCH}`, borderRadius: "0 14px 14px 0", padding: "16px 20px", fontSize: isPortrait ? 22 : 18, color: `${WHITE}CC`, lineHeight: 1.5, fontStyle: "italic", display: "flex" }}>
            {body}
          </div>
        )}

        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT, fontSize: isPortrait ? 24 : 20, fontWeight: 700, padding: isPortrait ? "14px 32px" : "12px 26px", borderRadius: 999 }}>{cta}</div>
      </div>

      {/* right / bottom: mockup cards */}
      {!isPortrait && (
        <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 12, padding: `${pad}px ${pad}px ${pad}px 0`, justifyContent: "center" }}>
          {isParents || isSummer ? (
            <>
              <EventCard title="Football Camp Spain" subtitle="CAMP" date="Jul 7–14" city="Malaga, ES" price="from €890" featured />
              <EventCard title="Summer Academy U12" subtitle="CAMP" date="Aug 3–10" city="Barcelona" price="from €720" dark />
            </>
          ) : isTraining ? (
            <>
              <EventCard title="Pre-Season Camp 2025" subtitle="TRAINING" date="Jan 20–26" city="Antalya, TR" price="from €650" featured />
              <EventCard title="Tactical Preparation" subtitle="TRAINING" date="Feb 10–14" city="Algarve, PT" price="from €480" dark />
            </>
          ) : isFestivals ? (
            <>
              <EventCard title="Barcelona Street Cup" subtitle="FESTIVAL" date="Jun 21–23" city="Barcelona" price="FREE" featured />
              <EventCard title="Beach Soccer Fest" subtitle="FESTIVAL" date="Jul 5–7" city="Alicante, ES" price="from €30" dark />
            </>
          ) : null}
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

  const url    = new URL(req.url);
  const themeId = parseInt(url.searchParams.get("theme") ?? "1", 10);
  const lang    = (url.searchParams.get("lang") ?? "en") as AdLang;
  const format  = (url.searchParams.get("format") ?? "portrait") as AdFormat;

  const theme = AD_THEMES.find((t) => t.id === themeId);
  if (!theme) return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  if (!(format in SIZES)) return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  const { width, height } = SIZES[format];
  const { headline, sub, body, cta } = theme.content[lang] ?? theme.content.en;
  const fonts = await getSocialImageFonts();
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
