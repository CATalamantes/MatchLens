import { pool } from '../config/database.js'

const getUsers = async (req, res) => {
    try {
        const results = await pool.query('SELECT id, email, favorite_team, points FROM users ORDER BY id ASC')
        res.status(200).json(results.rows)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const results = await pool.query(
            'SELECT id, email, password, favorite_team, points FROM users WHERE email = $1',
            [email]
        )

        const user = results.rows[0]
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const { password: _password, ...safeUser } = user
        res.status(200).json(safeUser)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

const createUser = async (req, res) => {
    try {
        const { email, password, favorite_team } = req.body
        const results = await pool.query(
            `INSERT INTO users (email, password, favorite_team)
             VALUES ($1, $2, $3) RETURNING id, email, favorite_team, points`,
            [email, password, favorite_team]
        )
        res.status(201).json(results.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

export default { getUsers, login, createUser }
