const BASE_URL = '/api'

const CommentsAPI = {
    getCommentsByMatch: async (matchId) => {
        const res = await fetch(`${BASE_URL}/comments/match/${matchId}`)
        if (!res.ok) throw new Error('Failed to fetch comments')
        return res.json()
    },

    createComment: async (comment) => {
        const res = await fetch(`${BASE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comment)
        })
        if (!res.ok) throw new Error('Failed to post comment')
        return res.json()
    },

    deleteComment: async (id) => {
        const res = await fetch(`${BASE_URL}/comments/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete comment')
        return res.json()
    }
}

export default CommentsAPI
