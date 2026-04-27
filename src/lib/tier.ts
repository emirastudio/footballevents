// Single source of truth for what each tier unlocks on the event/organizer pages.
// Mirrors the locked pricing matrix (memory: pricing_matrix.md).

export type Tier = "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE";

export type Feature =
  | "gallery"
  | "programme"
  | "faq"
  | "included"
  | "eventLogoInHero"      // ALL tiers get this
  | "platformApply"
  | "chat"
  | "fullSocials"
  | "verifiedBadge"
  | "followers"
  | "videoEmbed"
  | "featuredPlacement"
  | "customCta"
  | "noCompetitorAds"
  | "accountManager"
  | "apiRead"
  | "apiWrite"
  | "whiteLabel";

const RANK: Record<Tier, number> = { FREE: 0, PRO: 1, PREMIUM: 2, ENTERPRISE: 3 };

const MIN_TIER: Record<Feature, Tier> = {
  eventLogoInHero:    "FREE",
  gallery:            "FREE",
  programme:          "FREE",
  faq:                "PRO",
  included:           "PRO",
  platformApply:      "PRO",
  chat:               "PRO",
  fullSocials:        "PRO",
  verifiedBadge:      "PRO",
  followers:          "PRO",
  noCompetitorAds:    "PRO",
  videoEmbed:         "PREMIUM",
  featuredPlacement:  "PREMIUM",
  customCta:          "PREMIUM",
  accountManager:     "PREMIUM",
  apiRead:            "PRO",
  apiWrite:           "PREMIUM",
  whiteLabel:         "ENTERPRISE",
};

export function tierAllows(tier: Tier | string | null | undefined, feature: Feature): boolean {
  const t = (tier ?? "FREE") as Tier;
  return RANK[t] >= RANK[MIN_TIER[feature]];
}

export const ACTIVE_EVENTS_LIMIT: Record<Tier, number | null> = {
  FREE: 5,
  PRO: 10,
  PREMIUM: 25,
  ENTERPRISE: null, // 25+ — by agreement
};

export const BOOSTS_INCLUDED_PER_MONTH: Record<Tier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 3,
  ENTERPRISE: 10,
};

export const BOOST_DISCOUNT: Record<Tier, number> = {
  FREE: 0,
  PRO: 0.10,
  PREMIUM: 0.30,
  ENTERPRISE: 0.50,
};

// "Active" = not ARCHIVED. Drafts and PENDING_REVIEW count, since they
// occupy a slot the organizer is working on.
export const ACTIVE_EVENT_STATUSES = ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] as const;
