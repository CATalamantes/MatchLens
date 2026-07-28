import { footballApiGet } from "../config/footballApi.js";

const LEAGUE_ID = 1; // FIFA World Cup
// Free-tier API-Football plans only cover seasons 2022-2024 — 2026 is listed
// as a valid season for this league but the plan blocks its data, so 2022
// (Qatar) is the real, most recent World Cup this app's fixture data can
// actually reflect.
const SEASON = 2022;

// Raw API-Football status codes collapsed into the small set the UI needs.
const STATUS_MAP = {
  "1H": "LIVE",
  "2H": "LIVE",
  ET: "LIVE",
  BT: "LIVE",
  P: "LIVE",
  HT: "HT",
  FT: "FT",
  AET: "FT",
  PEN: "FT",
  NS: "UPCOMING",
  TBD: "UPCOMING",
};

export function mapFixture(f) {
  return {
    id: f.fixture.id,
    home: f.teams.home.name,
    away: f.teams.away.name,
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: STATUS_MAP[f.fixture.status.short] || f.fixture.status.short,
    minute: f.fixture.status.elapsed,
    date: f.fixture.date.slice(0, 10),
    time: f.fixture.date.slice(11, 16),
    venue: f.fixture.venue.name,
    round: f.league.round,
  };
}

// GET /api/matches — the full fixed World Cup 2022 fixture list (64 matches).
// Filtering by team/round is done client-side against this small, fixed set.
export async function getAllMatches(req, res) {
  try {
    const data = await footballApiGet(
      `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    );
    res.status(200).json(data.map(mapFixture));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

export async function getMatchById(req, res) {
  try {
    const data = await footballApiGet(`/fixtures?id=${req.params.id}`);
    if (!data.length) return res.status(404).json({ error: "Match not found" });
    res.status(200).json(mapFixture(data[0]));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
