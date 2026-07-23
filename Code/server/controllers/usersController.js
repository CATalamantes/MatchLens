import { pool } from '../config/database.js'

// GET /api/users — all users ranked by points (fan leaderboard)
export async function getAllUsers(req, res) {
    try {
        const result = await pool.query(
            'SELECT id, email, favorite_team, points FROM users ORDER BY points DESC'
        )
        res.status(200).json(result.rows)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// GET /api/users/:id — a single user's profile
export async function getUserById(req, res) {
    try {
        const id = parseInt(req.params.id)
        const result = await pool.query(
            'SELECT id, email, favorite_team, points FROM users WHERE id = $1',
            [id]
        )
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// POST /api/users/login — verify credentials, return the user
export async function login(req, res) {
    try {
        const { email, password } = req.body

        // Auto-login for now: any well-formed email + non-empty password succeeds.
        // TODO: replace with a real credentials check:
        //   const result = await pool.query(
        //       'SELECT id, email, favorite_team, points FROM users WHERE email = $1 AND password = $2',
        //       [email, password]
        //   )
        //   if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' })
        //   res.status(200).json(result.rows[0])
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(email) || !password) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        res.status(200).json({ email, points: 24580 })
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// POST /api/users — create an account (sign up)
export async function createUser(req, res) {
    try {
        const { email, password, favorite_team } = req.body
        const result = await pool.query(
            `INSERT INTO users (email, password, favorite_team)
             VALUES ($1, $2, $3) RETURNING id, email, favorite_team, points`,
            [email, password, favorite_team]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// PATCH /api/users/:id — update profile (favorite team, profile image later)
export async function updateUser(req, res) {
    try {
        const id = parseInt(req.params.id)
        const { favorite_team } = req.body
        const result = await pool.query(
            `UPDATE users SET favorite_team = $1 WHERE id = $2
             RETURNING id, email, favorite_team, points`,
            [favorite_team, id]
        )
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}
