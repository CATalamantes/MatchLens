import express from 'express'
import CommentController from '../controllers/commentController.js'

const router = express.Router()

router.get('/', CommentController.getCommentsByMatch)
router.post('/', CommentController.createComment)
router.patch('/:commentId', CommentController.updateComment)
router.delete('/:commentId', CommentController.deleteComment)

export default router
