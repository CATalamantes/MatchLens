import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import userRouter from './routes/userRoutes.js'

dotenv.config({ path: '../.env' })

const PORT = process.env.PORT || 3000

const app = express()

app.use(express.json())

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'))
}

app.use('/api/users', userRouter)

if (process.env.NODE_ENV === 'production') {
    app.get('/*', (_, res) =>
        res.sendFile(path.resolve('public', 'index.html'))
    )
}

app.listen(PORT, () => {
    console.log(`server listening on http://localhost:${PORT}`)
})
