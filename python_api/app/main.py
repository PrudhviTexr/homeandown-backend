import os
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, APIRouter, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import datetime as dt

# Load environment variables first
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / '.env'
    print(f"[ENV] Checking .env file at: {env_path}")

    # Check for BOM before loading
    with open(env_path, 'rb') as f:
        first_bytes = f.read(10)
        print(f"[ENV] First 10 bytes: {first_bytes.hex()}")

    if first_bytes.startswith(b'\xef\xbb\xbf'):
        print(f"[ENV] UTF-8 BOM detected! Removing BOM from {env_path}")
        with open(env_path, 'rb') as f:
            content = f.read()
        content = content[3:]  # Remove UTF-8 BOM
        with open(env_path, 'wb') as f:
            f.write(content)
        print(f"[ENV] UTF-8 BOM removed from {env_path}")
    elif first_bytes.startswith(b'\xff\xfe'):
        print(f"[ENV] UTF-16 BOM detected! Converting to UTF-8...")
        with open(env_path, 'rb') as f:
            content = f.read()
        # Remove UTF-16 BOM and decode as UTF-16
        content = content[2:].decode('utf-16')
        # Write back as UTF-8
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[ENV] Converted from UTF-16 to UTF-8")
    elif first_bytes.startswith(b'\xfe\xff'):
        print(f"[ENV] UTF-16 BE BOM detected! Converting to UTF-8...")
        with open(env_path, 'rb') as f:
            content = f.read()
        # Remove UTF-16 BE BOM and decode as UTF-16 BE
        content = content[2:].decode('utf-16-be')
        # Write back as UTF-8
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[ENV] Converted from UTF-16 BE to UTF-8")

    # Now try to load
    result = load_dotenv(env_path)
    print(f"[ENV] Environment loaded from: {env_path} (result: {result})")

except ImportError:
    print("[ENV] python-dotenv not available")
except Exception as e:
    print(f"[ENV] Error loading environment: {e}")
    import traceback
    print(f"[ENV] Full traceback: {traceback.format_exc()}")

# Import application components
try:
    from .core.config import settings
    print("[CONFIG] Settings loaded")
except Exception as e:
    print(f"[CONFIG] Settings error: {e}")
    class MinimalSettings:
        CORS_ORIGIN = "http://localhost:8080"
        SITE_URL = "http://localhost:8080"
        GMAIL_USERNAME = ""
        GMAIL_APP_PASSWORD = ""
        PYTHON_API_KEY = ""
        SUPABASE_URL = ""
        TWILIO_ACCOUNT_SID = ""
        TWILIO_AUTH_TOKEN = ""
    settings = MinimalSettings()

# CORS configuration - compute once and reuse in lifespan/app setup
cors_origins: List[str] = []
cors_setting = getattr(settings, "CORS_ORIGIN", None)
if cors_setting:
    cors_origins.extend([o.strip() for o in str(cors_setting).split(",") if o.strip()])
cors_origins.extend([
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    # Vite sometimes runs on different ports (8081 etc.) - include common dev hosts
    "http://localhost:8081",
    "http://127.0.0.1:8081",
])

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "="*60)
    print("Home & Own Python API Starting Up...")
    print("="*60)
    print(f"Site URL: {settings.SITE_URL}")
    print(f"CORS Origins: {cors_origins}")
    print(f"Email configured: {bool(settings.GMAIL_USERNAME and settings.GMAIL_APP_PASSWORD)}")
    print(f"SMS/OTP configured: {bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)}")
    print(f"Supabase URL: {bool(settings.SUPABASE_URL)}")
    print(f"API Key configured: {bool(settings.PYTHON_API_KEY)}")

    # Test database connection on startup
    try:
        from .db.supabase_client import db
        print(f"[DB] Testing Supabase database connection...")
        try:
            # Test database connection
            sample_data = await db.admin_select("properties", limit=1)
            print(f"[DB] Supabase connection successful!")
            print(f"[DB] Sample data available: {len(sample_data) if sample_data else 0} properties")
        except Exception as e:
            print(f"[DB] Sample query failed: {e}")
            print(f"[DB] Continuing with Supabase client (keys may need updating)")
    except Exception as e:
        print(f"[DB] Supabase connection failed: {e}")
        print(f"[DB] Server will start but database operations may fail")

    # Dev convenience: ensure a default admin user exists so admin login works out-of-the-box
    try:
        from .core.crypto import hash_password
        import uuid
        ADMIN_EMAIL = getattr(settings, 'DEFAULT_ADMIN_EMAIL', 'admin@homeandown.com').lower()
        ADMIN_PASSWORD = getattr(settings, 'DEFAULT_ADMIN_PASSWORD', 'Frisco@2025')
        try:
            users = await db.admin_select('users', filters={'email': ADMIN_EMAIL})
            if not users:
                now = dt.datetime.now(dt.timezone.utc).isoformat()
                admin_data = {
                    'id': str(uuid.uuid4()),
                    'email': ADMIN_EMAIL,
                    'password_hash': hash_password(ADMIN_PASSWORD),
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'user_type': 'admin',
                    'status': 'active',
                    'verification_status': 'verified',
                    'email_verified': True,
                    'created_at': now,
                    'updated_at': now
                }
                await db.insert('users', admin_data)
                print(f"[DB] Default admin created: {ADMIN_EMAIL}")
            else:
                print(f"[DB] Default admin already exists: {ADMIN_EMAIL}")
        except Exception as e:
            print(f"[DB] Could not ensure default admin: {e}")
    except Exception as e:
        print(f"[DB] Skipping admin seed due to error: {e}")

    print("API Ready and Listening!")
    print("="*60 + "\n")
    yield

