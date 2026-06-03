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

// Cache 12h (~twice a day) — fresh enough before the tournament starts; we'll
// drop this to minutes/seconds once matches go live in June 2026.
async function call(path: string): Promise<unknown[]> {
  if (!KEY) return [];
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": KEY },
      next: { revalidate: 43200 },
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

export type WcStandingRow = {
  rank: number; team: string; logo: string;
  played: number; win: number; draw: number; lose: number;
  gd: number; points: number;
};
export type WcGroup = { name: string; rows: WcStandingRow[] };

/** World Cup 2026 group standings (12 groups). */
export async function getWorldCupStandings(): Promise<WcGroup[]> {
  const raw = await call(`/standings?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}`);
  const league = (raw[0] as { league?: { standings?: unknown[][] } })?.league;
  const groups = (league?.standings ?? []) as Array<Array<{
    rank: number; group: string; points: number; goalsDiff: number;
    team: { name: string; logo: string };
    all: { played: number; win: number; draw: number; lose: number };
  }>>;
  return groups
    .map((rows) => ({
      name: rows[0]?.group ?? "",
      rows: rows.map((r) => ({
        rank: r.rank, team: r.team.name, logo: r.team.logo,
        played: r.all.played, win: r.all.win, draw: r.all.draw, lose: r.all.lose,
        gd: r.goalsDiff, points: r.points,
      })),
    }))
    .filter((g) => /^Group /i.test(g.name));
}

export type WcScorer = { rank: number; name: string; photo: string; team: string; goals: number; assists: number };

/** Top scorers of World Cup 2026 (empty until the tournament starts). */
export async function getWorldCupTopScorers(): Promise<WcScorer[]> {
  const raw = await call(`/players/topscorers?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}`);
  return raw.slice(0, 10).map((r, i) => {
    const p = r as {
      player: { name: string; photo: string };
      statistics: Array<{ team: { name: string }; goals: { total: number | null; assists: number | null } }>;
    };
    const s = p.statistics?.[0];
    return {
      rank: i + 1,
      name: p.player.name,
      photo: p.player.photo,
      team: s?.team?.name ?? "",
      goals: s?.goals?.total ?? 0,
      assists: s?.goals?.assists ?? 0,
    };
  });
}

export type WcTeam = { id: number; name: string; code: string | null; logo: string; slug: string };

export function teamSlug(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The 48 teams of World Cup 2026. */
export async function getWorldCupTeams(): Promise<WcTeam[]> {
  const raw = await call(`/teams?league=${WORLD_CUP_LEAGUE}&season=${WORLD_CUP_SEASON}`);
  return raw
    .map((r) => {
      const t = (r as { team: { id: number; name: string; code: string | null; logo: string } }).team;
      return { id: t.id, name: t.name, code: t.code, logo: t.logo, slug: teamSlug(t.name) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getWorldCupTeamBySlug(slug: string): Promise<WcTeam | null> {
  const teams = await getWorldCupTeams();
  return teams.find((t) => t.slug === slug) ?? null;
}

export type WcPlayer = { name: string; number: number | null; position: string | null; photo: string | null };

/** Squad of a World Cup team (single /players/squads call). */
export async function getWorldCupSquad(teamId: number): Promise<WcPlayer[]> {
  const raw = await call(`/players/squads?team=${teamId}`);
  const players = (raw[0] as { players?: Array<{ name: string; number: number | null; position: string | null; photo: string | null }> })?.players ?? [];
  return players.map((p) => ({ name: p.name, number: p.number ?? null, position: p.position ?? null, photo: p.photo ?? null }));
}

export type WcCoach = { name: string; nationality: string | null; photo: string | null };

export async function getWorldCupCoach(teamId: number): Promise<WcCoach | null> {
  const raw = await call(`/coachs?team=${teamId}`);
  const c = raw[0] as { name: string; nationality: string | null; photo: string | null } | undefined;
  return c ? { name: c.name, nationality: c.nationality ?? null, photo: c.photo ?? null } : null;
}
