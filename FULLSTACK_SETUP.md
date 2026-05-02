# Seven Sisters Full-Stack Setup

## 1) Firebase Project Setup

1. Create a Firebase project.
2. Enable Authentication -> Email/Password.
3. Create Firestore database (production mode).
4. Enable Functions (Blaze plan required for Stripe/OpenAI APIs).
5. Copy web app config into `js/app-config.js`.

## 2) Stripe + OpenAI Secrets

In `functions/.env`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `APP_URL`

Use `functions/.env.example` as template.

## 3) Install and Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions,firestore
```

## 4) Firestore Collections

### `users/{uid}`
- `uid`
- `name`
- `email`
- `createdAt`

### `packages/{packageId}`
- `title`
- `description`
- `duration`
- `price`
- `locations` (array)
- `image`
- `createdAt`

### `aiPlans/{planId}`
- `userId`
- `destination`
- `budget`
- `duration`
- `preferences` (array)
- `plan` (JSON object)
- `createdAt`

### `bookings/{bookingId}`
- `userId`
- `packageId` or `aiPlanId`
- `name`
- `email`
- `phone`
- `travelers`
- `travelDate`
- `totalPrice`
- `paymentStatus` (`pending` | `paid`)
- `createdAt`

## 5) APIs Implemented (Firebase Functions)

- `createBooking`
- `createStripeSession`
- `stripeWebhook`
- `generateAIPlan`

## 6) Frontend Integration Points

- Home page package cards render from Firestore/fallback data.
- Booking form writes booking via function and redirects to Stripe Checkout.
- AI planner page generates and saves AI plans via function.
- Dashboard fetches user profile, bookings, and package list from Firestore.

## 7) Security

`firestore.rules` enforces:

- Auth required for user/private data.
- Users can only read their own `users`, `bookings`, and `aiPlans` documents.
- Write validation for booking creation and payment status constraints.
