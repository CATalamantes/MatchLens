import express from 'express'
import {
    getPredictionsByUser,
    createPrediction,
    settleMatch,
} from '../controllers/predictionsController.js'

const router = express.Router()

// GET /api/predictions/user/:userId
router.get('/user/:userId', getPredictionsByUser)

// POST /api/predictions
router.post('/', createPrediction)

// Settle and score the predictions for a finished match.
router.post('/settle/:matchId', settleMatch)

export default router
