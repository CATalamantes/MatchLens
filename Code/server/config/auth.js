import './dotenv.js'

import GitHubStrategy from 'passport-github2'
import { pool } from './database.js'

const options = {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/callback'
}

// GitHub lets users hide their address, so fall back to the noreply alias
// GitHub itself issues for that account — still a real, deliverable address.
const resolveEmail = (profile) => {
    const { id, login, email } = profile._json

    return profile.emails?.[0]?.value
        || email
        || `${id}+${login}@users.noreply.github.com`
}

const verify = async (accessToken, refreshToken, profile, callback) => {
    const {
        _json: { id, login, avatar_url }
    } = profile

    const userData = {
        githubId: String(id),
        username: login,
        avatarUrl: avatar_url,
        email: resolveEmail(profile),
        accessToken
    }

    try {
        // githubid, not username: GitHub logins are renameable, the id is not
        const existing = await pool.query(
            `UPDATE users
                SET username = $2, avatarurl = $3, accesstoken = $4
                WHERE githubid = $1
                RETURNING *`,
            [userData.githubId, userData.username, userData.avatarUrl, accessToken]
        )

        if (existing.rows[0]) {
            return callback(null, existing.rows[0])
        }

        // No GitHub row yet. If they already signed up locally with this same
        // address, attach GitHub to that account rather than tripping the
        // email UNIQUE constraint on the insert below.
        const linked = await pool.query(
            `UPDATE users
                SET githubid = $2, username = $3, avatarurl = $4, accesstoken = $5
                WHERE email = $1 AND githubid IS NULL
                RETURNING *`,
            [userData.email, userData.githubId, userData.username, userData.avatarUrl, accessToken]
        )

        if (linked.rows[0]) {
            return callback(null, linked.rows[0])
        }

        // Brand new user. No password column here — githubid satisfies the
        // users_has_credential check on its own.
        const created = await pool.query(
            `INSERT INTO users (email, username, githubid, avatarurl, accesstoken)
            VALUES($1, $2, $3, $4, $5)
            RETURNING *`,
            [userData.email, userData.username, userData.githubId, userData.avatarUrl, accessToken]
        )

        return callback(null, created.rows[0])
    } catch (error) {
        return callback(error)
    }
}

const GitHub = new GitHubStrategy(options, verify)

export default { GitHub }