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

// POST /api/predictions/settle/:matchId — score a finished match's predictions
router.post('/settle/:matchId', settleMatch)

export default router
