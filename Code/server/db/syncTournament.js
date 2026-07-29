// db/syncTournament.js
//
// Run with: npm run sync
//
// Pulls the tournament's teams and players from API-Football into Postgres so
// that search, filtering and sorting are plain SQL and cost zero API requests.
//
// This is deliberately NOT part of `npm run reset`. Reset rebuilds the
// user-owned tables and has to stay free to run; this script spends ~43 of a
// 100/day quota, so it runs on its own and only when the data needs refreshing.
//
// Safe to re-run: every write is an upsert keyed on the API's own ids, and
// footballApiGet caches responses to disk, so a second run in the same window
// spends nothing at all.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/database.js";
import { footballApiGet } from "../config/footballApi.js";
import { LEAGUE_ID, SEASON } from "../config/competition.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureSchema() {
    const schemaPath = path.resolve(__dirname, "tournamentSchema.sql");
    await pool.query(fs.readFileSync(schemaPath, "utf-8"));
    console.log("✅ tournament tables ready");
}

async function syncTeams() {
    const data = await footballApiGet(
        `/standings?league=${LEAGUE_ID}&season=${SEASON}`,
    );
    // A cup returns one table per group, so this is an array of arrays.
    const rows = (data[0]?.league?.standings ?? []).flat();

    for (const row of rows) {
        await pool.query(
            `INSERT INTO tournament_teams
                (api_team_id, name, logo_url, group_label, played, wins, draws,
                 losses, goals_for, goals_against, points, synced_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
             ON CONFLICT (api_team_id) DO UPDATE SET
                name = EXCLUDED.name,
                logo_url = EXCLUDED.logo_url,
                group_label = EXCLUDED.group_label,
                played = EXCLUDED.played,
                wins = EXCLUDED.wins,
                draws = EXCLUDED.draws,
                losses = EXCLUDED.losses,
                goals_for = EXCLUDED.goals_for,
                goals_against = EXCLUDED.goals_against,
                points = EXCLUDED.points,
                synced_at = NOW()`,
            [
                row.team.id,
                row.team.name,
                row.team.logo,
                row.group,
                row.all.played,
                row.all.win,
                row.all.draw,
                row.all.lose,
                row.all.goals.for,
                row.all.goals.against,
                row.points,
            ],
        );
    }

    console.log(`✅ ${rows.length} teams synced`);
}

async function syncPlayers() {
    let count = 0;

    // Fetched per team rather than in one competition-wide sweep because free
    // plans reject any page above 3 ("Free plans are limited to a maximum value
    // of 3 for the Page parameter"), which caps a league-wide query at 60
    // players. Per team it's ~26 players over 2 pages, so the whole tournament
    // fits inside the page limit at ~64 requests.
    const { rows: teams } = await pool.query(
        "SELECT api_team_id, name FROM tournament_teams ORDER BY api_team_id",
    );

    for (const team of teams) {
        let page = 1;
        let totalPages = 1;

        // Sequential on purpose: API-Football rate-limits per minute, and each
        // page is cached individually so an interrupted run resumes cheaply.
        while (page <= totalPages) {
            const body = await footballApiGet(
                `/players?team=${team.api_team_id}&season=${SEASON}&league=${LEAGUE_ID}&page=${page}`,
                { withPaging: true },
            );
            totalPages = Math.min(body.paging.total, 3);

            for (const entry of body.response) {
                const stats = entry.statistics?.[0] ?? {};
                await pool.query(
                    `INSERT INTO tournament_players
                        (api_player_id, name, photo_url, age, nationality, position,
                         squad_number, goals, assists, appearances, minutes, rating,
                         api_team_id, team_name, shots_total, shots_on, passes_total,
                         passes_key, pass_accuracy, yellow_cards, red_cards, synced_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                             $15,$16,$17,$18,$19,$20,$21, NOW())
                     ON CONFLICT (api_player_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        photo_url = EXCLUDED.photo_url,
                        age = EXCLUDED.age,
                        nationality = EXCLUDED.nationality,
                        position = EXCLUDED.position,
                        squad_number = EXCLUDED.squad_number,
                        goals = EXCLUDED.goals,
                        assists = EXCLUDED.assists,
                        appearances = EXCLUDED.appearances,
                        minutes = EXCLUDED.minutes,
                        rating = EXCLUDED.rating,
                        api_team_id = EXCLUDED.api_team_id,
                        team_name = EXCLUDED.team_name,
                        shots_total = EXCLUDED.shots_total,
                        shots_on = EXCLUDED.shots_on,
                        passes_total = EXCLUDED.passes_total,
                        passes_key = EXCLUDED.passes_key,
                        pass_accuracy = EXCLUDED.pass_accuracy,
                        yellow_cards = EXCLUDED.yellow_cards,
                        red_cards = EXCLUDED.red_cards,
                        synced_at = NOW()`,
                    [
                        entry.player.id,
                        entry.player.name,
                        entry.player.photo,
                        entry.player.age,
                        entry.player.nationality,
                        stats.games?.position ?? null,
                        stats.games?.number ?? null,
                        stats.goals?.total ?? 0,
                        stats.goals?.assists ?? 0,
                        stats.games?.appearences ?? 0,
                        stats.games?.minutes ?? 0,
                        stats.games?.rating ?? null,
                        stats.team?.id ?? null,
                        stats.team?.name ?? null,
                        stats.shots?.total ?? 0,
                        stats.shots?.on ?? 0,
                        stats.passes?.total ?? 0,
                        stats.passes?.key ?? 0,
                        stats.passes?.accuracy ?? null,
                        stats.cards?.yellow ?? 0,
                        stats.cards?.red ?? 0,
                    ],
                );
                count += 1;
            }

            page += 1;
        }

        console.log(`   ${team.name} — ${count} players so far`);
    }

    console.log(`✅ ${count} players synced`);
}

async function syncTournament() {
    try {
        await ensureSchema();
        await syncTeams();
        await syncPlayers();
        console.log("🎉 tournament sync complete");
    } catch (error) {
        // Partial progress is kept — every page committed before the failure is
        // already in Postgres and its response is cached, so re-running picks up
        // where this left off without re-spending those requests.
        console.error("❌ sync failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

syncTournament();
