import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSocialImageFonts } from "@/lib/social-image-fonts";
import { AD_THEMES, SIZES, type AdLang, type AdFormat } from "@/lib/promotion-ad-themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NIGHT_BG = "#0A1628";
const PITCH    = "#10B981";
const PITCH_D  = "#047857";
const WHITE    = "#FFFFFF";
const MUTED    = "#94A3B8";
const SURFACE  = "#F8FAFC";
const BORDER   = "#E2E8F0";

// ─── visual templates ────────────────────────────────────────────────────────

function Cinematic({
  headline, sub, body, cta,
  width, height,
}: { headline: string; sub: string; body: string; cta: string; width: number; height: number }) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 72 : 80;
  const titleSize = height >= 1900 ? 96 : isPortrait ? 80 : 72;
  const subSize = isPortrait ? 32 : 28;

  return (
    <div style={{ width, height, display: "flex", position: "relative", background: `linear-gradient(145deg, ${NIGHT_BG} 0%, #0F1F38 55%, ${PITCH_D} 100%)`, color: WHITE, fontFamily: "Inter" }}>
      {/* pitch lines overlay */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0, opacity: 0.08, display: "flex" }}>
        <rect x={width * 0.05} y={height * 0.05} width={width * 0.9} height={height * 0.9} fill="none" stroke={WHITE} strokeWidth="3" />
        {isPortrait
          ? <line x1={width * 0.05} y1={height / 2} x2={width * 0.95} y2={height / 2} stroke={WHITE} strokeWidth="2" />
          : <line x1={width / 2} y1={height * 0.05} x2={width / 2} y2={height * 0.95} stroke={WHITE} strokeWidth="2" />
        }
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.12} fill="none" stroke={WHITE} strokeWidth="2" />
        <circle cx={width / 2} cy={height / 2} r={6} fill={WHITE} />
      </svg>

      {/* green bottom accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.06, display: "flex", background: `linear-gradient(0deg, ${PITCH_D}CC 0%, transparent 100%)` }} />

      {/* logo bar */}
      <div style={{ position: "absolute", top: pad, left: pad, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 10, height: 48, background: PITCH, borderRadius: 4, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: WHITE }}>footballevents.eu</div>
          <div style={{ fontSize: 14, color: MUTED }}>International football events catalog</div>
        </div>
      </div>

      {/* content block */}
      <div style={{ position: "absolute", bottom: pad, left: pad, right: pad, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: subSize, color: PITCH, fontWeight: 700, letterSpacing: 1 }}>{sub}</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1, color: WHITE, maxWidth: width * 0.85, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <div style={{ fontSize: isPortrait ? 26 : 22, color: MUTED, maxWidth: width * 0.75, display: "flex" }}>{body}</div>
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT_BG, fontSize: isPortrait ? 28 : 24, fontWeight: 700, padding: isPortrait ? "18px 36px" : "14px 28px", borderRadius: 999 }}>
          {cta}
        </div>
      </div>
    </div>
  );
}

