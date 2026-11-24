import { createHmac, timingSafeEqual } from "node:crypto"
import mongoose from "mongoose"
import Transaction from "../modals/Transaction.js";
import User from "../modals/User.js";

export const safepayWebhook = async (request, response) => {
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    console.error("Safepay webhook rejected: SAFEPAY_WEBHOOK_SECRET is not configured.")
    return response.status(503).send("Safepay webhook is not configured.")
  }

  const rawBody = request.body
  const signature = request.headers["x-sfpy-signature"]
  if (!Buffer.isBuffer(rawBody) || typeof signature !== "string" || !/^[\da-f]{128}$/i.test(signature)) {
    console.error("Safepay webhook rejected: missing raw body or valid signature header.")
    return response.status(400).send("Invalid Safepay webhook request.")
  }

  try {
    const expectedSignature = createHmac("sha512", webhookSecret).update(rawBody).digest()
    const receivedSignature = Buffer.from(signature, "hex")
    if (!timingSafeEqual(expectedSignature, receivedSignature)) {
      console.error("Safepay webhook signature verification failed. Check the shared secret.")
      return response.status(400).send("Invalid Safepay webhook signature.")
    }

    const event = JSON.parse(rawBody.toString("utf8"))
    if (event.type !== "payment.succeeded") {
      return response.status(200).send("OK")
    }

    const tracker = event.data?.tracker
    if (!tracker) {
      console.error("Safepay payment event rejected: tracker is missing.")
      return response.status(400).send("Safepay payment event is missing its tracker.")
    }

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOneAndUpdate(
          { safepayTracker: tracker, isPaid: false },
          { $set: { isPaid: true } },
          { new: true, session }
        )

        if (!transaction) {
          return
        }

        const userUpdate = await User.updateOne(
          { _id: transaction.userId },
          { $inc: { credits: transaction.credits } },
          { session }
        )
        if (userUpdate.matchedCount !== 1) {
          throw new Error("No user found for the paid Safepay transaction.")
        }
      })
    } finally {
      await session.endSession()
    }

    return response.status(200).send("OK")
  } catch (err) {
    console.error("Safepay webhook processing failed:", err.message)
    return response.status(500).send("Safepay webhook processing failed.")
  }
};
