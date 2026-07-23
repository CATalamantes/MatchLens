// Teams come from the external football data API.
// TODO: replace the dummy data with real fetches to the football API.

const dummyTeams = [
    { id: 1, name: 'Liverpool', league: 'Premier League', played: 24, wins: 17, draws: 3, losses: 4, goals_scored: 55, points: 54 },
    { id: 2, name: 'Arsenal', league: 'Premier League', played: 24, wins: 16, draws: 4, losses: 4, goals_scored: 48, points: 52 },
    { id: 3, name: 'Man City', league: 'Premier League', played: 23, wins: 15, draws: 6, losses: 2, goals_scored: 56, points: 51 }
]

// GET /api/teams — supports ?search=name
export async function getAllTeams(req, res) {
    try {
        const { search } = req.query
        const teams = search
            ? dummyTeams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
            : dummyTeams
        res.status(200).json(teams)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// GET /api/teams/:id — team information page data
export async function getTeamById(req, res) {
    try {
        const id = parseInt(req.params.id)
        const team = dummyTeams.find((t) => t.id === id)
        if (!team) return res.status(404).json({ error: 'Team not found' })
        res.status(200).json(team)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}
