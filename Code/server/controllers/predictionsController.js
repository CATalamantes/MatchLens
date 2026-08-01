import { pool } from '../config/database.js'
import { footballApiGet } from '../config/footballApi.js'

// Points are calculated using these rules:
// Exact score: EXACT_POINTS
// Correct winner or draw, but wrong score: RESULT_POINTS
// Wrong result: 0
// The points are doubled if the user follows either team.
const EXACT_POINTS = 100
const RESULT_POINTS = 30
const FOLLOW_MULTIPLIER = 2

// These API Football status codes mean the match is finished.
// Upcoming or live matches cannot be settled because they do not have a final result yet.
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])

// Predictions are checked against the score after regular time and extra time.
// Penalty shootout goals are not included because the user predicted the match score,
// not the number of penalties scored.
async function getFixtureResult(apiMatchId) {
    const data = await footballApiGet(`/fixtures?id=${apiMatchId}`)
    if (!data.length) return null
    const f = data[0]
    return {
        status: f.fixture.status.short,
        home_score: f.goals.home,
        away_score: f.goals.away,
        home_id: f.teams.home.id,
        away_id: f.teams.away.id,
    }
}

// Returns -1, 0, or 1 so we can easily compare whether both predictions
// represent a loss, draw, or win.
function outcome(home, away) {
    return Math.sign(home - away)
}

function scorePrediction(prediction, result) {
    if (
        prediction.predicted_home_score === result.home_score &&
        prediction.predicted_away_score === result.away_score
    ) {
        return EXACT_POINTS
    }
    if (
        outcome(prediction.predicted_home_score, prediction.predicted_away_score) ===
        outcome(result.home_score, result.away_score)
    ) {
        return RESULT_POINTS
    }
    return 0
}

// GET /api/predictions/user/:userId — all predictions a user has made
export async function getPredictionsByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId)
        const result = await pool.query(
            'SELECT * FROM predictions WHERE user_id = $1 ORDER BY submitted_at DESC',
            [userId]
        )
        res.status(200).json(result.rows)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// POST /api/predictions — place a prediction (points wager) on a match
export async function createPrediction(req, res) {
    try {
        const { user_id, api_match_id, predicted_home_score, predicted_away_score } = req.body

        // Validate the scores before inserting them into the database.
        // This gives the client a useful 400 response instead of a database error.
        if (
            user_id == null ||
            api_match_id == null ||
            !Number.isInteger(predicted_home_score) ||
            !Number.isInteger(predicted_away_score)
        ) {
            return res.status(400).json({
                error: 'user_id, api_match_id and integer home/away scores are required.',
            })
        }
        if (predicted_home_score < 0 || predicted_away_score < 0) {
            return res.status(400).json({ error: 'Scores cannot be negative.' })
        }

        // Users can only make predictions before a match has finished.
        // If the football API is unavailable, the prediction is still allowed
        // because we do not want an API problem to block the user.
        try {
            const result = await getFixtureResult(api_match_id)
            if (result && FINISHED_STATUSES.has(result.status)) {
                return res
                    .status(400)
                    .json({ error: 'This match has already finished, so predictions are closed.' })
            }
        } catch {
            // The football API may be unavailable, missing a key, or out of requests.
            // In those cases, continue without blocking the prediction.
        }

        const inserted = await pool.query(
            `INSERT INTO predictions (user_id, api_match_id, predicted_home_score, predicted_away_score)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, api_match_id, predicted_home_score, predicted_away_score]
        )
        res.status(201).json(inserted.rows[0])
    } catch (error) {
        // Each user can only submit one prediction for each match.
        if (error.code === '23505') {
            return res
                .status(409)
                .json({ error: 'You have already made a prediction for this match.' })
        }
        res.status(409).json({ error: error.message })
    }
}

// Scores every unsettled prediction for a finished match and adds the points
// to each user's total. Predictions that were already settled are ignored,
// so calling this endpoint again will not add the points twice.
export async function settleMatch(req, res) {
    const apiMatchId = req.params.matchId

    let result
    try {
        result = await getFixtureResult(apiMatchId)
    } catch (error) {
        return res.status(502).json({ error: `Could not load match result: ${error.message}` })
    }

    if (!result) {
        return res.status(404).json({ error: 'Match not found.' })
    }
    if (!FINISHED_STATUSES.has(result.status)) {
        return res.status(400).json({ error: 'Match is not finished yet, so there is nothing to settle.' })
    }
    if (result.home_score == null || result.away_score == null) {
        return res.status(400).json({ error: 'Match has no final score to settle against.' })
    }

    // Keep the prediction update and the user's points update in one transaction.
    // This prevents one update from being saved without the other if something fails.
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const { rows: predictions } = await client.query(
            `SELECT * FROM predictions
             WHERE api_match_id = $1 AND settled_at IS NULL
             FOR UPDATE`,
            [apiMatchId]
        )

        // Find which users follow either team using one query instead of
        // running another database query for every prediction.
        const followTeamIds = [String(result.home_id), String(result.away_id)]
        const { rows: followRows } = await client.query(
            `SELECT DISTINCT user_id FROM followed_teams
             WHERE api_team_id = ANY($1)`,
            [followTeamIds]
        )
        const followers = new Set(followRows.map((row) => row.user_id))

        const settled = []
        for (const prediction of predictions) {
            let points = scorePrediction(prediction, result)
            if (points > 0 && followers.has(prediction.user_id)) {
                points *= FOLLOW_MULTIPLIER
            }

            await client.query(
                `UPDATE predictions
                 SET points_awarded = $1, settled_at = NOW()
                 WHERE prediction_id = $2`,
                [points, prediction.prediction_id]
            )
            await client.query(
                `UPDATE users SET total_points = total_points + $1 WHERE user_id = $2`,
                [points, prediction.user_id]
            )
            settled.push({ user_id: prediction.user_id, points_awarded: points })
        }

        await client.query('COMMIT')
        res.status(200).json({
            api_match_id: apiMatchId,
            final_score: { home: result.home_score, away: result.away_score },
            settled_count: settled.length,
            results: settled,
        })
    } catch (error) {
        await client.query('ROLLBACK')
        res.status(500).json({ error: error.message })
    } finally {
        client.release()
    }
}
