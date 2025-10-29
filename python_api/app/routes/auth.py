from fastapi import APIRouter, HTTPException, Response, Request, Header
from typing import Dict, Any, List, Optional
from ..models.schemas import SignupRequest, LoginRequest, SendOTPRequest, VerifyOTPRequest
from ..core.config import settings
from ..core.security import get_current_user_claims
from ..core.crypto import (
    get_password_hash,
    verify_password,
    generate_token,
    issue_user_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_refresh_token_hash,
)
from ..services.email import send_email
from ..services.templates import verification_email
from ..db.supabase_client import db
import datetime as dt
import uuid
import traceback
import pytz

router = APIRouter()

@router.get("/test")
async def test_auth_route():
    """Test route to verify auth router is working"""
    return {"message": "Auth router is working", "status": "success"}

@router.post("/signup")
async def signup(payload: SignupRequest, request: Request) -> Dict[str, Any]:
    try:
        print(f"\n[AUTH] Signup request for: {payload.email}")
        print(f"[AUTH] User details: {payload.first_name} {payload.last_name}")
        print(f"[AUTH] Role: {payload.role}")
        
        # Check if user already exists
        try:
            existing_users: List[Dict[str, Any]] = await db.select("users", filters={"email": payload.email.lower()})
            if existing_users:
                print(f"[AUTH] User already exists: {payload.email}")
                return {
                    "success": False,
                    "error": "User with this email already exists. Please sign in instead."
                }
        except Exception as db_error:
            print(f"[AUTH] Error checking existing user: {db_error}")
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        print(f"[AUTH] Generated user ID: {user_id}")
        
        # TEMPORARY STORAGE: Store signup data in memory, don't save to DB yet
        # Data will be saved to DB only after OTP verification
        from ..services.otp_service import _temp_signup_storage
        
        # Prepare user data (not saved to DB yet)
        now_utc = dt.datetime.now(dt.timezone.utc).isoformat()
        
        # Set verification status and initial status based on user role
        # ALL users now require admin approval
        verification_status = "pending"
        initial_status = "pending"  # All users need approval
        
        user_data: Dict[str, Any] = {
            "id": user_id,
            "email": payload.email.lower(),
            "password_hash": get_password_hash(payload.password),
            "first_name": payload.first_name or "",
            "last_name": payload.last_name or "",
            "phone_number": payload.phone_number or "",
            "user_type": payload.role or "buyer",
            "city": payload.city or "",
            "state": payload.state or "",
            "status": initial_status,  # Set based on user type
            "verification_status": verification_status,  # Agents/sellers need admin approval
            "email_verified": False,
            "created_at": now_utc,
            "updated_at": now_utc
        }
        
        # Add location fields if provided (especially important for agents to enable zipcode-based assignment)
        if hasattr(payload, 'zip_code') and payload.zip_code:
            user_data["zip_code"] = payload.zip_code
        if hasattr(payload, 'district') and payload.district:
            user_data["district"] = payload.district
        if hasattr(payload, 'mandal') and payload.mandal:
            user_data["mandal"] = payload.mandal
        if hasattr(payload, 'address') and payload.address:
            user_data["address"] = payload.address
        if hasattr(payload, 'latitude') and payload.latitude:
            try:
                user_data["latitude"] = float(payload.latitude) if payload.latitude else None
            except (ValueError, TypeError):
                pass
        if hasattr(payload, 'longitude') and payload.longitude:
            try:
                user_data["longitude"] = float(payload.longitude) if payload.longitude else None
            except (ValueError, TypeError):
                pass
        
        # Add agent-specific fields
        if payload.role == "agent":
            if hasattr(payload, 'experience_years') and payload.experience_years:
                user_data["experience_years"] = payload.experience_years
            if hasattr(payload, 'specialization') and payload.specialization:
                user_data["specialization"] = payload.specialization
        
        # Generate custom ID and license number based on user type
        custom_id = None
        if payload.role in ["buyer", "agent", "seller"]:
            try:
                from ..services.admin_service import generate_custom_id
                custom_id = await generate_custom_id(payload.role)
                user_data["custom_id"] = custom_id
                
                # For agents, also set license number (if column exists)
                if payload.role == "agent":
                    # Try to set license_number, but don't fail if column doesn't exist
                    try:
                        user_data["license_number"] = custom_id
                        print(f"[AUTH] Generated license number for agent: {custom_id}")
                    except Exception as license_error:
                        print(f"[AUTH] License number field not available: {license_error}")
                        # Store in agent_license_number as fallback
                        user_data["agent_license_number"] = custom_id
                        print(f"[AUTH] Stored license number in agent_license_number: {custom_id}")
                else:
                    print(f"[AUTH] Generated custom ID: {custom_id}")
            except Exception as cid_error:
                print(f"[AUTH] Custom ID generation failed: {cid_error}")
        
        # Create user in database IMMEDIATELY
        try:
            user_result = await db.insert("users", user_data)
            print(f"[AUTH] User created in database successfully")
            
            # Handle list response from db.insert
            if isinstance(user_result, list) and len(user_result) > 0:
                user = user_result[0]
            elif isinstance(user_result, dict):
                user = user_result
            else:
                user = user_data
            
            # Initialize user roles with primary role
            try:
                from ..services.user_role_service import UserRoleService
                await UserRoleService.initialize_user_roles(user_id, payload.role)
                print(f"[AUTH] User roles initialized successfully")
            except Exception as role_error:
                print(f"[AUTH] Failed to initialize user roles: {role_error}")
                
        except Exception as create_error:
            print(f"[AUTH] User creation failed: {create_error}")
            return {
                "success": False,
                "error": f"Failed to create user account: {str(create_error)}"
            }
        
        # Create user approval record for ALL users (buyers, agents, sellers)
        try:
            approval_data = {
                "user_id": user_id,
                "status": "pending",
                "submitted_at": now_utc,
                "created_at": now_utc,
                "updated_at": now_utc
            }
            await db.insert("user_approvals", approval_data)
            print(f"[AUTH] User approval record created for {payload.role}: {user_id}")
        except Exception as approval_err:
            print(f"[AUTH] Failed to create approval record: {approval_err}")
        
        # Admin notifications are handled by admin dashboard
        print(f"[AUTH] User registration complete for {payload.email}")
        
        # Generate and send email OTP for verification
        print(f"[AUTH] Sending email verification OTP...")
        try:
            from ..services.otp_service import send_email_otp
            otp_token = await send_email_otp(payload.email, "email_verification")
            print(f"[AUTH] Email verification OTP sent: {otp_token}")
        except Exception as otp_error:
            print(f"[AUTH] Email OTP send failed (non-blocking): {otp_error}")
        
        # Return success with user ID
        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": payload.email.lower(),
                "first_name": payload.first_name or "",
                "last_name": payload.last_name or ""
            },
            "message": "Account created successfully! Please check your email for verification."
        }
        
    except Exception as e:
        print(f"[AUTH] Signup error: {e}")
        print(f"[AUTH] Full traceback:")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": f"Signup failed: {str(e)}"
        }


