<div align="center">
  <img src="assets/readme/header-3d.png" width="100%" alt="Ashtadisha Header" />
  
  # 🧭 ASHTADISHA
  ### Gateway to the Seven Sisters of Northeast India
  
  [![Vercel Deployment](https://img.shields.io/badge/Live-Vercel-black?style=for-the-badge&logo=vercel)](https://ashtadisha.vercel.app)
  [![Firebase](https://img.shields.io/badge/Powered%20By-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
  [![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-000000?style=for-the-badge&logo=three.js)](https://threejs.org)
  
  <p align="center">
    <b>जहाँ कोहरा पहाड़ से मिलता है। Where Mist Meets Mountain.</b><br />
    A luxury, bilingual travel portal immersive experience.
  </p>
</div>

---

## 📸 Immersive Experience

<div align="center">
  <img src="assets/readme/laptop-mockup.png" width="85%" alt="Ashtadisha Workstation Mockup" />
  <br />
  <i>Modern. Aesthetic. Immersive. Built for the modern traveler.</i>
</div>

---

## ✨ Features

- 🗺️ **The Seven Sisters** — Interactive states guides for Assam, Meghalaya, Nagaland, Manipur, Mizoram, Tripura, and Arunachal Pradesh.
- 🎨 **Aesthetic Auth** — Custom-built, glassmorphic Firebase Authentication system (Email/Social).
- 🧠 **AI Travel Planner** — Intelligent itinerary generation for personalized journeys.
- 💳 **Seamless Payments** — Secure Razorpay integration for instant bookings.
- 📊 **User Dashboard** — Real-time booking management and travel history through Firestore.
- 🕹️ **3D Visuals** — Hardware-accelerated Three.js environments and GSAP-powered motion design.

---

## 🛠️ High-End Tech Stack

```mermaid
graph TD
    A[Frontend] --> B[Vanilla HTML5/CSS3]
    A --> C[Three.js / WebGL]
    A --> D[GSAP / ScrollTrigger]
    
    E[Services] --> F[Firebase Auth]
    E --> G[Cloud Firestore]
    E --> H[Razorpay API]
    
    I[Deployment] --> J[Vercel Edge]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#ccf,stroke:#333,stroke-width:2px
    style I fill:#cfc,stroke:#333,stroke-width:2px
```

---

## 🚀 Dev Setup

Ashtadisha uses **ES Modules** (import/export), so it requires a local server to run.

```bash
# Option 1: Double-click run_website.bat (Windows)
# Automatically uses python server.py if available.

# Option 2: Python (Preferred)
python server.py

# Option 3: Manual Python server
python -m http.server 8000
```

---

## 📂 Architecture

```text
├── index.html              # Immersive SPA Entry
├── dashboard.html          # Dynamic User Portal
├── assets/
│   ├── auth/               # Aesthetic UI Assets
│   └── readme/             # 3D README Visuals
├── js/
│   ├── auth.js             # Firebase Auth Core
│   ├── firebase.js         # Firestore & Database
│   ├── payment.js          # Razorpay Logic
│   └── main.js             # Three.js & UI orchestration
└── css/
    ├── main.css            # Modular CSS Entry
    └── auth.css            # Glassmorphism Design
```

---

<div align="center">
  <img src="https://img.shields.io/badge/Made%20with-♥-FF0000?style=flat-square" />
  <br />
  <b>Ashtadisha — Defining Northeast Tourism for the Digital Age.</b>
</div>
