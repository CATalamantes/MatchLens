import { pool } from "../config/database.js";

// Players are served from the local tournament_players table rather than the
// API. The 2022 data never changes, so once `npm run sync` has run, every
// player list and profile costs zero API requests — which matters against a
// 100/day quota.

function mapRow(row) {
  return {
    id: row.api_player_id,
    name: row.name,
    photo: row.photo_url,
    age: row.age,
    nationality: row.nationality,
    position: row.position,
    squad_number: row.squad_number,
    goals: row.goals,
    assists: row.assists,
    appearances: row.appearances,
    minutes: row.minutes,
    rating: row.rating,
    shots_total: row.shots_total,
    shots_on: row.shots_on,
    passes: row.passes_total,
    key_passes: row.passes_key,
    pass_accuracy: row.pass_accuracy,
    yellow_cards: row.yellow_cards,
    red_cards: row.red_cards,
    team_id: row.api_team_id,
    team: row.team_name,
    team_logo: row.team_logo,
  };
}

const SELECT = `SELECT p.*, t.logo_url AS team_logo
                FROM tournament_players p
                LEFT JOIN tournament_teams t ON t.api_team_id = p.api_team_id`;

// GET /api/players — supports ?search= and ?sort=goals
export async function getAllPlayers(req, res) {
  try {
    const { search, sort } = req.query;
    const params = [];
    let where = "";

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where = `WHERE LOWER(p.name) LIKE $${params.length}`;
    }

    const orderBy =
      sort === "goals" ? "p.goals DESC, p.assists DESC" : "p.name ASC";

    const { rows } = await pool.query(
      `${SELECT} ${where} ORDER BY ${orderBy}`,
      params,
    );
    res.status(200).json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/players/:id
export async function getPlayerById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid player id" });
    }
    const { rows } = await pool.query(
      `${SELECT} WHERE p.api_player_id = $1`,
      [id],
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.status(200).json(mapRow(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
