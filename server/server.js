import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB, { requireDatabase } from './config/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoute.js'
import messageRouter from './routes/messageRoute.js'
import creditsRouter from './routes/creditsRoute.js'
import { safepayWebhook } from './controllers/webhooks.js'

const app = express()

await connectDB()
app.post('/api/safepay/webhook', express.raw({ type: 'application/json' }), safepayWebhook)

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => res.send('server is Live'))
app.get('/api/health', (req, res) => {
    res.json({ success: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})
app.use('/api/user', requireDatabase, userRouter)
app.use('/api/chat', requireDatabase, chatRouter)
app.use('/api/message', requireDatabase, messageRouter)
app.use('/api/credit', requireDatabase, creditsRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})