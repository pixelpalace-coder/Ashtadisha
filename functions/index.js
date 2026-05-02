const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function requireAuth(context) {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  return context.auth.uid;
}

exports.createBooking = functions.region("asia-south1").https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  const payload = {
    userId,
    packageId: data.packageId || null,
    aiPlanId: data.aiPlanId || null,
    name: String(data.name || ""),
    email: String(data.email || ""),
    phone: String(data.phone || ""),
    travelers: Number(data.travelers || 1),
    travelDate: String(data.travelDate || ""),
    totalPrice: Number(data.totalPrice || 0),
    paymentStatus: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!payload.name || !payload.email || !payload.travelDate || payload.totalPrice <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid booking payload.");
  }

  const ref = await db.collection("bookings").add(payload);
  return { bookingId: ref.id };
});

exports.createStripeSession = functions.region("asia-south1").https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const bookingId = String(data.bookingId || "");
  if (!bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "bookingId is required.");
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();
  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Booking not found.");
  }

  const booking = bookingDoc.data();
  if (booking.userId !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Not your booking.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.APP_URL}/dashboard.html?payment=success`,
    cancel_url: `${process.env.APP_URL}/dashboard.html?payment=cancelled`,
    metadata: { bookingId },
    customer_email: booking.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: Math.round(Number(booking.totalPrice || 0) * 100),
          product_data: {
            name: booking.packageId
              ? "Seven Sisters package booking"
              : booking.aiPlanId
                ? "AI-planned trip booking"
                : "Ashtadisha trip booking",
          },
        },
      },
    ],
  });

  await bookingRef.set({ stripeSessionId: session.id }, { merge: true });
  return { sessionId: session.id };
});

exports.stripeWebhook = functions
  .region("asia-south1")
  .https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(500).send("Missing webhook secret");
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        await db.collection("bookings").doc(bookingId).set(
          {
            paymentStatus: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    res.json({ received: true });
  });

exports.generateAIPlan = functions.region("asia-south1").https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const destination = String(data.destination || "");
  const budget = Number(data.budget || 0);
  const duration = Number(data.duration || 0);
  const preferences = Array.isArray(data.preferences) ? data.preferences : [];

  if (!destination || !duration || !budget) {
    throw new functions.https.HttpsError("invalid-argument", "destination, budget, duration are required.");
  }

  const prompt = `Create a ${duration}-day itinerary for ${destination} in Northeast India within INR ${budget}. Traveler interests: ${preferences.join(", ") || "general sightseeing"}.

Return a single JSON object with exactly these keys:
- title (string): catchy trip name
- estimatedTotalCost (number): realistic total in INR for the group trip
- suggestedPlaces (array of strings): 5-10 must-see spots or towns
- highlights (array of strings): 4-6 bullet selling points for the trip
- travelTips (array of strings): 5-8 practical tips (permits, weather, transport, respect local customs)
- itinerary (array): each item {day:number, title:string, description:string (2-4 sentences), estimatedCost:number in INR for that day, morning:string, afternoon:string, evening:string optional short slots}

Keep costs plausible for Northeast India. JSON only, no markdown.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  const doc = await db.collection("aiPlans").add({
    userId,
    destination,
    budget,
    duration,
    preferences,
    plan: parsed,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { planId: doc.id, plan: parsed };
});
