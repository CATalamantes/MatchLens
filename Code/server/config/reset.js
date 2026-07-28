import { pool } from './database.js'
import './dotenv.js'
import userData from '../data/users.js'
import commentData from '../data/comments.js'

const createUsersTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            favorite_team VARCHAR(100),
            points INTEGER DEFAULT 0,
            createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    try {
        await pool.query(createTableQuery)
        console.log('🎉 users table created successfully')
    } catch (err) {
        console.error('⚠️ error creating users table', err)
    }
}

const seedUsersTable = async () => {
    for (const user of userData) {
        const insertQuery = {
            text: 'INSERT INTO users (email, password, favorite_team, points) VALUES ($1, $2, $3, $4)'
        }

        const values = [
            user.email,
            user.password,
            user.favorite_team,
            user.points
        ]

        try {
            await pool.query(insertQuery, values)
            console.log(`✅ ${user.email} added successfully`)
        } catch (err) {
            console.error('⚠️ error inserting user', err)
        }
    }
}

const createCommentsTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS comments (
            comment_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_match_id VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `
    try {
        await pool.query(createTableQuery)
        console.log('🎉 comments table created successfully')
    } catch (err) {
        console.error('⚠️ error creating comments table', err)
    }
}

const seedCommentsTable = async () => {
    for (const comment of commentData) {
        const insertQuery = {
            text: 'INSERT INTO comments (user_id, api_match_id, content) VALUES ($1, $2, $3)'
        }

        const values = [
            comment.user_id,
            comment.api_match_id,
            comment.content
        ]

        try {
            await pool.query(insertQuery, values)
            console.log(`✅ comment for ${comment.api_match_id} added successfully`)
        } catch (err) {
            console.error('⚠️ error inserting comment', err)
        }
    }
}

const resetDatabase = async () => {
    // comments has a FK into users, so it must be dropped before users is dropped/recreated
    await pool.query('DROP TABLE IF EXISTS comments')
    await pool.query('DROP TABLE IF EXISTS users CASCADE')

    await createUsersTable()
    await seedUsersTable()

    await createCommentsTable()
    await seedCommentsTable()
}

resetDatabase()
