import { pool } from './database.js'
import './dotenv.js'
import userData from '../data/users.js'

const createUsersTable = async () => {
    const createTableQuery = `
        DROP TABLE IF EXISTS users;

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
    await createUsersTable()

    userData.forEach((user) => {
        const insertQuery = {
            text: 'INSERT INTO users (email, password, favorite_team, points) VALUES ($1, $2, $3, $4)'
        }

        const values = [
            user.email,
            user.password,
            user.favorite_team,
            user.points
        ]

        pool.query(insertQuery, values, (err) => {
            if (err) {
                console.error('⚠️ error inserting user', err)
                return
            }
            console.log(`✅ ${user.email} added successfully`)
        })
    })
}

seedUsersTable()
