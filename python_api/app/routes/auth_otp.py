from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..core.security import require_api_key

router = APIRouter()


class SendOTPRequest(BaseModel):
    email: str  # Changed from phone to email
    action: str | None = "email_verification"  # Changed from purpose to action


class VerifyOTPRequest(BaseModel):
    email: str  # Changed from phone to email
    otp: str  # Changed from token to otp
    action: str | None = "email_verification"  # Changed from purpose to action


@router.post("/send-otp")
async def send_otp_endpoint(payload: dict):
    from ..services.otp_service import send_email_otp
    from fastapi import Request
    
    # Handle request body
    email = payload.get("email")
    action = payload.get("action", "email_verification")
    
    if not email:
        raise HTTPException(status_code=422, detail="email is required")
    
    print(f"[OTP] Received send OTP request for email: {email}")
    
    # Call the async function
    token = await send_email_otp(email, action)
    
    # Return in format frontend expects
    return {"success": True, "sent": True, "otp": token}


@router.post("/verify-otp")
async def verify_otp_endpoint(payload: dict):
    from ..services.otp_service import verify_email_otp
    
    # Handle request body
    email = payload.get("email")
    otp = payload.get("otp")
    action = payload.get("action", "email_verification")
    
    if not email or not otp:
        raise HTTPException(status_code=422, detail="email and otp are required")
    
    print(f"[OTP] Received verify OTP request for email: {email}")
    
    ok = verify_email_otp(email, otp, action)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Return in format frontend expects
    return {"success": True}
