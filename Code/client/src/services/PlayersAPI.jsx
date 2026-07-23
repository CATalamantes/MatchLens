const BASE_URL = '/api'

const PlayersAPI = {
    // All players (search + goal-sorted leaderboard supported)
    getAllPlayers: async ({ search, sort } = {}) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (sort) params.set('sort', sort)
        const query = params.toString() ? `?${params.toString()}` : ''
        const res = await fetch(`${BASE_URL}/players${query}`)
        if (!res.ok) throw new Error('Failed to fetch players')
        return res.json()
    },

    // Player detail page
    getPlayerById: async (id) => {
        const res = await fetch(`${BASE_URL}/players/${id}`)
        if (!res.ok) throw new Error(`Failed to fetch player ${id}`)
        return res.json()
    }
}

export default PlayersAPI