@router.post("/login")
async def login(payload: LoginRequest, response: Response, role: Optional[str] = None) -> Dict[str, Any]:
    """Authenticates a user and issues an access token and refresh token cookie."""
    try:
        print(f"\n[AUTH] Login attempt for: {payload.email} (requested role: {role})")
        
        try:
            users: List[Dict[str, Any]] = await db.select("users", filters={"email": payload.email.lower()})
            if not users:
                print(f"[AUTH] User not found: {payload.email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            user: Dict[str, Any] = users[0]
            print(f"[AUTH] User found: {user['id']} (registered as: {user.get('user_type', 'buyer')})")
        except HTTPException:
            raise
        except Exception as db_error:
            print(f"[AUTH] Database error during login: {db_error}")
            print(f"[AUTH] Full traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail="Login failed due to database error")
        
        try:
            if not verify_password(payload.password, user["password_hash"]):
                print(f"[AUTH] Invalid password for: {payload.email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
        except Exception as pwd_error:
            print(f"[AUTH] Password verification error: {pwd_error}")
            raise HTTPException(status_code=401, detail="Authentication failed")
        
        # Validate user role if specified
        user_type = user.get("user_type", "buyer")
        if role and role.lower() != user_type.lower():
            print(f"[AUTH] Role mismatch: user registered as {user_type}, but trying to login as {role}")
            raise HTTPException(
                status_code=403, 
                detail=f"You are registered as a {user_type.title()}. Please select the correct role to sign in."
            )
        
        # Check if user is approved by admin (for all user types)
        user_status = user.get("status", "pending")
        verification_status = user.get("verification_status", "pending")
        
        print(f"[AUTH] User status check: status={user_status}, verification_status={verification_status}")
        
        if user_status != "active":
            print(f"[AUTH] User not approved by admin: {payload.email} (status: {user_status})")
            # Provide a more specific message for suspended accounts
            if user_status == 'suspended':
                detail = "Your account has been suspended. Please contact support."
            else:
                detail = "Your account is pending admin approval. Please wait for admin approval before you can login."
            raise HTTPException(
                status_code=403, 
                detail=detail
            )
        
        # For agents, also check verification_status
        if user_type == 'agent' and verification_status not in ['verified', 'active']:
            print(f"[AUTH] Agent not verified: {payload.email} (verification_status: {verification_status})")
            raise HTTPException(
                status_code=403,
                detail="Your agent account verification is still pending. Please wait for admin approval."
            )
        
        # Allow any verified user to sign in (regardless of user type)
        # Admin approval is the primary requirement
        
        print(f"[AUTH] User verified and allowed to sign in: {user['email']} (type: {user.get('user_type', 'buyer')})")
        
        print(f"[AUTH] Login successful for: {user['email']}")
        
        try:
            user_id = str(user["id"])
            user_type = str(user.get("user_type", "buyer"))
            
            # Get user's active roles
            try:
                from ..services.user_role_service import UserRoleService
                active_roles = await UserRoleService.get_active_user_roles(user_id)
                print(f"[AUTH] User {user_id} has active roles: {active_roles}")
            except Exception as role_error:
                print(f"[AUTH] Failed to get user roles: {role_error}")
                active_roles = [user_type]  # Fallback to primary role
            
            auth_token = issue_user_token(user_id, user_type)

            refresh_raw = generate_refresh_token()
            refresh_hash = hash_refresh_token(refresh_raw)

            # Use a safe default if the setting is missing or falsy
            refresh_expires_days = int(getattr(settings, 'JWT_REFRESH_EXPIRATION_DAYS', 30) or 30)
            refresh_record: Dict[str, Any] = {
                "user_id": user_id,
                "token_hash": refresh_hash,
                "user_agent": "",
                "ip_address": "",
                "expires_at": (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=refresh_expires_days)).isoformat(),
            }
            try:
                await db.insert("refresh_tokens", refresh_record)
            except Exception as e:
                print(f"[AUTH] Failed to store refresh token: {e}")

            response.set_cookie(
                "refresh_token",
                refresh_raw,
                httponly=True,
                secure=settings.SITE_URL.startswith("https") if settings.SITE_URL else False,
                samesite="lax",
                max_age=60 * 60 * 24 * refresh_expires_days,
                path="/api"
            )

            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", ""),
                    "user_type": user.get("user_type", "buyer"),
                    "active_roles": active_roles,
                    "custom_id": user.get("custom_id")
                },
                "token": auth_token,
                "message": "Login successful"
            }
        except Exception as token_error:
            print(f"[AUTH] Token generation error: {token_error}")
            raise HTTPException(status_code=500, detail="Failed to generate authentication tokens")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Login error: {e}")
        print(f"[AUTH] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/me")