function Split({
  headline, sub, cta,
  width, height,
}: { headline: string; sub: string; cta: string; width: number; height: number }) {
  const isPortrait = height >= width;
  const titleSize = isPortrait ? 68 : 56;
  const pad = 60;
  const halfW = isPortrait ? width : width / 2;
  const halfH = isPortrait ? height / 2 : height;

  // "before" panel items
  const beforeItems = ["Facebook Group", "Google Sheets", "WhatsApp Chat", "Email chains"];
  // "after" panel stats
  const afterStats = [{ label: "Applications", value: "142", up: true }, { label: "Accepted", value: "78%", up: true }, { label: "Countries", value: "12", up: true }];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row", fontFamily: "Inter" }}>
      {/* Before */}
      <div style={{ width: halfW, height: halfH, display: "flex", flexDirection: "column", background: "#1E293B", padding: pad, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 16, left: 16, background: "#EF4444", color: WHITE, fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 4, display: "flex" }}>BEFORE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 48, flex: 1, justifyContent: "center" }}>
          {beforeItems.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, background: "#0F172A", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#EF4444", display: "flex", flexShrink: 0 }} />
              <div style={{ fontSize: 22, color: "#94A3B8", display: "flex" }}>{item}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, color: "#EF444466", marginTop: 20, display: "flex" }}>❌  Messy. Slow. Fragmented.</div>
      </div>

      {/* After */}
      <div style={{ width: halfW, height: halfH, display: "flex", flexDirection: "column", background: NIGHT_BG, padding: pad, position: "relative" }}>
        <div style={{ position: "absolute", top: 16, left: 16, background: PITCH, color: NIGHT_BG, fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 4, display: "flex" }}>AFTER</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 48, flex: 1, justifyContent: "center" }}>
          {afterStats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0F1F36", borderRadius: 10, padding: "14px 18px", border: `1px solid ${PITCH}33` }}>
              <div style={{ fontSize: 20, color: MUTED, display: "flex" }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: PITCH, display: "flex" }}>{s.value} ↑</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, color: `${PITCH}99`, marginTop: 20, display: "flex" }}>✓  Clean. Fast. Professional.</div>
      </div>

      {/* Center overlay band */}
      <div style={{ position: "absolute", [isPortrait ? "top" : "left"]: isPortrait ? halfH - 60 : halfW - 80, [isPortrait ? "left" : "top"]: 0, [isPortrait ? "right" : "bottom"]: 0, height: isPortrait ? 120 : undefined, width: isPortrait ? undefined : 160, display: "flex", alignItems: "center", justifyContent: "center", background: PITCH_D, flexDirection: "column", padding: "0 24px", gap: 8 }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, color: WHITE, textAlign: "center", lineHeight: 1.05, display: "flex", flexWrap: "wrap", justifyContent: "center" }}>{headline}</div>
        <div style={{ fontSize: 18, color: `${WHITE}CC`, textAlign: "center", display: "flex" }}>{sub}</div>
        <div style={{ background: WHITE, color: PITCH_D, fontSize: 20, fontWeight: 700, padding: "10px 24px", borderRadius: 999, display: "flex", marginTop: 8 }}>{cta}</div>
      </div>
    </div>
  );
}

