import { pool } from '../config/database.js'
import { footballApiGet } from '../config/footballApi.js'

// Scoring rule for a settled prediction, before the follow bonus:
//   exact scoreline          -> EXACT_POINTS
//   right result, wrong score -> RESULT_POINTS   (both won, both drew, or both lost)
//   wrong result             -> 0
// Following either team in the match then doubles whatever was earned.
const EXACT_POINTS = 100
const RESULT_POINTS = 30
const FOLLOW_MULTIPLIER = 2

// API-Football short status codes that mean the 90'(+ET/pens) result is final.
// Only these can be settled — an in-play or upcoming match has no result yet.
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])

// Predictions compare against the 90'+ET scoreline (goals.home/away), so a
// knockout tie decided on penalties still settles on its 3-3 (etc.) score,
// which is what the user actually predicted.
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

// -1 / 0 / +1 — lets "same result" be a single comparison instead of three.
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

        // Guard the insert: the scores land in NOT NULL / CHECK (>= 0) columns,
        // so reject bad input here with a clear 400 rather than letting Postgres
        // raise a 500-shaped error the client can't act on.
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

        // You can only wager on a match that hasn't finished. The fixture lookup
        // is best-effort: if the football API is unreachable we let the wager
        // through rather than block on it, but a match we can positively see is
        // over is rejected.
        try {
            const result = await getFixtureResult(api_match_id)
            if (result && FINISHED_STATUSES.has(result.status)) {
                return res
                    .status(400)
                    .json({ error: 'This match has already finished — predictions are closed.' })
            }
        } catch {
            // API down / no key / quota spent — don't fail the wager over it.
        }

        const inserted = await pool.query(
            `INSERT INTO predictions (user_id, api_match_id, predicted_home_score, predicted_away_score)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, api_match_id, predicted_home_score, predicted_away_score]
        )
        res.status(201).json(inserted.rows[0])
    } catch (error) {
        // UNIQUE (user_id, api_match_id): one prediction per user per match.
        if (error.code === '23505') {
            return res
                .status(409)
                .json({ error: 'You have already made a prediction for this match.' })
        }
        res.status(409).json({ error: error.message })
    }
}

// POST /api/predictions/settle/:matchId — score every unsettled prediction on a
// finished match and credit the points to each user. Non-RESTful by design:
// there's no background job, so settling is an explicit action. Idempotent —
// only rows with settled_at IS NULL are touched, so calling it twice is a no-op.
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
        return res.status(400).json({ error: 'Match is not finished yet — nothing to settle.' })
    }
    if (result.home_score == null || result.away_score == null) {
        return res.status(400).json({ error: 'Match has no final score to settle against.' })
    }

    // A transaction so a prediction's points_awarded and the user's total_points
    // move together — a crash mid-loop can't credit a user without also marking
    // their prediction settled.
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const { rows: predictions } = await client.query(
            `SELECT * FROM predictions
             WHERE api_match_id = $1 AND settled_at IS NULL
             FOR UPDATE`,
            [apiMatchId]
        )

        // Which of these users follow one of the two teams — a single query
        // rather than one per prediction.
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
