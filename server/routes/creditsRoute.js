import express from 'express'
import { getPaymentStatus, getPlans, purchasePlan } from '../controllers/creditsController.js'
import protect from '../middlewares/auth.js'

const creditsRouter = express.Router()

creditsRouter.get('/plan', getPlans)
creditsRouter.post('/purchase', protect, purchasePlan)
creditsRouter.get('/status/:tracker', protect, getPaymentStatus)

export default creditsRouter