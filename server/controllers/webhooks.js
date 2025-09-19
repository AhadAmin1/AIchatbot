// import Stripe from "stripe";
// import Transaction from "../modals/Transaction.js";
// import User from "../modals/User.js";

// export const stripeWebhook = async (request, response) => {
//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
//     const sig = request.headers["stripe-signature"]

//     let event;

//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)

//     } catch (err) {
//         return response.status(400).send(`WebHook Error: ${err.message}`)
//     }

//     try {
//         switch (event.type) {
//             case "payment_intent.succeeded": {
//                 const paymentIntent = event.data.object;
//                 const sessionList = await stripe.checkout.sessions.list({
//                     payment_intent: paymentIntent.id,
//                 })

//                 const session = sessionList.data[0];
//                 const { transactionId, appId } = session.metadata;

//                 if (appId === 'quickgpt') {
//                     const transaction = await Transaction.findOne({
//                         _id: transactionId, isPaid: false
//                     })

//                     // Update Credits in User Accout
//                     await User.updateOne({ _id: transaction.userId }, { $inc: { credits: transaction.credits } })

//                     // update Credits payment status
//                     transaction.isPaid = true;
//                     await transaction.save();

//                 } else {
//                     return response.json({ recieved: true, message: "Ignored event: Invalid app" })
//                 }

//                 break;
//             }


//             default:
//                 console.log("Unhandled event type: ", event.type)
//                 break;
//         }
//         response.json({ recieved: true })
//     } catch (error) {
//         console.error("WebHook processing error: ", error)
//         response.status(500).send("Internal Server Error")
//     }

// }

import Stripe from "stripe";
import Transaction from "../modals/Transaction.js";
import User from "../modals/User.js";

export const stripeWebhook = async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;
  try {
    // Yahan raw body chahiye (Express: bodyParser.raw use karo / Next.js: buffer)
    event = stripe.webhooks.constructEvent(
      request.rawBody || request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Signature verification failed:", err.message);
    return response.status(400).send(`WebHook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Get checkout session linked with this paymentIntent
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        if (!session) {
          console.warn("No checkout session found for this payment intent");
          return response.json({ received: true, message: "No session found" });
        }

        const { transactionId, appId } = session.metadata || {};

        if (appId === "quickgpt") {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          if (!transaction) {
            console.warn("No matching transaction found in DB");
            return response.json({ received: true, message: "No transaction found" });
          }

          // Update Credits in User Account
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          // Update Credits payment status
          transaction.isPaid = true;
          await transaction.save();

          console.log("Payment handled for transaction:", transactionId);
        } else {
          console.warn("Ignored event: Invalid appId");
        }

        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return response.json({ received: true });
  } catch (error) {
    console.error("WebHook processing error:", error);
    return response.status(500).send("Internal Server Error");
  }
};
