// Teams come from the external football data API.

import { footballApiGet } from "../config/footballApi.js";
import { LEAGUE_ID, SEASON } from "../config/competition.js";

function standings() {
  return footballApiGet(`/standings?league=${LEAGUE_ID}&season=${SEASON}`);
}

// A league has one table; a World Cup has eight group tables, so `standings`
// is an array of arrays. Flattening keeps every team reachable — reading only
// standings[0] would silently limit the whole app to Group A.
function allStandingRows(data) {
  const groups = data[0]?.league?.standings ?? [];
  return groups.flat();
}

function mapStandingRow(row) {
  return {
    id: row.team.id,
    name: row.team.name,
    logo: row.team.logo,
    // For a cup this is the group name ("Group A"), which is what the client
    // needs to render the group tables.
    group: row.group,
    played: row.all.played,
    wins: row.all.win,
    draws: row.all.draw,
    losses: row.all.lose,
    goals_scored: row.all.goals.for,
    goals_against: row.all.goals.against,
    goal_diff: row.goalsDiff,
    points: row.points,
    form: row.form,
  };
}

// GET /api/teams — supports ?search=name
export async function getAllTeams(req, res) {
  try {
    const { search } = req.query;
    const data = await standings();
    let teams = allStandingRows(data).map(mapStandingRow);
    if (search)
      teams = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
      );
    res.status(200).json(teams);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/teams/:id — team information page data
export async function getTeamById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid team id" });
    }
    const data = await standings();
    const row = allStandingRows(data).find((r) => r.team.id === id);
    if (!row) return res.status(404).json({ error: "Team not found" });

    // Every fixture this team played, plus the squad list, fetched together
    // so the profile can show real results and a real roster rather than the
    // placeholder content it used to render.
    const [fixtures, squadData] = await Promise.all([
      footballApiGet(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}&team=${id}`),
      footballApiGet(`/players/squads?team=${id}`),
    ]);

    const squad = (squadData[0]?.players ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      number: p.number,
      position: p.position,
      photo: p.photo,
    }));

    res.status(200).json({
      ...mapStandingRow(row),
      squad,
      fixtures: fixtures.map((f) => ({
        id: f.fixture.id,
        date: f.fixture.date,
        round: f.league.round,
        status: f.fixture.status.short,
        home: f.teams.home.name,
        home_id: f.teams.home.id,
        home_logo: f.teams.home.logo,
        home_score: f.goals.home,
        away: f.teams.away.name,
        away_id: f.teams.away.id,
        away_logo: f.teams.away.logo,
        away_score: f.goals.away,
      })),
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
