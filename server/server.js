import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoute.js'
import messageRouter from './routes/messageRoute.js'
import creditsRouter from './routes/creditsRoute.js'
import { stripeWebhook } from './controllers/webhooks.js'

const app = express()

await connectDB()
// Stripe WebHooks
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook)

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => res.send('server is Live'))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditsRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})