import express from 'express'
import UserController from '../controllers/userController.js'

const router = express.Router()

router.get('/', UserController.getUsers)
router.post('/login', UserController.login)
router.post('/', UserController.createUser)

export default router