app = FastAPI(
    title="Home & Own API",
    version="1.0.0",
    description="Python API for Home & Own with Supabase database",
    lifespan=lifespan,
    root_path=os.getenv("ROOT_PATH", "")  # Use ROOT_PATH from environment for GoDaddy deployment
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/ping", tags=["health"])
async def ping():
    """A simple endpoint to check if the API is running."""
    return {"pong": dt.datetime.utcnow().isoformat(), "status": "running", "message": "API is working"}

@app.get("/debug", tags=["debug"])
async def debug():
    """Debug endpoint to check API configuration and registered routes."""
    # Get actual routes from the app
    actual_routes = []
    admin_routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            actual_routes.append(route.path)
            if '/admin/' in route.path:
                admin_routes.append(route.path)
    
    return {
        "status": "running",
        "version": "1.0.2",  # Version bump to force redeploy
        "timestamp": dt.datetime.utcnow().isoformat(),
        "routes": actual_routes,
        "admin_routes": admin_routes,
        "admin_routes_count": len(admin_routes),
        "cors_origins": cors_origins,
        "root_path": os.getenv("ROOT_PATH", ""),
        "site_url": getattr(settings, "SITE_URL", "not set")
    }

# Import and include routes
try:
    print("[ROUTES] Attempting to import routes...")
    
    # Import routes one by one to identify any import issues
    try:
        from .routes import auth
        print("[ROUTES] Auth imported successfully")
    except Exception as e:
        print(f"[ROUTES] Auth import failed: {e}")
    
    try:
        from .routes import properties
        print("[ROUTES] Properties imported successfully")
    except Exception as e:
        print(f"[ROUTES] Properties import failed: {e}")
    
    try:
        from .routes import admin
        print("[ROUTES] Admin imported successfully")
        print(f"[ROUTES] Admin router: {admin.router}")
        print(f"[ROUTES] Admin router routes: {[route.path for route in admin.router.routes]}")
    except Exception as e:
        print(f"[ROUTES] Admin import failed: {e}")
        import traceback
        print(f"[ROUTES] Admin import traceback: {traceback.format_exc()}")
    
    try:
        from .routes import users, uploads, records, maintenance, seller, buyer, emails, agent, locations, analytics
        print("[ROUTES] Other routes imported successfully")
    except Exception as e:
        print(f"[ROUTES] Other routes import failed: {e}")
    
    print("[ROUTES] All route modules imported successfully")

    from fastapi import APIRouter

    # Mount routes with /api prefix for frontend compatibility
    print(f"[ROUTES] Mounting auth router: {auth.router}")
    print(f"[ROUTES] Auth router routes: {[route.path for route in auth.router.routes]}")
    
    # Test mounting auth router first
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    print(f"[ROUTES] Auth router mounted successfully")
    
    print(f"[ROUTES] Mounting properties router: {properties.router}")
    app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
    app.include_router(records.router, prefix="/api", tags=["records"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
    app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
    app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
    app.include_router(maintenance.router, prefix="/api", tags=["maintenance"])
    app.include_router(seller.router, prefix="/api", tags=["seller"])
    app.include_router(buyer.router, prefix="/api", tags=["buyer"])
    app.include_router(agent.router, prefix="/api", tags=["agent"])
    app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

    print("[ROUTES] All application routes loaded with /api prefix")
except Exception as e:
    print(f"[ROUTES] Route error: {e}")
    import traceback
    print(f"[ROUTES] Full traceback: {traceback.format_exc()}")

    # Try importing each route individually to see which one fails
    routes_to_test = ['auth', 'properties', 'users', 'admin', 'uploads', 'records', 'maintenance']
    for route_name in routes_to_test:
        try:
            route_module = __import__(f'app.routes.{route_name}', fromlist=[route_name])
            print(f"[ROUTES] {route_name} imported successfully")
        except Exception as route_error:
            print(f"[ROUTES] {route_name} import failed: {route_error}")

    # Fallback routes removed to prevent conflicts with real routes

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Home & Own API</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #f8fafc; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 4px; }
            .ok { background: #dcfce7; color: #166534; }
            .error { background: #fecaca; color: #991b1b; }
            pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Home & Own Python API</h1>
            <p><strong>Status:</strong> <span class="status ok">Running</span></p>
            <p><strong>Database:</strong> <span class="status ok">SQLite</span></p>
            <p><strong>Email:</strong> <span class="status ok">Gmail SMTP</span></p>
            <p><strong>OTP:</strong> <span class="status ok">Twilio SMS</span></p>
            
            <h2>Available Endpoints:</h2>
            <ul>
                <li><a href="/docs" target="_blank">API Documentation (Swagger)</a></li>
                <li><a href="/health">Health Check</a></li>
                <li><a href="/properties">Properties List</a></li>
            </ul>
            
            <h2>Quick Tests:</h2>
            <pre>
# Test health
curl http://localhost:8000/health

# Test properties
curl http://localhost:8000/properties

# Test with filters
curl "http://localhost:8000/properties?featured=true&city=Hyderabad"
            </pre>
        </div>
    </body>
    </html>
    """

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        print("[HEALTH] Health check requested")
        
        db_status = False
        db_error = None
        try:
            from .db.supabase_client import db
            test_result = await db.select("properties", limit=1)
            db_status = True
            print(f"[HEALTH] Supabase test successful (found {len(test_result) if test_result else 0} sample records)")
        except Exception as e:
            print(f"[HEALTH] Supabase test failed: {e}")
            db_error = str(e)
        
        email_configured = bool(settings.GMAIL_USERNAME and settings.GMAIL_APP_PASSWORD)
        sms_configured = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
        
        health_data = {
            "ok": True,
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
            "database": "supabase",
            "db_connected": db_status,
            "db_error": db_error,
            "email_configured": email_configured,
            "sms_configured": sms_configured,
            "api_key_set": bool(settings.PYTHON_API_KEY),
            "supabase_url": bool(settings.SUPABASE_URL),
            "environment": "development" if "localhost" in settings.SITE_URL else "production"
        }
        
        print(f"[HEALTH] Health status: {health_data}")
        return health_data
        
    except Exception as e:
        print(f"[HEALTH] Health check error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "error": str(e),
                "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()
            }
        )

# Explicit properties endpoint to ensure it works
@app.get("/properties", tags=["properties-direct"])
async def direct_properties(
    listing_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None)
):
    """Direct properties endpoint - bypasses router mounting issues"""
    try:
        print(f"[DIRECT-PROPERTIES] Direct properties endpoint called")
        print(f"[DIRECT-PROPERTIES] Params: listing_type={listing_type}, city={city}, state={state}")
        
        # Import and call the properties function directly
        from .routes.properties import get_properties
        result = await get_properties(
            city=city,
            state=state,
            listing_type=listing_type,
            property_type=None,
            min_price=None,
            max_price=None,
            min_rent=None,
            max_rent=None,
            featured=None,
            status="active",
            commercial_subtype=None,
            land_type=None,
            min_area=None,
            max_area=None,
            bedrooms=None,
            bathrooms=None,
            furnishing_status=None,
            facing=None,
            owner_id=None,
            added_by=None
        )
        
        print(f"[DIRECT-PROPERTIES] Returning {len(result) if isinstance(result, list) else 'unknown'} properties")
        return result
        
    except Exception as e:
        print(f"[DIRECT-PROPERTIES] Error: {e}")
        import traceback
        print(f"[DIRECT-PROPERTIES] Traceback: {traceback.format_exc()}")
        
        # Return test data as fallback
        return [
            {
                "id": "fallback-1",
                "title": "Fallback Property 1",
                "listing_type": listing_type or "SALE",
                "city": city or "Test City",
                "state": state or "Test State",
                "price": 1000000,
                "note": "This is fallback data due to error: " + str(e)
            }
        ]

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Global exception on {request.method} {request.url}: {exc}")
    import traceback
    print(f"[ERROR] Traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()
        }
    )