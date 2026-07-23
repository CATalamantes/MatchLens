// Players come from the external football data API.
// TODO: replace the dummy data with real fetches to the football API.

const dummyPlayers = [
    { id: 9, name: 'Erling Haaland', team: 'Manchester City', position: 'ST', goals: 21, assists: 5 },
    { id: 11, name: 'Mohamed Salah', team: 'Liverpool FC', position: 'RW', goals: 18, assists: 9 },
    { id: 7, name: 'Bukayo Saka', team: 'Arsenal', position: 'RW', goals: 12, assists: 11 }
]

// GET /api/players — supports ?search=name and ?sort=goals (stat leaderboard)
export async function getAllPlayers(req, res) {
    try {
        const { search, sort } = req.query
        let players = [...dummyPlayers]
        if (search) {
            players = players.filter((p) =>
                p.name.toLowerCase().includes(search.toLowerCase())
            )
        }
        if (sort === 'goals') {
            players.sort((a, b) => b.goals - a.goals)
        }
        res.status(200).json(players)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

// GET /api/players/:id — player history, team, and key stats
export async function getPlayerById(req, res) {
    try {
        const id = parseInt(req.params.id)
        const player = dummyPlayers.find((p) => p.id === id)
        if (!player) return res.status(404).json({ error: 'Player not found' })
        res.status(200).json(player)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}
