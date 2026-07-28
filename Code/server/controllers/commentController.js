import { pool } from '../config/database.js'

const getCommentsByMatch = async (req, res) => {
    try {
        const { api_match_id } = req.query

        if (!api_match_id) {
            return res.status(400).json({ error: 'api_match_id is required' })
        }

        const results = await pool.query(
            `SELECT comments.comment_id, comments.user_id, comments.api_match_id,
                    comments.content, comments.created_at, comments.updated_at,
                    users.email
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.api_match_id = $1
             ORDER BY comments.created_at ASC`,
            [api_match_id]
        )
        res.status(200).json(results.rows)
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

const createComment = async (req, res) => {
    try {
        const { user_id, api_match_id, content } = req.body

        if (!user_id || !api_match_id || !content || !content.trim()) {
            return res.status(400).json({ error: 'user_id, api_match_id, and content are required' })
        }

        const results = await pool.query(
            `INSERT INTO comments (user_id, api_match_id, content)
             VALUES ($1, $2, $3) RETURNING *`,
            [user_id, api_match_id, content.trim()]
        )
        res.status(201).json(results.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params
        const { user_id, content } = req.body

        if (!user_id || !content || !content.trim()) {
            return res.status(400).json({ error: 'user_id and content are required' })
        }

        const results = await pool.query(
            `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP
             WHERE comment_id = $2 AND user_id = $3 RETURNING *`,
            [content.trim(), commentId, user_id]
        )

        if (results.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found or not owned by this user' })
        }

        res.status(200).json(results.rows[0])
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params
        const { user_id } = req.query

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' })
        }

        const results = await pool.query(
            'DELETE FROM comments WHERE comment_id = $1 AND user_id = $2 RETURNING comment_id',
            [commentId, user_id]
        )

        if (results.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found or not owned by this user' })
        }

        res.status(200).json({ comment_id: results.rows[0].comment_id })
    } catch (error) {
        res.status(409).json({ error: error.message })
    }
}

export default { getCommentsByMatch, createComment, updateComment, deleteComment }
