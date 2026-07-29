import express from 'express'
import { getCommentsByMatch, createComment, updateComment, deleteComment } from '../controllers/commentsController.js'

const router = express.Router()

// GET /api/comments/match/:matchId
router.get('/match/:matchId', getCommentsByMatch)

// POST /api/comments
router.post('/', createComment)

// PATCH /api/comments/:id
router.patch('/:id', updateComment)

// DELETE /api/comments/:id
router.delete('/:id', deleteComment)

export default router
