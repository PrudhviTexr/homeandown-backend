from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..services.otp_service import send_otp, verify_otp
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
def send_otp_endpoint(req: SendOTPRequest, _=Depends(require_api_key)):
    from ..services.otp_service import send_email_otp
    import asyncio
    
    # Call the async function
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    token = loop.run_until_complete(send_email_otp(req.email, req.action or "email_verification"))
    
    # Return in format frontend expects
    return {"success": True, "sent": True, "otp": token}


@router.post("/verify-otp")
def verify_otp_endpoint(req: VerifyOTPRequest):
    from ..services.otp_service import verify_email_otp
    
    ok = verify_email_otp(req.email, req.otp, req.action or "email_verification")
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Return in format frontend expects
    return {"success": True}
