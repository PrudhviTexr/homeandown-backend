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
    token = send_otp(db, req.phone, purpose=req.purpose or "verify")
    # For testing, include token in response when TWILIO_* not configured
    tw_sid = False
    try:
        import os
        tw_sid = bool(os.getenv("TWILIO_ACCOUNT_SID"))
    except Exception:
        pass
    return {"ok": True, "sent": True, "token": token if not tw_sid else None}


@router.post("/verify-otp")
def verify_otp_endpoint(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    ok = verify_otp(db, req.phone, req.token, purpose=req.purpose or "verify")
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"ok": True}
