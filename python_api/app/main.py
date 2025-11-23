from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import datetime as dt
import traceback

from .core.config import settings

app = FastAPI(
    title="Home & Own Python API",
    description="API for Home & Own, a real estate platform.",
    version="1.0.0"
)

# Middleware
cors_origins = []
try:
    cors_raw = getattr(settings, 'CORS_ORIGIN', '') or ''
    cors_origins = [o.strip() for o in cors_raw.split(',') if o.strip()]
except Exception:
    cors_origins = []

# Add sensible local defaults if not already included
# IMPORTANT: When allow_credentials=True, we CANNOT use wildcard "*"
# We must explicitly list all allowed origins
local_defaults = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8082",  # Main frontend port
    "http://127.0.0.1:8082",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8083",
    "http://127.0.0.1:8083",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
for d in local_defaults:
    if d not in cors_origins:
        cors_origins.append(d)

# If no origins specified, use localhost defaults for development
if not cors_origins:
    cors_origins = local_defaults

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Explicit list (required when allow_credentials=True)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Import routes after app initialization to avoid circular dependencies
from .routes import (
    auth, properties, users, uploads, records, maintenance,
    seller, buyer, emails, agent, locations, analytics, admin,
    push_notifications, advanced_analytics
)
from .routes import auth_otp, agent_assignments

@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print("============================================================")
    print("Home & Own Python API Starting Up...")
    print("============================================================")
    print(f"Site URL: {settings.SITE_URL}")
    print(f"CORS Origins: {[origin.strip() for origin in settings.CORS_ORIGIN.split(',')]}")
    print(f"Email configured: {bool(settings.GMAIL_USERNAME and settings.GMAIL_APP_PASSWORD)}")
    print(f"SMS/OTP configured: {bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)}")
    print(f"Supabase URL: {bool(settings.SUPABASE_URL)}")
    print(f"API Key configured: {bool(settings.PYTHON_API_KEY)}")

    # Test and report database connection on startup
    try:
        from .db.supabase_client import db
        print(f"[DB] Testing Supabase database connection...")
        sample_data = await db.select("properties", limit=1)
        print(f"[DB] Supabase connection successful! Sample data: {len(sample_data)} properties")

        # Fetch and print database statistics
        users_count_res = await db.select("users", select="count")
        properties_count_res = await db.select("properties", select="count")
        bookings_count_res = await db.select("bookings", select="count")
        
        users_count = users_count_res[0]['count'] if users_count_res else 0
        properties_count = properties_count_res[0]['count'] if properties_count_res else 0
        bookings_count = bookings_count_res[0]['count'] if bookings_count_res else 0
        
        print("\n" + "="*60)
        print("📊 DATABASE STATISTICS")
        print("="*60)
        print(f"👥 Total users: {users_count}")
        print(f"🏠 Total properties: {properties_count}")
        print(f"📅 Total bookings: {bookings_count}")
        print("="*60 + "\n")

    except Exception as e:
        print(f"[DB] Supabase connection or query failed: {e}")

    # Ensure default admin user exists
    try:
        from .core.crypto import get_password_hash
        from .db.supabase_client import db
        ADMIN_EMAIL = getattr(settings, 'DEFAULT_ADMIN_EMAIL', 'admin@homeandown.com')
        ADMIN_PASSWORD = getattr(settings, 'DEFAULT_ADMIN_PASSWORD', 'Frisco@2025')
        users = await db.select('users', filters={'email': ADMIN_EMAIL})
        if not users:
            print("[DB] Default admin not found, creating...")
            await db.insert('users', {
                'email': ADMIN_EMAIL,
                'hashed_password': get_password_hash(ADMIN_PASSWORD),
                'user_type': 'admin',
                'first_name': 'Admin',
                'status': 'active',
                'verification_status': 'verified',
                'email_verified': True
            })
        else:
            print(f"[DB] Default admin already exists: {ADMIN_EMAIL}")
    except Exception as e:
        print(f"[DB] Could not ensure default admin: {e}")

    print("============================================================")
    print("API Ready and Listening!")
    print("============================================================")

# Include routers with prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(auth_otp.router, prefix="/api/auth", tags=["auth"])
app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(records.router, prefix="/api/records", tags=["records"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["maintenance"])
app.include_router(seller.router, prefix="/api/seller", tags=["seller"])
app.include_router(buyer.router, prefix="/api/buyer", tags=["buyer"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(agent_assignments.router, prefix="/api", tags=["agent-assignments"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(advanced_analytics.router, prefix="/api", tags=["advanced-analytics"])
app.include_router(push_notifications.router, prefix="/api", tags=["push-notifications"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to ensure errors are properly handled"""
    print(f"[ERROR] Unhandled exception: {exc}")
    print(f"[ERROR] Traceback: {traceback.format_exc()}")
    # Let FastAPI handle the response - CORS middleware will add headers
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.get("/api", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to Home & Own API - {dt.datetime.utcnow()}"}