const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
require("dotenv").config();
// const stripe = require("stripe")(
//   "sk_test_51IMOAIIAMKHowpZalkIzHJND1kaYy84zXSMi7j8lhm4b5UkAnoK81SZ951sSwOSVio7GygOWgvhJFuo3nKOxZ2Zy00e263c0wr"
// );
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

const app = express();

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);

app.use(express.static("public"));
app.use(morgan("dev"));
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const storeItems = new Map([
  [1, { priceInCents: 1000, name: "react" }],
  [2, { priceInCents: 2000, name: "vue" }],
  [3, { priceInCents: 1500, name: "angular" }],
  [4, { priceInCents: 1200, name: "css" }],
]);

app.post("/create-checkout-session", async (req, res, next) => {
  try {
    const items = req.body.items;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => {
        const storeItem = storeItems.get(item.id);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        };
      }),
      mode: "payment",
      success_url: `http://127.0.0.1:5500/client/success.html`,
      cancel_url: `http://127.0.0.1:5500/client/cancel.html`,
    });

    // console.log("session", session);

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  console.log(req.body);
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body.toString(),
      sig,
      webhookSecret
    );
    console.log("event", event);
    // use event.type to do something
    // created:
    event.type = "checkout.session.created";
    // updated:
    event.type = "checkout.session.created";
    // successed:
    event.type = "checkout.session.successed";
    // completed:
    event.type = "checkout.session.completed";
    const event = {
      id: "evt_1JNqQvIVvwt4KcQFW3calHJ5",
      object: "event",
      api_version: "2020-08-27",
      created: 1628822865,
      data: {
        object: {
          id: "cs_test_b1XV3OORl26fbuGHuftLZWrtnhvzYMtEUKiamhBdEXZnDevv3pT6MGpflK",
          object: "checkout.session",
          allow_promotion_codes: null,
          amount_subtotal: 19200,
          amount_total: 19200,
          automatic_tax: [Object],
          billing_address_collection: null,
          cancel_url: "http://localhost:3001/cancel.html",
          client_reference_id: null,
          currency: "usd",
          customer: "cus_K1uF6JwMuTjFJo",
          customer_details: [Object],
          customer_email: null,
          livemode: false,
          locale: null,
          metadata: {},
          mode: "payment",
          payment_intent: "pi_3JNqPXIVvwt4KcQF2Ec4jSgZ",
          payment_method_options: {},
          payment_method_types: [Array],
          payment_status: "paid",
          setup_intent: null,
          shipping: null,
          shipping_address_collection: null,
          submit_type: null,
          subscription: null,
          success_url: "http://localhost:3001/success.html",
          total_details: [Object],
          url: null,
        },
      },
      livemode: false,
      pending_webhooks: 2,
      request: { id: null, idempotency_key: null },
      type: "checkout.session.completed",
    };
  } catch (err) {
    // On error, log and return the error message
    console.log(`❌ Error message: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Successfully constructed event
  console.log("✅ Success:", event.id);

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});
console.log(process.env.STRIPE_ENDPOINT_SECRET);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Listen from port", port);
});
