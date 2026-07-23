import { pool } from './database.js'
import './dotenv.js'
import userData from '../data/users.js'

// Creates every table from the ER diagram, then seeds demo users.
const createTables = async () => {
    const createTablesQuery = `
        DROP TABLE IF EXISTS video_links;
        DROP TABLE IF EXISTS notifications;
        DROP TABLE IF EXISTS comments;
        DROP TABLE IF EXISTS predictions;
        DROP TABLE IF EXISTS followed_teams;
        DROP TABLE IF EXISTS users;

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            favorite_team VARCHAR(100),
            points INTEGER DEFAULT 0,
            createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS followed_teams (
            followed_team_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_team_id INTEGER NOT NULL,
            team_name VARCHAR(100) NOT NULL,
            followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS predictions (
            prediction_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_match_id INTEGER NOT NULL,
            predicted_home_score INTEGER NOT NULL,
            predicted_away_score INTEGER NOT NULL,
            points_awarded INTEGER DEFAULT 0,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS comments (
            comment_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_match_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            notification_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_team_id INTEGER,
            api_match_id INTEGER,
            notification_type VARCHAR(50),
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS video_links (
            video_link_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_match_id INTEGER NOT NULL,
            title VARCHAR(255),
            video_url TEXT NOT NULL,
            provider VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `
    try {
        await pool.query(createTablesQuery)
        console.log('🎉 all tables created successfully')
    } catch (err) {
        console.error('⚠️ error creating tables', err)
    }
}

const seedUsersTable = async () => {
    await createTables()

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
