from __future__ import annotations
import secrets
from passlib.context import CryptContext
import os, datetime as dt
import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(password, password_hash)

def generate_token() -> str:
    """Generate secure random token"""
    return secrets.token_urlsafe(32)

ALGO = "HS256"

def issue_user_token(user_id: str, user_type: str) -> str:
    """Issue JWT token for user"""
    secret = os.getenv("JWT_SECRET", "devsecret")
    # Read expiration hours from env (fallback to 24)
    exp_hours_env = os.getenv("JWT_EXPIRATION_HOURS")
    try:
        exp_hours = int(exp_hours_env) if exp_hours_env is not None else 24
        if exp_hours <= 0:
            raise ValueError("non-positive")
    except Exception:
        exp_hours = 24

    now = dt.datetime.utcnow()
    # Use integer UNIX timestamps for exp and iat to be compatible with all PyJWT versions
    exp_ts = int((now + dt.timedelta(hours=exp_hours)).timestamp())
    iat_ts = int(now.timestamp())
    payload = {
        "sub": str(user_id),
        "role": user_type,
        "exp": exp_ts,
        "iat": iat_ts,
    }
    try:
        token = jwt.encode(payload, secret, algorithm=ALGO)
    except Exception as e:
        # Log detailed debug info to make production issues diagnosable
        try:
            print(f"[JWT] Encode error: {e}")
            print(f"[JWT] Payload: {payload}")
            print(f"[JWT] Secret available: {'yes' if secret else 'no'}, len(secret)={len(secret) if secret else 0}")
        except Exception:
            pass
        raise

    # PyJWT may return bytes on some versions; ensure we return a str
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

def verify_user_token(token: str) -> dict | None:
    """Verify JWT token and return claims"""
    secret = os.getenv("JWT_SECRET", "devsecret")
    try:
        data = jwt.decode(token, secret, algorithms=[ALGO])
        return data
    except jwt.ExpiredSignatureError:
        print("[JWT] Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"[JWT] Invalid token: {e}")
        return None
    except Exception as e:
        print(f"[JWT] Token verification error: {e}")
        return None


def generate_refresh_token(length: int = 48) -> str:
    """Generate a secure refresh token string"""
    return secrets.token_urlsafe(length)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token for storage using bcrypt (passlib)"""
    return pwd_context.hash(token)


def verify_refresh_token_hash(token: str, token_hash: str) -> bool:
    """Verify a refresh token against its stored hash"""
    try:
        return pwd_context.verify(token, token_hash)
    except Exception:
        return False