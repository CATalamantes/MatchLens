// Teams come from the external football data API.

import { footballApiGet } from "../config/footballApi.js";
import { mapFixture } from "./matchesController.js";

const LEAGUE_ID = 1; // FIFA World Cup
// Free-tier API-Football plans only cover seasons 2022-2024, not the current one.
const SEASON = 2022;

function mapStandingRow(row) {
  return {
    id: row.team.id,
    name: row.team.name,
    logo: row.team.logo,
    league: "FIFA World Cup 2022",
    group: row.group,
    form: row.form,
    played: row.all.played,
    wins: row.all.win,
    draws: row.all.draw,
    losses: row.all.lose,
    goals_scored: row.all.goals.for,
    goals_conceded: row.all.goals.against,
    goal_difference: row.goalsDiff,
    points: row.points,
  };
}

async function getAllStandingRows() {
  const data = await footballApiGet(
    `/standings?league=${LEAGUE_ID}&season=${SEASON}`,
  );
  return data[0].league.standings.flat();
}

// GET /api/teams — supports ?search=name
export async function getAllTeams(req, res) {
  try {
    const { search } = req.query;
    const rows = await getAllStandingRows();
    let teams = rows.map(mapStandingRow);
    if (search)
      teams = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
      );
    res.status(200).json(teams);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}

// GET /api/teams/:id — team information page data: standings row, the
// team's own group table, real squad list, and the team's real fixtures.
export async function getTeamById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const rows = await getAllStandingRows();
    const row = rows.find((r) => r.team.id === id);
    if (!row) return res.status(404).json({ error: "Team not found" });

    const groupStandings = rows
      .filter((r) => r.group === row.group)
      .map(mapStandingRow);

    const [squadData, fixturesData] = await Promise.all([
      footballApiGet(`/players/squads?team=${id}`),
      footballApiGet(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}&team=${id}`),
    ]);

    const squad = (squadData[0]?.players ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      number: p.number,
      position: p.position,
      photo: p.photo,
    }));

    const fixtures = fixturesData.map(mapFixture);

    res.status(200).json({
      ...mapStandingRow(row),
      groupStandings,
      squad,
      fixtures,
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
}
