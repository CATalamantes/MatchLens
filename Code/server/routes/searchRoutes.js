import express from 'express'
import { search, getFacets } from '../controllers/searchController.js'

const router = express.Router()

// GET /api/search/facets — filter options. Keep literal routes like this one
// above any '/:id' route if one is ever added here, or it gets read as an id.
router.get('/facets', getFacets)

// GET /api/search?q=&type=&position=&group=&number=&sort=&page=
router.get('/', search)

export default router
