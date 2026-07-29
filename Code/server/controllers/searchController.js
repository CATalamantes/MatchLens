import { pool } from "../config/database.js";

// Search runs entirely against the local tournament_* tables, so browsing,
// filtering and sorting cost zero API requests. See db/syncTournament.js for
// how those tables are populated.

const PAGE_SIZE = 24;

// Whitelisted so a caller can't inject an arbitrary ORDER BY.
const PLAYER_SORTS = {
  goals: "p.goals DESC, p.assists DESC",
  assists: "p.assists DESC, p.goals DESC",
  age_desc: "p.age DESC NULLS LAST",
  age_asc: "p.age ASC NULLS LAST",
  name: "p.name ASC",
};

const TEAM_SORTS = {
  points: "points DESC, goals_for DESC",
  name: "name ASC",
};

async function searchPlayers({ q, position, group, number, sort, limit, offset }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`LOWER(p.name) LIKE $${params.length}`);
  }
  if (position) {
    params.push(position);
    where.push(`p.position = $${params.length}`);
  }
  if (group) {
    params.push(group);
    where.push(`t.group_label = $${params.length}`);
  }
  if (number) {
    params.push(Number(number));
    where.push(`p.squad_number = $${params.length}`);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy = PLAYER_SORTS[sort] ?? PLAYER_SORTS.goals;

  // Joined to tournament_teams only so results can be filtered by group.
  const base = `FROM tournament_players p
                LEFT JOIN tournament_teams t ON t.api_team_id = p.api_team_id
                ${clause}`;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total ${base}`,
    params,
  );

  const { rows } = await pool.query(
    `SELECT p.api_player_id AS id, p.name, p.photo_url AS photo, p.age,
            p.nationality, p.position, p.squad_number, p.goals, p.assists,
            p.api_team_id, p.team_name, t.group_label AS group, t.logo_url AS team_logo
     ${base}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { total: countRows[0].total, rows: rows.map((r) => ({ ...r, type: "player" })) };
}

async function searchTeams({ q, group, sort, limit, offset }) {
  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    where.push(`LOWER(name) LIKE $${params.length}`);
  }
  if (group) {
    params.push(group);
    where.push(`group_label = $${params.length}`);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy = TEAM_SORTS[sort] ?? TEAM_SORTS.points;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM tournament_teams ${clause}`,
    params,
  );

  const { rows } = await pool.query(
    `SELECT api_team_id AS id, name, logo_url AS logo, group_label AS group,
            played, wins, draws, losses, goals_for, goals_against, points
     FROM tournament_teams ${clause}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  return { total: countRows[0].total, rows: rows.map((r) => ({ ...r, type: "team" })) };
}

// GET /api/search?q=&type=all|team|player&position=&group=&number=&sort=&page=
export async function search(req, res) {
  try {
    const { q = "", type = "all", position, group, number, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    let results = [];
    let total = 0;

    if (type === "team") {
      const teams = await searchTeams({ q, group, sort, limit: PAGE_SIZE, offset });
      results = teams.rows;
      total = teams.total;
    } else if (type === "player") {
      const players = await searchPlayers({
        q, position, group, number, sort, limit: PAGE_SIZE, offset,
      });
      results = players.rows;
      total = players.total;
    } else {
      // Mixed results lead with teams (there are only 32, and a text query
      // matching a nation should surface that nation before its squad).
      const teams = await searchTeams({ q, group, sort, limit: PAGE_SIZE, offset });
      const remaining = PAGE_SIZE - teams.rows.length;
      const players = await searchPlayers({
        q, position, group, number, sort,
        limit: remaining > 0 ? remaining : 0,
        offset: remaining > 0 ? Math.max(0, offset - teams.total) : 0,
      });
      results = [...teams.rows, ...(remaining > 0 ? players.rows : [])];
      total = teams.total + players.total;
    }

    res.status(200).json({ results, total, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("search failed:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/search/facets — the filter options, derived from real data
export async function getFacets(_req, res) {
  try {
    const { rows: groups } = await pool.query(
      `SELECT DISTINCT group_label FROM tournament_teams
       WHERE group_label IS NOT NULL ORDER BY group_label`,
    );
    const { rows: positions } = await pool.query(
      `SELECT DISTINCT position FROM tournament_players
       WHERE position IS NOT NULL ORDER BY position`,
    );
    res.status(200).json({
      groups: groups.map((g) => g.group_label),
      positions: positions.map((p) => p.position),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