async def get_profile(request: Request) -> Dict[str, Any]:
    """Get current user profile from JWT token."""
    try:
        print(f"[AUTH] Profile request received")
        
        # Get user claims from JWT token
        user_claims = get_current_user_claims(request)
        user_id = user_claims.get("sub")  # JWT standard uses 'sub' for subject (user_id)
        
        if not user_id:
            print(f"[AUTH] User not found in database: {user_id}")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Fetch user data from database
        users = await db.select("users", filters={"id": user_id})
        if not users:
            print(f"[AUTH] User not found in database: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        print(f"[AUTH] Profile data retrieved for: {user['email']}")
        
        return {
            "id": user["id"],
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "user_type": user.get("user_type", "buyer"),
            "custom_id": user.get("custom_id"),
            "email_verified": user.get("email_verified", False),
            "status": user.get("status", "active"),
            "phone_number": user.get("phone_number", ""),
            "city": user.get("city", ""),
            "state": user.get("state", ""),
            "district": user.get("district", ""),
            "mandal": user.get("mandal", ""),
            "zip_code": user.get("zip_code", ""),
            "address": user.get("address", ""),
            "latitude": user.get("latitude"),
            "longitude": user.get("longitude"),
            "date_of_birth": user.get("date_of_birth"),
            "bio": user.get("bio", ""),
            "profile_image_url": user.get("profile_image_url"),
            "verification_status": user.get("verification_status", "pending")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Get profile error: {e}")
        print(f"[AUTH] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.post("/send-otp")
async def send_otp(payload: SendOTPRequest) -> Dict[str, Any]:
    """Send OTP via email for email verification."""
    try:
        print(f"[OTP] Send OTP request: {payload.email} for {payload.action}")
        
        from ..services.otp_service import send_email_otp
        token = await send_email_otp(payload.email, payload.action)
        
        # Return in format frontend expects
        return {"success": True, "sent": True, "otp": token}
        
    except Exception as e:
        print(f"[OTP] Send OTP error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPRequest) -> Dict[str, Any]:
    """Verify OTP for email verification."""
    try:
        print(f"[OTP] Verify OTP: {payload.email} for {payload.action}")
        
        from ..services.otp_service import verify_email_otp
        is_valid = verify_email_otp(payload.email, payload.otp, payload.action)
        
        if not is_valid:
            print(f"[OTP] Invalid OTP provided for {payload.email}")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
            
        print(f"[OTP] OTP verified successfully for {payload.email}")
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[OTP] Verify OTP error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to verify OTP: {str(e)}")

@router.get("/verify-email/{token}")
async def verify_email(token: str) -> Dict[str, Any]:
    """Verify email using token from email link."""
    try:
        print(f"[AUTH] Email verification attempt for token: {token}")

        # Find token in database
        tokens = await db.select("email_verification_tokens", filters={"token": token})
        if not tokens:
            print(f"[AUTH] Token not found. This may be because it's already used or invalid.")
            raise HTTPException(status_code=400, detail="Invalid or expired verification token")

        token_record = tokens[0]
        user_id = token_record.get("user_id")
        expires_at_str = token_record.get("expires_at")
        
        if not expires_at_str:
            print(f"[AUTH] Token record missing expiration date.")
            raise HTTPException(status_code=400, detail="Invalid token format")

        # Check if token is expired
        try:
            expires_at = dt.datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
            now_utc = dt.datetime.now(dt.timezone.utc)
            if now_utc > expires_at:
                print(f"[AUTH] Token expired at {expires_at}. Current time is {now_utc}.")
                raise HTTPException(status_code=400, detail="Verification token has expired")
        except Exception as parse_error:
            print(f"[AUTH] Error parsing token expiration: {parse_error}")
            raise HTTPException(status_code=400, detail="Invalid token format")
        
        if not user_id:
            print(f"[AUTH] Token record has no associated user_id.")
            raise HTTPException(status_code=400, detail="Invalid token format")

        # Find user
        users = await db.select("users", filters={"id": user_id})
        if not users:
            print(f"[AUTH] User associated with token not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        
        # Check if already verified
        if user.get("email_verified", False):
            print(f"[AUTH] User's email is already verified: {user.get('email')}")
            return {
                "success": True,
                "message": "Email is already verified",
                "already_verified": True
            }
        
        # Update user as verified
        try:
            update_data = {
                "email_verified": True,
                "verification_status": "verified",
                "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
            }
            await db.update("users", update_data, {"id": user_id})
        except Exception as update_error:
            print(f"[AUTH] Failed to update user record for {user_id}.")
            raise HTTPException(status_code=500, detail="Failed to verify email")
        
        # Log verification event
        try:
            log_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "event_type": "email_verified",
                "details": f"Email verified via token: {token}",
                "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
            }
            await db.insert("user_activity_logs", log_data)
        except Exception as log_err:
            print(f"[AUTH] Failed to log verification event: {log_err}")

        # Delete the used token
        try:
            await db.delete("email_verification_tokens", {"token": token})
        except Exception as e:
            print(f"[AUTH] Failed to delete token after verification: {e}")
        
        print(f"[AUTH] Email verified for user_id: {user_id}")
        return {
            "success": True,
            "message": "Email verified successfully! You can now sign in to your account.",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", "")
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Email verification error: {e}")
        print(f"[AUTH] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Email verification failed: {str(e)}")

@router.post("/verify-email-otp")
async def verify_email_otp(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Verify email using OTP sent to email."""
    try:
        email = payload.get("email", "").lower()
        otp = payload.get("otp", "")
        
        print(f"[AUTH] Verifying email OTP for: {email}")
        
        # Validate OTP format
        if len(otp) != 6 or not otp.isdigit():
            raise HTTPException(status_code=400, detail="Invalid OTP format")
        
        # Find user by email
        users = await db.select("users", filters={"email": email})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        user_id = user["id"]
        
        # Check if already verified
        if user.get("email_verified", False):
            print(f"[AUTH] User's email is already verified: {email}")
            return {
                "success": True,
                "message": "Email is already verified",
                "already_verified": True
            }
        
        # Verify OTP using the OTP service
        try:
            from ..services.otp_service import verify_email_otp as verify_otp_service
            is_valid = verify_otp_service(email, otp, "email_verification")
            
            if not is_valid:
                print(f"[AUTH] Invalid OTP provided for {email}")
                raise HTTPException(status_code=400, detail="Invalid or expired OTP")
                
        except HTTPException:
            raise
        except Exception as otp_error:
            print(f"[AUTH] OTP verification error: {otp_error}")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Update user as verified
        try:
            update_data = {
                "email_verified": True,
                "verification_status": "verified",
                "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
            }
            await db.update("users", update_data, {"id": user_id})
        except Exception as update_error:
            print(f"[AUTH] Failed to update user record for {user_id}.")
            raise HTTPException(status_code=500, detail="Failed to verify email")
        
        # Log verification event
        try:
            log_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "event_type": "email_verified",
                "details": f"Email verified via OTP: {email}",
                "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
            }
            await db.insert("user_activity_logs", log_data)
        except Exception as log_err:
            print(f"[AUTH] Failed to log verification event: {log_err}")
        
        print(f"[AUTH] Email verified via OTP for user_id: {user_id}")
        return {
            "success": True,
            "message": "Email verified successfully! You can now sign in to your account.",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", "")
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Email OTP verification error: {e}")
        print(f"[AUTH] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Email verification failed: {str(e)}")

@router.get("/admin/tokens")
async def list_tokens() -> Dict[str, Any]:
    """List all email verification tokens (admin only)."""
    try:
        tokens = await db.select("email_verification_tokens")
        return {"success": True, "tokens": tokens}
    except Exception as e:
        print(f"[ADMIN] Failed to list tokens: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list tokens: {str(e)}")

@router.post("/resend-verification")
async def resend_verification_email(request: Request) -> Dict[str, Any]:
    """Resend verification email to user"""
    try:
        # Get email from query parameters
        email = request.query_params.get("email")
        if not email:
            return {
                "success": False,
                "error": "Email parameter is required"
            }
        
        print(f"[AUTH] Resending verification email to: {email}")
        
        # Check if user exists
        users = await db.select("users", filters={"email": email.lower()})
        if not users:
            return {
                "success": False,
                "error": "User not found"
            }
        
        user = users[0]
        
        # Check if email is already verified
        if user.get("email_verified"):
            return {
                "success": False,
                "error": "Email is already verified"
            }
        
        # Send email verification OTP
        try:
            from ..services.otp_service import send_email_otp
            otp_token = await send_email_otp(email, "email_verification")
            print(f"[AUTH] Verification email OTP sent: {otp_token}")
            
            return {
                "success": True,
                "message": "Verification email sent successfully! Please check your inbox."
            }
        except Exception as otp_error:
            print(f"[AUTH] Email OTP send failed: {otp_error}")
            return {
                "success": False,
                "error": "Failed to send verification email. Please try again."
            }
        
    except Exception as e:
        print(f"[AUTH] Resend verification error: {e}")
        return {
            "success": False,
            "error": f"Failed to resend verification email: {str(e)}"
        }

@router.post("/logout")
async def logout(request: Request, response: Response) -> Dict[str, Any]:
    """Logout user by revoking refresh token."""
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        
        if refresh_token:
            # Hash the token to find it in database
            refresh_hash = hash_refresh_token(refresh_token)
            
            # Find and revoke the token
            try:
                tokens = await db.select("refresh_tokens", filters={"token_hash": refresh_hash})
                for t in tokens:
                    await db.delete("refresh_tokens", {"id": t["id"]})
                    print(f"[AUTH] Revoked refresh token: {t['id']}")
            except Exception as revoke_error:
                print(f"[AUTH] Logout revoke failed: {revoke_error}")
        
        # Clear the cookie
        response.delete_cookie("refresh_token", path="/api")
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        print(f"[AUTH] Logout error: {e}")
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")


@router.get("/me")
async def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user information with roles"""
    try:
        from ..core.security import get_current_user_claims
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
            role_info = await UserRoleService.get_user_role_info(user_id)
        except Exception as role_error:
            print(f"[AUTH] Failed to get user roles: {role_error}")
            active_roles = [user.get("user_type", "buyer")]
            role_info = {
                "active_roles": active_roles,
                "has_buyer_access": "buyer" in active_roles,
                "has_seller_access": "seller" in active_roles,
                "has_agent_access": "agent" in active_roles,
                "has_admin_access": "admin" in active_roles
            }
        
        return {
            "success": True,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "user_type": user.get("user_type", "buyer"),
                "active_roles": active_roles,
                "role_info": role_info,
                "email_verified": user.get("email_verified", False),
                "status": user.get("status", "active"),
                "custom_id": user.get("custom_id")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Get current user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get user information: {str(e)}")


@router.post("/request-role")
async def request_additional_role(request: Request) -> Dict[str, Any]:
    """Request an additional role (e.g., buyer requesting seller role)"""
    try:
        from ..core.security import get_current_user_claims
        claims = get_current_user_claims(request)
        
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        body = await request.json()
        requested_role = body.get("role", "").lower()
        
        if not requested_role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        if requested_role not in ["buyer", "seller", "agent", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Check if user already has this role
        try:
            from ..services.user_role_service import UserRoleService
            has_role = await UserRoleService.has_role(user_id, requested_role)
            if has_role:
                return {
                    "success": False,
                    "error": f"You already have the {requested_role} role"
                }
            
            # Add the role as pending (requires admin approval)
            success = await UserRoleService.add_additional_role(user_id, requested_role)
            
            if success:
                return {
                    "success": True,
                    "message": f"Role request submitted successfully. Admin approval required for {requested_role} role."
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to submit role request"
                }
                
        except Exception as role_error:
            print(f"[AUTH] Role request error: {role_error}")
            return {
                "success": False,
                "error": f"Failed to submit role request: {str(role_error)}"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Request role error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit role request: {str(e)}")


@router.post("/forgot-password")
async def forgot_password(request: Request) -> Dict[str, Any]:
    """Send password reset email with token."""
    try:
        body = await request.json()
        email = body.get("email", "").lower().strip()
        redirect_url = body.get("redirect_url", settings.SITE_URL + "/reset-password")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        print(f"[AUTH] Password reset requested for: {email}")
        
        # Check if user exists
        users = await db.select("users", filters={"email": email})
        if not users:
            # Don't reveal if user exists or not for security
            return {
                "success": True,
                "message": "If an account exists for this email, a reset link has been sent."
            }
        
        user = users[0]
        user_id = user["id"]
        
        # Generate reset token
        reset_token = str(uuid.uuid4())
        expires_at = dt.datetime.now(pytz.UTC) + dt.timedelta(hours=1)
        
        # Store token in verification_tokens table
        token_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "token": reset_token,
            "type": "password_reset",
            "expires_at": expires_at.isoformat(),
            "created_at": dt.datetime.now(pytz.UTC).isoformat()
        }
        
        await db.insert("verification_tokens", token_data)
        print(f"[AUTH] Reset token created for user: {user_id}")
        
        # Send reset email
        reset_link = f"{redirect_url}?token={reset_token}"
        email_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Reset Your Password</h2>
                <p>Hello {user.get('first_name', 'User')},</p>
                <p>We received a request to reset your password for your Home & Own account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">{reset_link}</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This link will expire in 1 hour.<br>
                    If you didn't request this reset, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    © 2025 Home & Own. All rights reserved.
                </p>
            </div>
        </body>
        </html>
        """
        
        await send_email(
            to_email=email,
            subject="Reset Your Password - Home & Own",
            html_content=email_html
        )
        
        print(f"[AUTH] Password reset email sent to: {email}")
        
        return {
            "success": True,
            "message": "If an account exists for this email, a reset link has been sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Forgot password error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to process password reset request")


@router.post("/reset-password")
async def reset_password(request: Request) -> Dict[str, Any]:
    """Reset password using token."""
    try:
        body = await request.json()
        token = body.get("token", "").strip()
        new_password = body.get("password", "").strip()
        
        if not token or not new_password:
            raise HTTPException(status_code=400, detail="Token and new password are required")
        
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        print(f"[AUTH] Password reset attempt with token: {token[:8]}...")
        
        # Find token
        tokens = await db.select("verification_tokens", filters={
            "token": token,
            "type": "password_reset"
        })
        
        if not tokens:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        token_data = tokens[0]
        
        # Check if token is expired
        expires_at = dt.datetime.fromisoformat(token_data["expires_at"].replace("Z", "+00:00"))
        if dt.datetime.now(pytz.UTC) > expires_at:
            # Delete expired token
            await db.delete("verification_tokens", {"id": token_data["id"]})
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Check if token already used
        if token_data.get("used_at"):
            raise HTTPException(status_code=400, detail="Reset token has already been used")
        
        user_id = token_data["user_id"]
        
        # Hash new password
        password_hash = get_password_hash(new_password)
        
        # Update user password
        await db.update("users", {"id": user_id}, {
            "password_hash": password_hash,
            "updated_at": dt.datetime.now(pytz.UTC).isoformat()
        })
        
        # Mark token as used
        await db.update("verification_tokens", {"id": token_data["id"]}, {
            "used_at": dt.datetime.now(pytz.UTC).isoformat()
        })
        
        print(f"[AUTH] Password reset successful for user: {user_id}")
        
        # Send confirmation email
        users = await db.select("users", filters={"id": user_id})
        if users:
            user = users[0]
            confirmation_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Password Reset Successful</h2>
                    <p>Hello {user.get('first_name', 'User')},</p>
                    <p>Your password has been successfully reset.</p>
                    <p>You can now log in with your new password.</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you didn't make this change, please contact our support team immediately.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        © 2025 Home & Own. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
            """
            
            await send_email(
                to_email=user["email"],
                subject="Password Reset Successful - Home & Own",
                html_content=confirmation_html
            )
        
        return {
            "success": True,
            "message": "Password reset successful. You can now log in with your new password."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Reset password error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to reset password")
