# Ashtadisha (Seven Sisters) 🏔️

**Gateway to Northeast India**
*Where Mist Meets Mountain. Where Culture Becomes Journey.*

Ashtadisha is a premium, bilingual (English & Hindi) travel platform dedicated to the 7 Sister States of Northeast India (Assam, Meghalaya, Nagaland, Manipur, Mizoram, Tripura, Arunachal Pradesh) and Sikkim.

## 🚀 Features

*   **Bilingual Interface:** Seamlessly translates the experience for English and Hindi speakers.
*   **AI Trip Planner:** Generate personalized, day-by-day itineraries based on budget, duration, and preferences. *(Features a local mock-generator for offline demonstrations).*
*   **Mock Payment Gateway:** A native UPI-style checkout modal that captures dummy card/UPI details and saves bookings securely into the database without requiring external API keys.
*   **Dashboard & Booking Management:** Track your generated AI plans, active trips, and past bookings in a clean user dashboard.
*   **Component-Driven Frontend:** Built with vanilla JS and ES Modules for high performance.
*   **Modern Aesthetics:** Glassmorphism, smooth scrolling (Lenis), and micro-interactions (GSAP) paired with a beautiful custom cursor.

## 🛠️ Tech Stack

### Frontend
*   **HTML5 & Vanilla CSS3** (Custom design system, CSS variables, dark/light mode)
*   **JavaScript (ES Modules)** for dynamic component loading (`componentLoader.js`)
*   **Firebase Authentication:** Google, Facebook, and Email sign-in capabilities.
*   **Libraries:** GSAP (ScrollTrigger), Anime.js, AOS, Lenis (Smooth Scroll).

### Backend
*   **Python 3.10+**
*   **FastAPI** for high-performance REST APIs
*   **MySQL Database** for persistent storage of users, enquiries, and bookings
*   **Uvicorn** for running the ASGI server

## ⚙️ How to Run Locally

Because the frontend uses ES Modules (`type="module"`), the project requires a local web server to function properly.

### 1. Start the Frontend Server
If you have Python installed, you can easily start a local server:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.
*(Alternatively, you can just double-click the `run_website.bat` file if you are on Windows).*

### 2. Start the Python Backend Server
To enable the booking engine and database saving, start the FastAPI server:
```bash
cd python_backend
pip install -r requirements.txt
uvicorn backend:app --host 0.0.0.0 --port 5000 --reload
```
Ensure your local MySQL instance is running with a database named `ashtadisha_db` and credentials matching `backend.py`.

## 📂 Project Structure

*   `/components/` - Reusable HTML blocks (Header, Footer, Booking form, etc.) loaded dynamically.
*   `/css/` - Modular stylesheets (`global.css`, `layout.css`, `planner-page.css`, etc.)
*   `/js/` - Vanilla JavaScript logic split by feature (`planner.js`, `booking.js`, `firebase.js`).
*   `/python_backend/` - The FastAPI backend service (`backend.py`).
*   `/assets/` - Images, videos, and fonts used across the site.
*   `index.html` - The main application shell and entry point.

## 🛡️ License
Proprietary / All Rights Reserved.
