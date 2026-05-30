// API-Football (api-sports.io) client. Key lives in API_FOOTBALL_KEY (env), never
// in code. Responses are cached 1h via Next fetch to protect the free-tier quota
// (~100 req/day). All functions degrade to [] if the key is missing or the API
// errors — the page must still render its SEO content.

const BASE = "https://v3.football.api-sports.io";
const KEY = process.env.API_FOOTBALL_KEY;

// FIFA World Cup = league 1 in API-Football.
const WORLD_CUP_LEAGUE = 1;
const WORLD_CUP_SEASON = 2026;

export type WcFixture = {
  id: number;
  date: string;        // ISO
  round: string;       // e.g. "Group Stage - 1"
  status: string;      // "NS", "FT", …
  venue: string;
  city: string;
  home: string;
  homeLogo: string;
  away: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

async function call(path: string): Promise<unknown[]> {
  if (!KEY) return [];
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { response?: unknown[] };
    return json.response ?? [];
  } catch {
    return [];
  }
}

/** World Cup 2026 fixtures, sorted by kickoff (earliest first). */
export async function getWorldCupFixtures(): Promise<WcFixture[]> {
  const raw = await call(`/fixtures?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}`);
  const rows = raw.map((r) => {
    const f = r as {
      fixture: { id: number; date: string; status: { short: string }; venue: { name: string | null; city: string | null } };
      league: { round: string };
      teams: { home: { name: string; logo: string }; away: { name: string; logo: string } };
      goals: { home: number | null; away: number | null };
    };
    return {
      id: f.fixture.id,
      date: f.fixture.date,
      round: f.league.round,
      status: f.fixture.status.short,
      venue: f.fixture.venue?.name ?? "",
      city: f.fixture.venue?.city ?? "",
      home: f.teams.home.name,
      homeLogo: f.teams.home.logo,
      away: f.teams.away.name,
      awayLogo: f.teams.away.logo,
      homeGoals: f.goals?.home ?? null,
      awayGoals: f.goals?.away ?? null,
    } satisfies WcFixture;
  });
  return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
