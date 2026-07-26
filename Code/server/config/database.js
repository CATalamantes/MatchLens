import pg from "pg";
import "./dotenv.js";

const pool = new pg.Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    // Render's Postgres requires SSL for external connections.
    ssl: { rejectUnauthorized: false },
});

// Without this, a lost connection can crash the whole server with an
// unhandled error instead of just logging it.
pool.on("error", (err) => {
    console.error("Unexpected error on idle Postgres client:", err.message);
});

export { pool };
export default pool;