function Card({
  headline, sub, body, cta,
  width, height, themeId,
}: { headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number }) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 72 : 80;
  const titleSize = isPortrait ? 72 : 60;
  const subSize = isPortrait ? 26 : 22;
  const bodySize = isPortrait ? 28 : 24;

  // parse body into bullets if it contains " · "
  const bullets = body.includes(" · ") ? body.split(" · ") : null;

  // special mockup elements per theme
  const isBoosting = themeId === 5;
  const isPricing = themeId === 4;
  const isLaunch = themeId === 20;
  const isVerified = themeId === 11;

  const accentColor = isLaunch ? "#F59E0B" : PITCH;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: SURFACE, fontFamily: "Inter", position: "relative", overflow: "hidden" }}>
      {/* top color bar */}
      <div style={{ width, height: 8, background: `linear-gradient(90deg, ${accentColor}, ${PITCH_D})`, display: "flex" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: isPortrait ? 36 : 28 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 6, height: 32, background: accentColor, borderRadius: 3, display: "flex" }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "#64748B" }}>footballevents.eu</div>
          </div>
          {isLaunch && <div style={{ background: "#FEF3C7", color: "#92400E", fontSize: 16, fontWeight: 700, padding: "6px 14px", borderRadius: 999, display: "flex" }}>🎉 LAUNCH OFFER</div>}
          {isPricing && <div style={{ background: `${PITCH}20`, color: PITCH_D, fontSize: 16, fontWeight: 700, padding: "6px 14px", borderRadius: 999, display: "flex" }}>Most Popular</div>}
          {isVerified && <div style={{ background: `${PITCH}20`, color: PITCH_D, fontSize: 16, fontWeight: 700, padding: "6px 14px", borderRadius: 999, display: "flex" }}>✓ Verified</div>}
        </div>

        {/* sub label */}
        <div style={{ fontSize: subSize, fontWeight: 700, color: accentColor, letterSpacing: 0.5, display: "flex" }}>{sub}</div>

        {/* headline */}
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: "#0F172A", display: "flex", flexWrap: "wrap" }}>{headline}</div>

        {/* body or bullets */}
        {bullets ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {bullets.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: accentColor, display: "flex", flexShrink: 0 }} />
                <div style={{ fontSize: bodySize, color: "#334155", display: "flex" }}>{b.trim()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: bodySize, color: "#475569", lineHeight: 1.5, display: "flex" }}>{body}</div>
        )}

        {/* boost tiers mockup */}
        {isBoosting && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {[["Basic", "€5", "7 days bumped"], ["Featured", "€19", "14 days at top + badge"], ["Premium", "€59", "Homepage carousel + gold"]].map(([name, price, desc], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 2 ? `${accentColor}15` : WHITE, borderRadius: 12, padding: "14px 20px", border: `1px solid ${i === 2 ? accentColor : BORDER}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", display: "flex" }}>{name}</div>
                  <div style={{ fontSize: 16, color: "#64748B", display: "flex" }}>{desc}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: i === 2 ? accentColor : PITCH_D, display: "flex" }}>{price}</div>
              </div>
            ))}
          </div>
        )}

        {/* launch checklist */}
        {isLaunch && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {["25 active events", "YouTube/Vimeo embed", "Featured homepage carousel", "Social sharing kit", "Dedicated account manager"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: NIGHT_BG, fontWeight: 700 }}>✓</div>
                <div style={{ fontSize: bodySize, color: "#334155", display: "flex" }}>{item}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* CTA */}
        <div style={{ display: "flex", alignSelf: "flex-start", background: accentColor, color: isLaunch ? "#000" : NIGHT_BG, fontSize: isPortrait ? 28 : 24, fontWeight: 700, padding: isPortrait ? "18px 40px" : "14px 32px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

function Stats({
  headline, sub, body, cta,
  width, height, themeId,
}: { headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number }) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 56 : 60;
  const titleSize = isPortrait ? 64 : 52;

  const isAnalytics = themeId === 9;
  const isClubs = themeId === 12;
  const isEnterprise = themeId === 18;

  const statsData = isAnalytics
    ? [{ label: "Views", value: "2,847", trend: "↑ 34%" }, { label: "Applications", value: "142", trend: "↑ 22%" }, { label: "Acceptance", value: "78%", trend: "↑ 12%" }, { label: "Countries", value: "12", trend: "↑ 3" }]
    : isClubs
    ? [{ label: "Tournaments", value: "50+", trend: "countries" }, { label: "Camps", value: "200+", trend: "verified" }, { label: "Trials", value: "1,000+", trend: "events" }, { label: "Organizers", value: "200+", trend: "platform" }]
    : [{ label: "Boosts included", value: "10×", trend: "/month" }, { label: "Boost discount", value: "50%", trend: "off" }, { label: "Moderation SLA", value: "1h", trend: "response" }, { label: "Active events", value: "25+", trend: "by agreement" }];

  return (
    <div style={{ width, height, display: "flex", flexDirection: isPortrait ? "column" : "row", background: NIGHT_BG, fontFamily: "Inter", color: WHITE, overflow: "hidden" }}>
      {/* sidebar */}
      <div style={{ width: isPortrait ? width : 360, height: isPortrait ? 220 : height, background: `linear-gradient(135deg, ${PITCH_D}, #064E3B)`, display: "flex", flexDirection: "column", padding: pad, justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 18, color: `${WHITE}99`, fontWeight: 600, display: "flex" }}>footballevents.eu</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: isPortrait ? 48 : titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <div style={{ fontSize: 20, color: `${WHITE}CC`, display: "flex" }}>{sub}</div>
      </div>

      {/* content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad, gap: isPortrait ? 28 : 32 }}>
        {/* stats grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {statsData.map((s) => (
            <div key={s.label} style={{ flex: "1 1 40%", background: "#0F1F36", borderRadius: 14, padding: "20px 24px", border: `1px solid ${PITCH}33`, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 16, color: MUTED, display: "flex" }}>{s.label}</div>
              <div style={{ fontSize: 38, fontWeight: 700, color: PITCH, fontFamily: "Bebas Neue", display: "flex" }}>{s.value}</div>
              <div style={{ fontSize: 14, color: `${PITCH}99`, display: "flex" }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* body */}
        <div style={{ fontSize: 22, color: MUTED, lineHeight: 1.5, display: "flex" }}>{body}</div>

        {/* CTA */}
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT_BG, fontSize: 22, fontWeight: 700, padding: "14px 32px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

function World({
  headline, sub, body, cta,
  width, height,
}: { headline: string; sub: string; body: string; cta: string; width: number; height: number }) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 72 : 80;
  const titleSize = isPortrait ? 80 : 68;

  // simplified world dots (major football nations)
  const dots = [
    [0.12, 0.38], [0.19, 0.27], [0.22, 0.35], [0.26, 0.42], [0.32, 0.55],
    [0.45, 0.30], [0.48, 0.35], [0.52, 0.32], [0.55, 0.38], [0.58, 0.42],
    [0.62, 0.28], [0.65, 0.35], [0.70, 0.40], [0.75, 0.45], [0.80, 0.50],
    [0.50, 0.60], [0.42, 0.65], [0.55, 0.70], [0.78, 0.62], [0.85, 0.38],
  ];

  return (
    <div style={{ width, height, display: "flex", position: "relative", background: `linear-gradient(180deg, ${NIGHT_BG} 0%, #0D2240 100%)`, fontFamily: "Inter", color: WHITE, overflow: "hidden" }}>
      {/* network dots SVG */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", top: 0, left: 0, display: "flex" }}>
        {dots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x * width} cy={y * height} r={6} fill={PITCH} opacity={0.9} />
            <circle cx={x * width} cy={y * height} r={18} fill={PITCH} opacity={0.15} />
            {i < dots.length - 1 && (
              <line x1={x * width} y1={y * height} x2={dots[i + 1][0] * width} y2={dots[i + 1][1] * height} stroke={PITCH} strokeWidth={1} opacity={0.2} />
            )}
          </g>
        ))}
      </svg>

      {/* gradient overlay for readability */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.65, display: "flex", background: `linear-gradient(0deg, ${NIGHT_BG}F0 0%, ${NIGHT_BG}60 60%, transparent 100%)` }} />

      {/* logo */}
      <div style={{ position: "absolute", top: pad, left: pad, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 8, height: 40, background: PITCH, borderRadius: 4, display: "flex" }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: WHITE }}>footballevents.eu</div>
      </div>

      {/* content */}
      <div style={{ position: "absolute", bottom: pad, left: pad, right: pad, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: PITCH, color: NIGHT_BG, fontSize: 18, fontWeight: 700, padding: "6px 16px", borderRadius: 999, display: "flex" }}>50+ Countries</div>
          <div style={{ background: `${PITCH}20`, color: PITCH, fontSize: 18, fontWeight: 700, padding: "6px 16px", borderRadius: 999, border: `1px solid ${PITCH}40`, display: "flex" }}>1,000+ Events</div>
        </div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>
        <div style={{ fontSize: isPortrait ? 26 : 22, color: MUTED, display: "flex" }}>{body}</div>
        <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT_BG, fontSize: isPortrait ? 26 : 22, fontWeight: 700, padding: isPortrait ? "16px 36px" : "12px 28px", borderRadius: 999 }}>{cta}</div>
      </div>
    </div>
  );
}

