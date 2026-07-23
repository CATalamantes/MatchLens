const BASE_URL = '/api'

const TeamsAPI = {
    getAllTeams: async (search) => {
        const url = search ? `${BASE_URL}/teams?search=${search}` : `${BASE_URL}/teams`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch teams')
        return res.json()
    },

    getTeamById: async (id) => {
        const res = await fetch(`${BASE_URL}/teams/${id}`)
        if (!res.ok) throw new Error(`Failed to fetch team ${id}`)
        return res.json()
    }
}

export default TeamsAPI
