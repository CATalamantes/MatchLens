import { footballApiGet } from "../config/footballApi.js";
import { LEAGUE_ID, SEASON, KNOCKOUT_ROUNDS } from "../config/competition.js";

// The whole tournament is 64 fixtures and comes back in a single request, so
// the list, the round filters, and the bracket are all served from this one
// cached call rather than one upstream request each.
function allFixtures() {
  return footballApiGet(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
}

function mapFixture(f) {
  return {
    id: f.fixture.id,
    // Full ISO timestamp, not a date slice — the client needs kickoff time to
    // show anything more precise than "some time that day".
    date: f.fixture.date,
    venue: f.fixture.venue.name,
    city: f.fixture.venue.city,
    league: f.league.name,
    round: f.league.round,
    status: f.fixture.status.short,
    status_long: f.fixture.status.long,
    minute: f.fixture.status.elapsed,
    home: f.teams.home.name,
    home_id: f.teams.home.id,
    home_logo: f.teams.home.logo,
    home_score: f.goals.home,
    home_winner: f.teams.home.winner,
    away: f.teams.away.name,
    away_id: f.teams.away.id,
    away_logo: f.teams.away.logo,
    away_score: f.goals.away,
    away_winner: f.teams.away.winner,
    // A knockout tie can finish level and be decided in extra time or on
    // penalties — without these the Final reads as a 3-3 draw with no winner.
    score_halftime: f.score.halftime,
    score_fulltime: f.score.fulltime,
    score_extratime: f.score.extratime,
    score_penalty: f.score.penalty,
  };
}

// GET /api/matches — every fixture, optionally narrowed to one round
export async function getAllMatches(req, res) {
  try {
    const data = await allFixtures();
    const { round } = req.query;
    const fixtures = round
      ? data.filter((f) => f.league.round === round)
      : data;
    res.status(200).json(fixtures.map(mapFixture));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/matches/bracket — knockout rounds grouped for the tournament tree.
// Must stay registered above /:id or Express reads "bracket" as an id.
export async function getBracket(req, res) {
  try {
    const data = await allFixtures();
    const bracket = KNOCKOUT_ROUNDS.map((round) => ({
      round,
      matches: data
        .filter((f) => f.league.round === round)
        .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date))
        .map(mapFixture),
    }));
    res.status(200).json(bracket);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/matches/:id
export async function getMatchById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    const data = await footballApiGet(`/fixtures?id=${id}`);
    if (!data.length) return res.status(404).json({ error: "Match not found" });
    res.status(200).json(mapFixture(data[0]));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/matches/:id/events — the goal/card/substitution timeline
export async function getMatchEvents(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    const data = await footballApiGet(`/fixtures/events?fixture=${id}`);
    res.status(200).json(
      data
        .map((e) => ({
          minute: e.time.elapsed,
          extra: e.time.extra,
          team_id: e.team.id,
          team: e.team.name,
          player: e.player?.name ?? null,
          assist: e.assist?.name ?? null,
          type: e.type, // Goal | Card | subst | Var
          detail: e.detail, // Normal Goal | Penalty | Yellow Card | ...
        }))
        // Upstream order isn't chronological (the Final opens on a -5' card),
        // and the timeline is only readable if it runs in match order.
        .sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0)),
    );
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/matches/:id/lineups — formations and starting XI for both sides
export async function getMatchLineups(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    const data = await footballApiGet(`/fixtures/lineups?fixture=${id}`);
    // `grid` arrives as "row:col" (e.g. "3:2"), which is what lets the client
    // lay players out on a pitch instead of listing them.
    const mapPlayer = (p) => ({
      id: p.player.id,
      name: p.player.name,
      number: p.player.number,
      pos: p.player.pos,
      grid: p.player.grid,
    });
    res.status(200).json(
      data.map((l) => ({
        team_id: l.team.id,
        team: l.team.name,
        logo: l.team.logo,
        formation: l.formation,
        coach: l.coach?.name ?? null,
        startXI: l.startXI.map(mapPlayer),
        substitutes: l.substitutes.map(mapPlayer),
      })),
    );
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/matches/:id/statistics — shots, possession, fouls, per team
export async function getMatchStatistics(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    const data = await footballApiGet(`/fixtures/statistics?fixture=${id}`);
    res.status(200).json(
      data.map((s) => ({
        team_id: s.team.id,
        team: s.team.name,
        // Upstream sends [{type, value}]; collapsing it to a keyed object lets
        // the client ask for "Ball Possession" without scanning the array.
        // Percentages arrive as strings ("46%") and nulls mean "not recorded".
        stats: Object.fromEntries(
          s.statistics.map((row) => [row.type, row.value]),
        ),
      })),
    );
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

