const BASE_URL = '/api'

const MatchesAPI = {
    // All fixtures (pass a date string for the calendar view)
    getAllMatches: async (date) => {
        const url = date ? `${BASE_URL}/matches?date=${date}` : `${BASE_URL}/matches`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch matches')
        return res.json()
    },

    // Single match detail (score, lineups, venue)
    getMatchById: async (id) => {
        const res = await fetch(`${BASE_URL}/matches/${id}`)
        if (!res.ok) throw new Error(`Failed to fetch match ${id}`)
        return res.json()
    }
}

export default MatchesAPI
