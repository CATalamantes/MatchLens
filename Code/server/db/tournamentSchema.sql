-- =========================================================
-- MatchLens — cached tournament reference data
--
-- Deliberately SEPARATE from schema.sql. That file is the user-owned
-- domain model (the six tables in the ER diagram) and `npm run reset`
-- DROPs and rebuilds every table in it. These two tables are a local
-- index of external API data that costs ~43 API requests to rebuild,
-- so they must survive a reset — hence CREATE TABLE IF NOT EXISTS
-- here and no DROP anywhere.
--
-- Populate with `npm run sync` (server/db/syncTournament.js).
--
-- They exist because search needs SQL. A response cache can answer
-- "give me this exact URL again" but it cannot answer "players called
-- Messi, sorted by goals, position midfielder" — that is what these
-- tables are for, and querying them costs zero API requests.
-- =========================================================

CREATE TABLE IF NOT EXISTS tournament_teams (
    api_team_id  INTEGER PRIMARY KEY,   -- API-Football team id
    name         VARCHAR(150) NOT NULL,
    logo_url     VARCHAR(500),
    group_label  VARCHAR(50),           -- "Group A" … "Group H"
    played       INTEGER NOT NULL DEFAULT 0,
    wins         INTEGER NOT NULL DEFAULT 0,
    draws        INTEGER NOT NULL DEFAULT 0,
    losses       INTEGER NOT NULL DEFAULT 0,
    goals_for    INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    points       INTEGER NOT NULL DEFAULT 0,
    synced_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_name  ON tournament_teams(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tournament_teams_group ON tournament_teams(group_label);

CREATE TABLE IF NOT EXISTS tournament_players (
    api_player_id INTEGER PRIMARY KEY,  -- API-Football player id
    name          VARCHAR(150) NOT NULL,
    photo_url     VARCHAR(500),
    age           INTEGER,
    nationality   VARCHAR(100),
    position      VARCHAR(50),          -- Goalkeeper | Defender | Midfielder | Attacker
    squad_number  INTEGER,
    goals         INTEGER NOT NULL DEFAULT 0,
    assists       INTEGER NOT NULL DEFAULT 0,
    appearances   INTEGER NOT NULL DEFAULT 0,
    minutes       INTEGER NOT NULL DEFAULT 0,
    rating        NUMERIC(4, 2),
    api_team_id   INTEGER,
    team_name     VARCHAR(150),
    synced_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Added after the first sync, so these are ALTERs rather than columns in the
-- CREATE above — CREATE TABLE IF NOT EXISTS is a no-op on an existing table and
-- would silently skip them. Re-running `npm run sync` backfills them from the
-- cached API responses at no request cost.
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS shots_total    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS shots_on       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS passes_total   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS passes_key     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS pass_accuracy  INTEGER;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS yellow_cards   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS red_cards      INTEGER NOT NULL DEFAULT 0;

-- Search hits name constantly; the rest back the filter/sort controls.
CREATE INDEX IF NOT EXISTS idx_tournament_players_name     ON tournament_players(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tournament_players_position ON tournament_players(position);
CREATE INDEX IF NOT EXISTS idx_tournament_players_goals    ON tournament_players(goals DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_players_team     ON tournament_players(api_team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_number   ON tournament_players(squad_number);
