import express from 'express'
import {
    getAllMatches,
    getBracket,
    getMatchById,
    getMatchEvents,
    getMatchLineups,
    getMatchStatistics
} from '../controllers/matchesController.js'

const router = express.Router()

// GET /api/matches (optionally ?round=Round%20of%2016)
router.get('/', getAllMatches)

// ⚠️ Must be defined BEFORE /:id — otherwise Express matches "bracket" as an id
router.get('/bracket', getBracket)

// GET /api/matches/:id
router.get('/:id', getMatchById)

// Two-segment routes, so these can't collide with /:id
router.get('/:id/events', getMatchEvents)
router.get('/:id/lineups', getMatchLineups)
router.get('/:id/statistics', getMatchStatistics)

export default router
