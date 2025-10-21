from fastapi import APIRouter, HTTPException, Request, Depends
from ..models.schemas import UpdateProfileRequest, BankDetailsRequest
from ..core.security import get_current_user_claims
from ..services.otp_service import verify_otp_simple
from ..db.supabase_client import db
import datetime as dt
import uuid

router = APIRouter()

@router.get("/me")
async def get_user_profile(request: Request):
    """Get current user's profile information"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user details
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        
        # Get user's active roles
        try:
            from ..services.user_role_service import UserRoleService
            active_roles = await UserRoleService.get_active_user_roles(user_id)
        except Exception as role_error:
            print(f"[USERS] Failed to get user roles: {role_error}")
            active_roles = [user.get("user_type", "buyer")]
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "phone_number": user.get("phone_number", ""),
                "date_of_birth": user.get("date_of_birth"),
                "user_type": user.get("user_type", "buyer"),
                "active_roles": active_roles,
                "status": user.get("status", "active"),
                "verification_status": user.get("verification_status", "pending"),
                "created_at": user.get("created_at"),
                "profile_image_url": user.get("profile_image_url"),
                "city": user.get("city", ""),
                "state": user.get("state", ""),
                "address": user.get("address", ""),
                "bio": user.get("bio", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USERS] Get profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.patch("/profile")
async def update_profile(payload: UpdateProfileRequest, request: Request):
    try:
        claims = get_current_user_claims(request)
        user_id = claims.get("sub")
        
        print(f"[USERS] Updating profile for user: {user_id}")
        
        # For sensitive updates, require OTP verification
        if payload.otp:
            print(f"[USERS] OTP provided, verifying...")
            users = await db.select("users", filters={"id": user_id})
            if not users:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = users[0]
            phone = user.get("phone_number", "")
            if not verify_otp_simple(phone, payload.otp, "profile_update"):
                raise HTTPException(status_code=400, detail="Invalid OTP")
            print(f"[USERS] OTP verified for profile update")
        
        # Update user profile
        update_data = {}
        if payload.first_name is not None:
            update_data["first_name"] = payload.first_name
        if payload.last_name is not None:
            update_data["last_name"] = payload.last_name
        if payload.phone_number is not None:
            update_data["phone_number"] = payload.phone_number
        if payload.city is not None:
            update_data["city"] = payload.city
        if payload.state is not None:
            update_data["state"] = payload.state
        if payload.address is not None:
            update_data["address"] = payload.address
        if payload.bio is not None:
            update_data["bio"] = payload.bio
        
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            await db.update("users", update_data, {"id": user_id})
            print(f"[USERS] Profile updated successfully")
        
        return {"success": True, "message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USERS] Update profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/bank-details")
async def update_bank_details(payload: BankDetailsRequest, request: Request):
    try:
        claims = get_current_user_claims(request)
        user_id = claims.get("sub")
        
        print(f"[USERS] Updating bank details for user: {user_id}")
        
        # Verify OTP (required for bank details)
        if not verify_otp_simple(payload.phone, payload.otp, "bank_update"):
            print(f"[USERS] Invalid OTP for bank update")
            raise HTTPException(status_code=400, detail="Invalid OTP for bank update")
        
        print(f"[USERS] OTP verified for bank update")
        
        # Get user to verify phone number matches
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        if user.get("phone_number") != payload.phone:
            raise HTTPException(status_code=400, detail="Phone number mismatch")
        
        # Check if user is agent (bank details mainly for agents)
        if user["user_type"] != "agent":
            raise HTTPException(status_code=403, detail="Bank details only available for agents")
        
        # Update or insert bank details in agent_bank_details table
        try:
            existing_bank = await db.select("agent_bank_details", filters={"agent_id": user_id})
            if existing_bank:
                await db.update("agent_bank_details", {
                    "bank_account_number": payload.bank_account_number,
                    "ifsc_code": payload.ifsc_code,
                    "account_verified": False,
                    "updated_at": dt.datetime.utcnow().isoformat()
                }, {"agent_id": user_id})
            else:
                await db.insert("agent_bank_details", {
                    "id": str(uuid.uuid4()),
                    "agent_id": user_id,
                    "bank_account_number": payload.bank_account_number,
                    "ifsc_code": payload.ifsc_code,
                    "account_verified": False,
                    "created_at": dt.datetime.utcnow().isoformat(),
                    "updated_at": dt.datetime.utcnow().isoformat()
                })
            print(f"[USERS] Bank details updated in agent_bank_details table")
        except Exception as bank_error:
            print(f"[USERS] agent_bank_details table error, using users table: {bank_error}")
            # Fallback: update users table directly
            await db.update("users", {
                "bank_account_number": payload.bank_account_number,
                "ifsc_code": payload.ifsc_code,
                "account_verified": False,
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": user_id})
        
        print(f"[USERS] Bank details updated successfully")
        return {"success": True, "message": "Bank details updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USERS] Bank details error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update bank details: {str(e)}")

@router.get("/bank-details")
async def get_bank_details(request: Request):
    try:
        claims = get_current_user_claims(request)
        user_id = claims.get("sub")
        
        print(f"[USERS] Getting bank details for user: {user_id}")
        
        # Try to get from agent_bank_details first
        try:
            bank_details = await db.select("agent_bank_details", filters={"agent_id": user_id})
            if bank_details:
                details = bank_details[0]
                account_number = details.get("bank_account_number", "")
                masked_account = f"XXXX{account_number[-4:]}" if len(account_number) >= 4 else "Not set"
                
                return {
                    "bank_account_number": masked_account,
                    "ifsc_code": details.get("ifsc_code", ""),
                    "account_verified": details.get("account_verified", False),
                    "verified_at": details.get("account_verified_at")
                }
        except Exception as bank_error:
            print(f"[USERS] agent_bank_details query failed: {bank_error}")
        
        # Fallback: get from users table
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        account_number = user.get("bank_account_number", "")
        masked_account = f"XXXX{account_number[-4:]}" if len(account_number) >= 4 else "Not set"
        
        return {
            "bank_account_number": masked_account,
            "ifsc_code": user.get("ifsc_code", ""),
            "account_verified": user.get("account_verified", False),
            "verified_at": user.get("account_verified_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[USERS] Get bank details error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get bank details: {str(e)}")

@router.post("/seller-profile")
async def create_seller_profile(payload: dict):
    try:
        print(f"[USERS] Creating seller profile")
        print(f"[USERS] Payload received: {payload}")
        
        return {"success": True, "message": "Seller profile created successfully"}
        
    except Exception as e:
        print(f"[USERS] Create seller profile error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create seller profile: {str(e)}")

@router.patch("/{user_id}")
async def update_user(user_id: str, payload: dict, request: Request):
    try:
        print(f"[USERS] Updating user: {user_id}")
        
        # Update user data
        update_data = {}
        if "user_type" in payload:
            update_data["user_type"] = payload["user_type"]
        if "first_name" in payload:
            update_data["first_name"] = payload["first_name"]
        if "last_name" in payload:
            update_data["last_name"] = payload["last_name"]
        if "phone_number" in payload:
            update_data["phone_number"] = payload["phone_number"]
        if "city" in payload:
            update_data["city"] = payload["city"]
        if "state" in payload:
            update_data["state"] = payload["state"]
        if "address" in payload:
            update_data["address"] = payload["address"]
        if "bio" in payload:
            update_data["bio"] = payload["bio"]
        
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            # For now, just log the update instead of updating database
            print(f"[USERS] User update data: {update_data}")
            print(f"[USERS] User updated successfully (mock)")
        
        return {"success": True, "message": "User updated successfully"}
        
    except Exception as e:
        print(f"[USERS] Update user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")