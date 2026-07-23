const BASE_URL = '/api'

const FollowsAPI = {
    getFollowsByUser: async (userId) => {
        const res = await fetch(`${BASE_URL}/follows/user/${userId}`)
        if (!res.ok) throw new Error('Failed to fetch followed teams')
        return res.json()
    },

    followTeam: async (follow) => {
        const res = await fetch(`${BASE_URL}/follows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(follow)
        })
        if (!res.ok) throw new Error('Failed to follow team')
        return res.json()
    },

    unfollowTeam: async (id) => {
        const res = await fetch(`${BASE_URL}/follows/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to unfollow team')
        return res.json()
    }
}

export default FollowsAPI
