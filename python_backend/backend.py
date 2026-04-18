import os
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import mysql.connector
from mysql.connector import errorcode

# Initialize FastAPI app
app = FastAPI(title="Ashtadisha API")

# Allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database Configuration ─────────────────────────────────────────────────────
DB_CONFIG = {
    'user': 'root',
    'password': 'wasd',  # ← Your MySQL root password
    'host': '127.0.0.1',
    'autocommit': True,
    'connection_timeout': 10,
}
DB_NAME = 'ashtadisha_db'

# ── Auto-Setup: Create DB + Tables if they don't exist ────────────────────────
def ensure_database():
    """Runs on startup — creates database and all tables if missing."""
    print("[DB] Running startup database check...")
    
    # Step 1: Connect without specifying a database
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("[DB] Connected to MySQL server OK.")
    except mysql.connector.Error as e:
        print(f"[DB] [ERROR] CANNOT CONNECT TO MYSQL: {e}")
        print("[DB] Check your password and ensure MySQL Server is running!")
        return

    # Step 2: Create database if needed
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` DEFAULT CHARACTER SET 'utf8mb4'")
        print(f"[DB] Database '{DB_NAME}' OK.")
    except mysql.connector.Error as e:
        print(f"[DB] [ERROR] Failed to create database: {e}")
        conn.close()
        return

    # Step 3: Switch to the database
    try:
        cursor.execute(f"USE `{DB_NAME}`")
    except mysql.connector.Error as e:
        print(f"[DB] [ERROR] Failed to USE database: {e}")
        conn.close()
        return

    # Step 4: Create tables one by one
    tables = {
        "users": """
            CREATE TABLE IF NOT EXISTS `users` (
              `uid` varchar(128) NOT NULL,
              `name` varchar(255) NOT NULL DEFAULT 'Traveler',
              `email` varchar(255) NOT NULL DEFAULT '',
              `photoURL` text,
              `phone` varchar(50) DEFAULT NULL,
              `city` varchar(100) DEFAULT NULL,
              `totalBookings` int DEFAULT 0,
              `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
              `updatedAt` datetime DEFAULT NULL,
              PRIMARY KEY (`uid`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        "enquiries": """
            CREATE TABLE IF NOT EXISTS `enquiries` (
              `id` int NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `email` varchar(255) NOT NULL,
              `phone` varchar(50) DEFAULT NULL,
              `destination` varchar(255) DEFAULT NULL,
              `travelMonth` varchar(50) DEFAULT NULL,
              `message` text,
              `status` varchar(50) DEFAULT 'new',
              `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        "bookings": """
            CREATE TABLE IF NOT EXISTS `bookings` (
              `id` int NOT NULL AUTO_INCREMENT,
              `userId` varchar(128) NOT NULL,
              `packageName` varchar(255) NOT NULL,
              `destination` varchar(255) DEFAULT NULL,
              `travelers` int DEFAULT 1,
              `travelDate` varchar(50) DEFAULT NULL,
              `totalAmount` decimal(10,2) DEFAULT 0.00,
              `paymentId` varchar(255) DEFAULT NULL,
              `itineraryText` LONGTEXT DEFAULT NULL,
              `bookingSource` varchar(32) DEFAULT NULL,
              `status` varchar(50) DEFAULT 'confirmed',
              `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        "packages": """
            CREATE TABLE IF NOT EXISTS `packages` (
              `id` varchar(128) NOT NULL,
              `title` varchar(255) NOT NULL,
              `description` text,
              `price` decimal(10,2) DEFAULT NULL,
              `duration` varchar(100) DEFAULT NULL,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    }

    for table_name, ddl in tables.items():
        try:
            cursor.execute(ddl)
            print(f"[DB] Table '{table_name}' OK.")
        except mysql.connector.Error as e:
            print(f"[DB] [ERROR] Failed to create table '{table_name}': {e}")

    # Step 5: Insert default sample package
    try:
        cursor.execute("SELECT COUNT(*) FROM packages")
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute(
                "INSERT INTO packages (id, title, price, duration) VALUES (%s, %s, %s, %s)",
                ("assam-explorer", "Assam Explorer", 12000.00, "5 Days 4 Nights")
            )
            print("[DB] Sample package inserted.")
    except mysql.connector.Error as e:
        print(f"[DB] Warning: Could not insert sample package: {e}")

    # Additive migration for existing deployments (ignore duplicate column)
    try:
        cursor.execute("ALTER TABLE bookings ADD COLUMN bookingSource VARCHAR(32) NULL")
        print("[DB] Migration: bookingSource column ensured on bookings.")
    except mysql.connector.Error as e:
        if e.errno != errorcode.ER_DUP_FIELDNAME:
            print(f"[DB] [WARN] bookingSource migration: {e}")

    cursor.close()
    conn.close()
    print("[DB] [SUCCESS] Database auto-setup complete — all systems ready!")


# Run the setup when server boots
ensure_database()

# ── Helper: Get a connection to the correct database ──────────────────────────
def get_db():
    config = {**DB_CONFIG, 'database': DB_NAME}
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"[DB] Connection error: {err}")
        return None

# ── Pydantic Models ────────────────────────────────────────────────────────────
class UserData(BaseModel):
    uid: str
    name: Optional[str] = "Traveler"
    email: Optional[str] = ""
    photoURL: Optional[str] = ""
    phone: Optional[str] = None
    city: Optional[str] = None

class EnquiryData(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    destination: Optional[str] = None
    travelMonth: Optional[str] = None
    message: Optional[str] = None

class BookingData(BaseModel):
    userId: str
    packageName: str
    destination: Optional[str] = None
    travelers: Optional[int] = 1
    travelDate: Optional[str] = None
    totalAmount: Optional[float] = 0.0
    paymentId: Optional[str] = None
    itineraryText: Optional[str] = None
    status: Optional[str] = "CONFIRMED"
    bookingSource: Optional[str] = None

# ── Global exception handler (shows full traceback in terminal) ───────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"\n[API ERROR] {request.method} {request.url}")
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/api/users")
async def save_user(data: UserData):
    if not data.uid:
        raise HTTPException(status_code=400, detail="Missing uid")

    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed. Is MySQL running?")

    cursor = None
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT uid FROM users WHERE uid = %s", (data.uid,))
        user = cursor.fetchone()

        if user:
            # Smart update: only update fields provided in the request
            update_fields = []
            update_values = []
            
            if data.name is not None:
                update_fields.append("name=%s")
                update_values.append(data.name)
            if data.email is not None and data.email != "":
                update_fields.append("email=%s")
                update_values.append(data.email)
            if data.photoURL is not None:
                update_fields.append("photoURL=%s")
                update_values.append(data.photoURL)
            if data.phone is not None:
                update_fields.append("phone=%s")
                update_values.append(data.phone)
            if data.city is not None:
                update_fields.append("city=%s")
                update_values.append(data.city)
                
            if update_fields:
                query = f"UPDATE users SET {', '.join(update_fields)}, updatedAt=NOW() WHERE uid=%s"
                update_values.append(data.uid)
                cursor.execute(query, tuple(update_values))
            
            action = "updated"
        else:
            cursor.execute(
                "INSERT INTO users (uid, name, email, photoURL, phone, city) VALUES (%s, %s, %s, %s, %s, %s)",
                (data.uid, data.name, data.email, data.photoURL, data.phone, data.city)
            )
            action = "created"

        print(f"[API] User {action}: {data.uid} ({data.email})")
        return {"success": True, "action": action, "uid": data.uid}

    except Exception as e:
        print(f"[API ERROR] save_user failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.get("/api/users/{uid}")
async def get_user(uid: str) -> Dict[str, Any]:
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE uid = %s", (uid,))
        user = cursor.fetchone()
        
        if not user:
            # Return a default object if not found, consistent with frontend expectations
            return {
                "uid": uid,
                "name": "Traveler",
                "email": "",
                "photoURL": "",
                "city": "Unknown",
                "totalBookings": 0
            }

        # Convert timestamps to strings
        if user.get('createdAt'): user['createdAt'] = user['createdAt'].isoformat()
        if user.get('updatedAt'): user['updatedAt'] = user['updatedAt'].isoformat()
        
        return user

    except Exception as e:
        print(f"[API ERROR] get_user failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.post("/api/enquiries")
async def save_enquiry(data: EnquiryData):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection failed")

    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO enquiries (name, email, phone, destination, travelMonth, message) VALUES (%s,%s,%s,%s,%s,%s)",
            (data.name, data.email, data.phone, data.destination, data.travelMonth, data.message)
        )
        return {"success": True, "id": str(cursor.lastrowid)}
    except Exception as e:
        print(f"[API ERROR] save_enquiry: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.post("/api/bookings")
async def create_booking(data: BookingData):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection failed")

    cursor = None
    try:
        cursor = conn.cursor()
        st = data.status or "CONFIRMED"
        cursor.execute(
            """INSERT INTO bookings (userId, packageName, destination, travelers, travelDate, totalAmount, paymentId, itineraryText, status, bookingSource)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (data.userId, data.packageName, data.destination,
             data.travelers, data.travelDate, data.totalAmount, data.paymentId, data.itineraryText,
             st, data.bookingSource)
        )
        booking_id = cursor.lastrowid
        cursor.execute("UPDATE users SET totalBookings = totalBookings + 1 WHERE uid = %s", (data.userId,))
        return {"success": True, "id": str(booking_id)}
    except Exception as e:
        print(f"[API ERROR] create_booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.get("/api/bookings/{uid}")
async def get_user_bookings(uid: str) -> List[Dict[str, Any]]:
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection failed")

    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM bookings WHERE userId = %s ORDER BY createdAt DESC", (uid,))
        bookings = cursor.fetchall()
        for b in bookings:
            if b.get('createdAt'): b['createdAt'] = b['createdAt'].isoformat()
            if b.get('travelDate') and hasattr(b['travelDate'], 'isoformat'):
                b['travelDate'] = b['travelDate'].isoformat()
        return bookings
    except Exception as e:
        print(f"[API ERROR] get_user_bookings: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.get("/api/packages")
async def get_packages() -> Dict[str, Any]:
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=500, detail="DB connection failed")

    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM packages")
        packages_list = cursor.fetchall()
        return {pkg['id']: pkg for pkg in packages_list}
    except Exception as e:
        print(f"[API ERROR] get_packages: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


@app.post("/api/uploadReceipt")
async def upload_receipt():
    return {"success": True, "url": "local_receipt_saved.html"}


@app.get("/health")
async def health():
    """Quick connectivity check — visit http://localhost:5000/health"""
    conn = get_db()
    if conn and conn.is_connected():
        conn.close()
        return {"status": "ok", "database": "connected"}
    return JSONResponse(status_code=503, content={"status": "error", "database": "unreachable"})


if __name__ == '__main__':
    import uvicorn
    print("Starting Ashtadisha FastAPI Backend via Uvicorn on port 5000...")
    uvicorn.run("backend:app", host='0.0.0.0', port=5000, reload=True)
