from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db.deps import get_db
from ..services.otp_service import send_otp, verify_otp
from ..core.security import require_api_key

router = APIRouter()


class SendOTPRequest(BaseModel):
    phone: str
    purpose: str | None = "verify"


class VerifyOTPRequest(BaseModel):
    phone: str
    token: str
    purpose: str | None = "verify"


@router.post("/send-otp")
def send_otp_endpoint(req: SendOTPRequest, db: Session = Depends(get_db), _=Depends(require_api_key)):
    from ..services.otp_service import send_otp_simple
    import asyncio
    
    # Call the async function
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    token = loop.run_until_complete(send_otp_simple(req.phone, req.purpose or "verify"))
    
    # For testing, include token in response when TWILIO_* not configured
    tw_sid = False
    try:
        import os
        tw_sid = bool(os.getenv("TWILIO_ACCOUNT_SID"))
    except Exception:
        pass
    
    # Return in format frontend expects
    return {"success": True, "sent": True, "otp": token if not tw_sid else None}


@router.post("/verify-otp")
def verify_otp_endpoint(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    from ..services.otp_service import verify_otp_simple
    
    ok = verify_otp_simple(req.phone, req.token, req.purpose or "verify")
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Return in format frontend expects
    return {"success": True}
