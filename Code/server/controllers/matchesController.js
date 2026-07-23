// Matches come from the external football data API, not our database.
// The server acts as the middleman so the API key stays hidden here.
// TODO: replace the dummy data with real fetches to the football API.

const dummyMatches = [
    { id: 101, home: 'MCI', away: 'LIV', home_score: 2, away_score: 1, status: 'LIVE', minute: 72, date: '2026-07-23', venue: 'Etihad Stadium' },
    { id: 102, home: 'RMA', away: 'FCB', home_score: 0, away_score: 0, status: 'HT', minute: 45, date: '2026-07-23', venue: 'Santiago Bernabéu' },
    { id: 103, home: 'PSG', away: 'BAY', home_score: 3, away_score: 2, status: 'LIVE', minute: 88, date: '2026-07-23', venue: 'Parc des Princes' },
    { id: 104, home: 'NOR', away: 'ENG', home_score: null, away_score: null, status: 'UPCOMING', minute: null, date: '2026-07-24', venue: 'Ullevaal Stadion' }
]

// GET /api/matches — fixtures list (supports ?date=YYYY-MM-DD for the calendar)
export async function getAllMatches(req, res) {
    try {
        const { date } = req.query
        const matches = date
            ? dummyMatches.filter((m) => m.date === date)
            : dummyMatches
        res.status(200).json(matches)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// GET /api/matches/:id — full match detail (score, lineups, venue, weather)
export async function getMatchById(req, res) {
    try {
        const id = parseInt(req.params.id)
        const match = dummyMatches.find((m) => m.id === id)
        if (!match) return res.status(404).json({ error: 'Match not found' })
        res.status(200).json(match)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}
