# Ashtadisha — Gateway to the Seven Sisters 🧭

> **Premium Northeast India Tourism Portal**  
> *जहाँ कोहरा पहाड़ से मिलता है। Where Mist Meets Mountain.*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://ashtadisha.vercel.app)

---

## 🗺️ About

Ashtadisha is a bilingual (English + Hindi) luxury tourism website for Northeast India's **Seven Sister States** — Assam, Meghalaya, Nagaland, Manipur, Mizoram, Tripura, and Arunachal Pradesh.

## ✨ Features

- **7 State Guides** — Interactive sections with galleries, cuisine, shopping & travel tips
- **AI Travel Planner** — Personalised itinerary suggestions
- **Clerk Authentication** — Google / Facebook / Email sign-in
- **Firebase Firestore** — User profiles, bookings, enquiries
- **Razorpay Payments** — UPI, Cards, NetBanking, Wallets (INR)
- **User Dashboard** — My Trips, Upcoming, Past Journeys, Account Settings
- **Premium Design** — Three.js canvas, GSAP ScrollTrigger, Anime.js, dark mode, custom cursor

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | Vanilla HTML5 (modular components) |
| Styling | Vanilla CSS (no frameworks) |
| Logic | Vanilla JavaScript (ES Modules) |
| 3D/Animation | Three.js · GSAP · Anime.js |
| Auth | Clerk JS |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Payments | Razorpay |
| Hosting | Vercel |

## 🚀 Running Locally

```bash
# Requires a local HTTP server (ES modules don't work via file://)
# Option 1: Double-click run_website.bat (Windows)
# Option 2: Python
python -m http.server 8000
# Option 3: Node
npx serve .
```

Then open → `http://localhost:8000`

## 📁 Project Structure

```
├── index.html              # Main SPA shell
├── dashboard.html          # User dashboard page
├── vercel.json             # Vercel deployment config
├── components/             # Lazy-loaded HTML sections
│   ├── hero.html
│   ├── state-assam.html    # (and all 7 states)
│   ├── booking.html
│   └── ...
├── css/
│   ├── main.css            # CSS entry (imports all below)
│   ├── global.css          # Variables + typography
│   ├── layout.css          # Nav, footer, grid
│   ├── auth.css            # Auth modal + avatar
│   ├── dashboard.css       # Dashboard page
│   └── booking-checkout.css
├── js/
│   ├── main.js             # App entry point
│   ├── auth.js             # Clerk integration
│   ├── firebase.js         # Firestore CRUD
│   ├── payment.js          # Razorpay integration
│   ├── booking-checkout.js # Checkout modal
│   └── ...
└── assets/                 # Images
```

## 🔑 Environment Keys

Keys are stored directly in JS files (suitable for client-side-only projects):

- **Clerk** — `js/auth.js` → `CLERK_PUBLISHABLE_KEY`
- **Firebase** — `js/firebase.js` → `FIREBASE_CONFIG`
- **Razorpay** — `js/payment.js` → `RZP_KEY_ID`

## ☁️ Deploying to Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import `pixelpalace-coder/Ashtadisha`
4. Framework Preset: **Other** (Static Site)
5. Root Directory: `.` (leave as default)
6. Click **Deploy** — done!

> After deploying, add your Vercel domain to Clerk's **Allowed Origins** in the [Clerk Dashboard](https://dashboard.clerk.com).

---

*Built with ♥ for Northeast India*
