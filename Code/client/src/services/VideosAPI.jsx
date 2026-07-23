const BASE_URL = '/api'

const VideosAPI = {
    getVideosByMatch: async (matchId) => {
        const res = await fetch(`${BASE_URL}/videos/match/${matchId}`)
        if (!res.ok) throw new Error('Failed to fetch videos')
        return res.json()
    },

    createVideo: async (video) => {
        const res = await fetch(`${BASE_URL}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(video)
        })
        if (!res.ok) throw new Error('Failed to add video link')
        return res.json()
    }
}

export default VideosAPI