function Quote({
  headline, sub, body, cta,
  width, height, themeId,
}: { headline: string; sub: string; body: string; cta: string; width: number; height: number; themeId: number }) {
  const isPortrait = height >= width;
  const pad = isPortrait ? 72 : 80;
  const titleSize = isPortrait ? 76 : 62;

  const isParents = themeId === 6;
  const isFestivals = themeId === 10;
  const isSummer = themeId === 13;
  const isTraining = themeId === 14;

  const accentBg = isFestivals
    ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)"
    : isTraining
    ? "linear-gradient(135deg, #0C1A2E 0%, #1E3A5F 100%)"
    : `linear-gradient(135deg, ${NIGHT_BG} 0%, #0F2740 100%)`;

  // destination tags for training camps
  const destinations = isTraining ? ["🇪🇸 Spain", "🇵🇹 Portugal", "🇹🇷 Turkey", "🇦🇪 UAE", "🇩🇪 Germany"] : null;
  // trust icons for parents
  const trustItems = isParents ? ["✓ Verified organizers", "✓ Full programme & coach info", "✓ Reviews from parents", "✓ Free to search & apply"] : null;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: accentBg, fontFamily: "Inter", color: WHITE, padding: pad, gap: isPortrait ? 36 : 28, position: "relative", overflow: "hidden" }}>
      {/* decorative circle */}
      <div style={{ position: "absolute", top: -height * 0.15, right: -width * 0.15, width: Math.min(width, height) * 0.7, height: Math.min(width, height) * 0.7, borderRadius: "50%", border: `2px solid ${PITCH}30`, display: "flex" }} />
      <div style={{ position: "absolute", top: -height * 0.05, right: -width * 0.05, width: Math.min(width, height) * 0.45, height: Math.min(width, height) * 0.45, borderRadius: "50%", border: `2px solid ${PITCH}20`, display: "flex" }} />

      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 6, height: 28, background: PITCH, borderRadius: 3, display: "flex" }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: `${WHITE}CC` }}>footballevents.eu</div>
      </div>

      {/* sub label */}
      <div style={{ fontSize: isPortrait ? 26 : 22, color: PITCH, fontWeight: 700, display: "flex" }}>{sub}</div>

      {/* headline */}
      <div style={{ fontFamily: "Bebas Neue", fontSize: titleSize, lineHeight: 1.0, color: WHITE, display: "flex", flexWrap: "wrap" }}>{headline}</div>

      {/* trust items or destination tags */}
      {trustItems && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {trustItems.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: isPortrait ? 26 : 22, color: `${WHITE}CC` }}>{item}</div>
          ))}
        </div>
      )}
      {destinations && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {destinations.map((d) => (
            <div key={d} style={{ background: `${WHITE}15`, color: WHITE, fontSize: 20, fontWeight: 600, padding: "8px 18px", borderRadius: 999, display: "flex" }}>{d}</div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* quote block */}
      {body && (
        <div style={{ background: `${WHITE}10`, borderLeft: `4px solid ${PITCH}`, borderRadius: "0 12px 12px 0", padding: "20px 24px", fontSize: isPortrait ? 24 : 20, color: `${WHITE}CC`, lineHeight: 1.5, fontStyle: "italic", display: "flex" }}>
          {body}
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", alignSelf: "flex-start", background: PITCH, color: NIGHT_BG, fontSize: isPortrait ? 26 : 22, fontWeight: 700, padding: isPortrait ? "16px 36px" : "12px 28px", borderRadius: 999 }}>{cta}</div>
    </div>
  );
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.email !== "Goality360@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const themeId = parseInt(url.searchParams.get("theme") ?? "1", 10);
  const lang = (url.searchParams.get("lang") ?? "en") as AdLang;
  const format = (url.searchParams.get("format") ?? "portrait") as AdFormat;

  const theme = AD_THEMES.find((t) => t.id === themeId);
  if (!theme) return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  if (!(format in SIZES)) return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  const { width, height } = SIZES[format];
  const { headline, sub, body, cta } = theme.content[lang] ?? theme.content.en;
  const fonts = await getSocialImageFonts();

  const commonProps = { headline, sub, body, cta, width, height, themeId };

  let node: React.ReactElement;
  switch (theme.visual) {
    case "cinematic": node = <Cinematic {...commonProps} />; break;
    case "split":     node = <Split {...commonProps} />; break;
    case "card":      node = <Card {...commonProps} />; break;
    case "stats":     node = <Stats {...commonProps} />; break;
    case "world":     node = <World {...commonProps} />; break;
    case "quote":     node = <Quote {...commonProps} />; break;
    default:          node = <Cinematic {...commonProps} />;
  }

  const slug = `feu-theme${themeId}-${lang}-${format}`;

  return new ImageResponse(node, {
    width,
    height,
    fonts,
    headers: {
      "Content-Disposition": `attachment; filename="${slug}.jpg"`,
      "Cache-Control": "no-store",
    },
  });
}
