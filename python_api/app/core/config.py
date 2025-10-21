import os

class Settings:
    # Supabase Configuration (Database Only)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://ajymffxpunxoqcmunohx.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # SMTP Configuration
    GMAIL_USERNAME: str = os.getenv("GMAIL_USERNAME", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    
    # Site Configuration
    SITE_URL: str = os.getenv("SITE_URL", "https://homeandown.com")
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "https://homeandown.com")
    PYTHON_API_KEY: str = os.getenv("PYTHON_API_KEY", "")
    
    # Twilio Configuration for OTP
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "")
    
    # OTP Configuration
    OTP_EXP_MIN: int = int(os.getenv("OTP_EXP_MIN", "5"))
    
    # JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Resend API Key (server-side)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_TEMPLATE_ID: str = os.getenv("RESEND_TEMPLATE_ID", "")
    RESEND_SENDER: str = os.getenv("RESEND_SENDER", "")

# Global settings instance
settings = Settings()

# Debug environment on startup
print(f"[CONFIG] Configuration loaded:")
print(f"[CONFIG]   SUPABASE_URL: {'SET' if settings.SUPABASE_URL else 'MISSING'}")
print(f"[CONFIG]   SERVICE_ROLE_KEY: {'SET' if settings.SUPABASE_SERVICE_ROLE_KEY else 'MISSING'}")
print(f"[CONFIG]   GMAIL_USERNAME: {'SET' if settings.GMAIL_USERNAME else 'MISSING'}")
print(f"[CONFIG]   GMAIL_APP_PASSWORD: {'SET' if settings.GMAIL_APP_PASSWORD else 'MISSING'}")
print(f"[CONFIG]   PYTHON_API_KEY: {'SET' if settings.PYTHON_API_KEY else 'MISSING'}")