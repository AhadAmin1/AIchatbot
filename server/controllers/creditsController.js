import Transaction from "../modals/Transaction.js"
import Safepay from "@sfpy/node-core"

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
]

// API controller for getting all Plans

export const getPlans = async (req, res) => {

    try {
        res.json({ success: true, plans })
    } catch (err) {
        res.json({ success: false, message: err.message })
    }

}

// API Controller for purchasing a new plan
export const purchasePlan = async (req, res) => {
    try {
        const { planId } = req.body
        const userId = req.user._id
        const plan = plans.find(plan => plan._id === planId)

        if (!plan) {
            return res.status(400).json({ success: false, message: "Invalid Plan" })
        }

        const environment = process.env.SAFEPAY_ENV?.trim() || 'sandbox'
        if (!['sandbox', 'production'].includes(environment)) {
            return res.status(500).json({ success: false, message: 'SAFEPAY_ENV must be sandbox or production.' })
        }

        const secretKey = process.env.SAFEPAY_SECRET_KEY?.trim()
        const apiKey = process.env.SAFEPAY_API_KEY?.trim()
        const clientUrl = process.env.CLIENT_URL?.trim()
        if (!secretKey || !apiKey || !clientUrl) {
            return res.status(503).json({
                success: false,
                message: 'Safepay is not configured. Set SAFEPAY_SECRET_KEY, SAFEPAY_API_KEY, and CLIENT_URL in the server environment.',
            })
        }

        const host = environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com'
        const safepay = new Safepay(secretKey, { authType: 'secret', host })
        const checkoutOrigin = new URL(clientUrl)
        if (environment === 'production' && checkoutOrigin.protocol !== 'https:') {
            return res.status(500).json({ success: false, message: 'CLIENT_URL must use HTTPS for production payments.' })
        }

        const transaction = await Transaction.create({
            userId: userId,
            planId: plan._id,
            amount: plan.price,
            credits: plan.credits,
            isPaid: false
        })

        const sessionResponse = await safepay.payments.session.setup({
            merchant_api_key: apiKey,
            intent: 'CYBERSOURCE',
            mode: 'payment',
            entry_mode: 'raw',
            currency: 'USD',
            amount: Math.round(plan.price * 100),
            metadata: { order_id: transaction._id.toString() },
            include_fees: false,
        })

        const tracker = sessionResponse.data?.tracker?.token
        if (!tracker) {
            throw new Error('Safepay did not return a payment tracker.')
        }

        const passportResponse = await safepay.client.passport.create()
        const passportToken = passportResponse.data
        if (typeof passportToken !== 'string' || !passportToken) {
            throw new Error('Safepay did not return a checkout token.')
        }

        transaction.safepayTracker = tracker
        await transaction.save()

        const url = safepay.checkout.createCheckoutUrl({
            env: environment,
            tbt: passportToken,
            tracker,
            source: 'hosted',
            redirect_url: new URL('/loading', checkoutOrigin).toString(),
            cancel_url: new URL('/credits?payment=cancelled', checkoutOrigin).toString(),
        })

        return res.json({ success: true, url })
    } catch (err) {
        console.error('Safepay checkout setup failed:', err.message)
        return res.status(502).json({ success: false, message: err.message })
    }

}

export const getPaymentStatus = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            safepayTracker: req.params.tracker,
            userId: req.user._id,
        }).select('isPaid')

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Payment was not found.' })
        }

        return res.json({ success: true, paid: transaction.isPaid })
    } catch (err) {
        console.error('Payment status lookup failed:', err.message)
        return res.status(500).json({ success: false, message: 'Could not check payment status.' })
    }
}


