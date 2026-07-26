import './dotenv.js'

import bcrypt from 'bcrypt'
import { pool } from './database.js'
import userData from '../data/users.js'

const SALT_ROUNDS = 10

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
            -- nullable: an OAuth user has no password of ours to store
            password VARCHAR(255),

            username VARCHAR(255) UNIQUE,
            githubid VARCHAR(255) UNIQUE,
            avatarurl varchar(500),
            accesstoken varchar(500),

            favorite_team VARCHAR(100),
            points INTEGER DEFAULT 0,
            createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            -- every account must be reachable by *some* credential
            CONSTRAINT users_has_credential
                CHECK (password IS NOT NULL OR githubid IS NOT NULL)
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

    // sequential so each password finishes hashing before it is inserted
    for (const user of userData) {
        try {
            const hashed = await bcrypt.hash(user.password, SALT_ROUNDS)
            await pool.query(
                'INSERT INTO users (email, password, favorite_team, points) VALUES ($1, $2, $3, $4)',
                [user.email, hashed, user.favorite_team, user.points]
            )
            console.log(`✅ ${user.email} added successfully`)
        } catch (err) {
            console.error('⚠️ error inserting user', err)
        }
    }

    await pool.end()
}

seedUsersTable()
