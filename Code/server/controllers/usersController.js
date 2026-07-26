import bcrypt from "bcrypt";
import { pool } from "../config/database.js";

const SALT_ROUNDS = 10;

// Columns safe to hand back to the client — never password_hash or access_token
const PUBLIC_COLUMNS = `user_id AS id, username, email, profile_image_url, total_points AS points`;

// GET /api/users — all users ranked by points (fan leaderboard)
export async function getAllUsers(req, res) {
    try {
        const result = await pool.query(
            `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY total_points DESC`,
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

// GET /api/users/:id — a single user's profile
export async function getUserById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const result = await pool.query(
            `SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id = $1`,
            [id],
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

// POST /api/users/login — verify credentials, return the user
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const result = await pool.query(
            `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1 LIMIT 1`,
            [email],
        );
        const user = result.rows[0];

        // A GitHub-only account has a NULL password_hash — it has to sign in
        // through OAuth. Same generic error either way, so this endpoint never
        // reveals which emails are registered.
        if (
            !user ||
            !user.password_hash ||
            !(await bcrypt.compare(password, user.password_hash))
        ) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const { password_hash: _hash, ...safeUser } = user;
        res.status(200).json(safeUser);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

// POST /api/users — create an account (sign up)
export async function createUser(req, res) {
    try {
        const { username, email, password, profile_image_url = null } = req.body;

        if (!username || !email || !password) {
            return res
                .status(400)
                .json({ error: "Username, email and password are required" });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, profile_image_url, total_points)
             VALUES ($1, $2, $3, $4, 0)
             RETURNING ${PUBLIC_COLUMNS}`,
            [username, email, passwordHash, profile_image_url],
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}

// PATCH /api/users/:id — update profile (username, image, points)
export async function updateUser(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { username, profile_image_url, total_points } = req.body;
        const result = await pool.query(
            `UPDATE users
             SET username = COALESCE($1, username),
                 profile_image_url = COALESCE($2, profile_image_url),
                 total_points = COALESCE($3, total_points)
             WHERE user_id = $4
             RETURNING ${PUBLIC_COLUMNS}`,
            [
                username ?? null,
                profile_image_url ?? null,
                total_points ?? null,
                id,
            ],
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(409).json({ error: error.message });
    }
}
