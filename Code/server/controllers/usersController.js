import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'

const SALT_ROUNDS = 10

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

        if (!email || !password) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const result = await pool.query(
            'SELECT id, email, password, favorite_team, points FROM users WHERE email = $1',
            [email]
        )
        const user = result.rows[0]

        // A GitHub-only account has no password to compare against — it has to
        // sign in through OAuth. Same generic error either way, so this endpoint
        // never reveals which emails are registered.
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const { password: _hash, ...safeUser } = user
        res.status(200).json(safeUser)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// POST /api/users — create an account (sign up)
export async function createUser(req, res) {
    try {
        const { email, password, favorite_team } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS)
        const result = await pool.query(
            `INSERT INTO users (email, password, favorite_team)
             VALUES ($1, $2, $3) RETURNING id, email, favorite_team, points`,
            [email, hashed, favorite_team]
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
