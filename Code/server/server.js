import express from 'express'
import path from 'path'
import dotenv from 'dotenv'

// import the router from each routes file
import usersRouter from './routes/usersRoutes.js'
import matchesRouter from './routes/matchesRoutes.js'
import playersRouter from './routes/playersRoutes.js'
import teamsRouter from './routes/teamsRoutes.js'
import predictionsRouter from './routes/predictionsRoutes.js'
import commentsRouter from './routes/commentsRoutes.js'
import followsRouter from './routes/followsRoutes.js'
import notificationsRouter from './routes/notificationsRoutes.js'
import videosRouter from './routes/videosRoutes.js'

dotenv.config({ path: '../.env' })

const PORT = process.env.PORT || 3000

const app = express()

app.use(express.json())

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'))
}

// specify the api path for the server to use
app.use('/api/users', usersRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/players', playersRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/predictions', predictionsRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/follows', followsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/videos', videosRouter)

if (process.env.NODE_ENV === 'production') {
    app.get('/*', (_, res) =>
        res.sendFile(path.resolve('public', 'index.html'))
    )
}

app.listen(PORT, () => {
    console.log(`server listening on http://localhost:${PORT}`)
})
