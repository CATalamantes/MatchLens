import express from 'express'
import passport from 'passport'

const router = express.Router()

// the Vite dev server, not this API — OAuth has to land back on the client
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

router.get('/login/success', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'not authenticated' })
    }
    res.status(200).json({ success: true, user: req.user })
})

router.get('/login/failed', (req, res) => {
    res.status(401).json({ success: false, message: "failure" })
})

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }

        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                return next(destroyErr)
            }
            res.clearCookie('connect.sid')
            res.json({ status: "logout", user: {} })
        })
    })
})

router.get(
    '/github',
    passport.authenticate('github', {
        // user:email also returns addresses the user keeps private
        scope: [ 'read:user', 'user:email' ]
    })
)
router.get(
    '/github/callback',
    passport.authenticate('github', {
        successRedirect: `${CLIENT_URL}/home`,
        failureRedirect: `${CLIENT_URL}/`
    })
)

export default router