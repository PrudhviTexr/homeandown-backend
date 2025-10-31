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
        
        # Add date_of_birth if provided
        if hasattr(payload, 'date_of_birth') and payload.date_of_birth:
            user_data["date_of_birth"] = payload.date_of_birth
        
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
        
        # NOTE: OTP will be sent by the frontend OTPVerification component
        # Do not send OTP here to avoid duplicate emails
        
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
    """Get current user profile from JWT token with ALL fields."""
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
        
        # Get user's active roles
        try:
            from ..services.user_role_service import UserRoleService
            active_roles = await UserRoleService.get_active_user_roles(user_id)
        except Exception as role_error:
            print(f"[AUTH] Failed to get user roles: {role_error}")
            active_roles = [user.get("user_type", "buyer")]
        
        # Return ALL fields from the database
        return {
            "id": user["id"],
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "user_type": user.get("user_type", "buyer"),
            "active_roles": active_roles,
            "custom_id": user.get("custom_id"),
            "email_verified": user.get("email_verified", False),
            "status": user.get("status", "active"),
            "verification_status": user.get("verification_status", "pending"),
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
            "business_name": user.get("business_name", ""),
            # Agent-specific fields (read-only)
            "agent_license_number": user.get("agent_license_number"),
            "experience_years": user.get("experience_years"),
            "specialization": user.get("specialization"),
            # Bank details (read-only for security)
            "bank_account_number": user.get("bank_account_number"),
            "ifsc_code": user.get("ifsc_code"),
            "bank_verified": user.get("bank_verified", False),
            # Timestamps
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
            "email_verified_at": user.get("email_verified_at")
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
        
        # Get user details
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        
        # Check if user already has this role
        try:
            from ..services.user_role_service import UserRoleService
            from ..services.email import send_email
            import pytz
            
            has_role = await UserRoleService.has_role(user_id, requested_role)
            if has_role:
                return {
                    "success": False,
                    "error": f"You already have the {requested_role} role"
                }
            
            # Add the role as pending (requires admin approval)
            success = await UserRoleService.add_additional_role(user_id, requested_role)
            
            if success:
                role_display = {
                    "buyer": "Buyer",
                    "seller": "Seller",
                    "agent": "Agent",
                    "admin": "Administrator"
                }.get(requested_role, requested_role.title())
                
                current_role_display = {
                    "buyer": "Buyer",
                    "seller": "Seller",
                    "agent": "Agent",
                    "admin": "Administrator"
                }.get(user.get("user_type", "").lower(), "User")
                
                # Send confirmation email to user
                user_email_html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Role Request Submitted</h1>
                        </div>
                        
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Hello {user.get('first_name', 'User')},</h2>
                            
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Your request for <strong>{role_display}</strong> access has been successfully submitted and is now pending admin review.
                            </p>
                            
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 30px 0; border-radius: 4px;">
                                <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong>📋 What happens next?</strong><br>
                                    • Our admin team will review your request<br>
                                    • You'll receive an email notification once your request is approved or if additional information is needed<br>
                                    • Review typically takes 1-2 business days
                                </p>
                            </div>
                            
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
                                    <strong>Request Details:</strong>
                                </p>
                                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                                    • Requested Role: {role_display}<br>
                                    • Current Role: {current_role_display}<br>
                                    • Date: {dt.datetime.now(pytz.UTC).strftime('%B %d, %Y at %I:%M %p UTC')}<br>
                                    • Status: Pending Review
                                </p>
                            </div>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>
                                <strong>The Home & Own Team</strong>
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">
                                © 2025 Home & Own. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                try:
                    await send_email(
                        to_email=user["email"],
                        subject=f"Role Request Submitted - Home & Own",
                        html_content=user_email_html
                    )
                    print(f"[AUTH] Role request confirmation email sent to user: {user['email']}")
                except Exception as email_error:
                    print(f"[AUTH] Failed to send role request email to user: {email_error}")
                
                # Send notification to admins
                try:
                    admin_users = await db.select("users", filters={"user_type": "admin"})
                    
                    admin_email_html = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                        <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Role Request</h1>
                            </div>
                            
                            <div style="padding: 40px 30px;">
                                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Admin Action Required</h2>
                                
                                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    A user has requested additional role access and requires your review.
                                </p>
                                
                                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
                                        <strong>User Information:</strong>
                                    </p>
                                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                                        • Name: {user.get('first_name', '')} {user.get('last_name', '')}<br>
                                        • Email: {user.get('email', '')}<br>
                                        • Current Role: {current_role_display}<br>
                                        • Requested Role: <strong>{role_display}</strong><br>
                                        • User ID: {user_id}<br>
                                        • Date: {dt.datetime.now(pytz.UTC).strftime('%B %d, %Y at %I:%M %p UTC')}
                                    </p>
                                </div>
                                
                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="{settings.SITE_URL}/admin/dashboard" 
                                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                                              color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                                              font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                                        Review in Admin Dashboard
                                    </a>
                                </div>
                            </div>
                            
                            <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                                    <strong>Home & Own Admin System</strong>
                                </p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">
                                    © 2025 Home & Own. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    for admin in admin_users:
                        try:
                            await send_email(
                                to_email=admin["email"],
                                subject=f"New Role Request: {role_display} - Home & Own",
                                html_content=admin_email_html
                            )
                            print(f"[AUTH] Role request notification sent to admin: {admin['email']}")
                        except Exception as admin_email_error:
                            print(f"[AUTH] Failed to send admin notification: {admin_email_error}")
                            
                except Exception as admin_notify_error:
                    print(f"[AUTH] Failed to send admin notifications: {admin_notify_error}")
                
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
            import traceback
            print(traceback.format_exc())
            return {
                "success": False,
                "error": f"Failed to submit role request: {str(role_error)}"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Request role error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to submit role request: {str(e)}")


@router.post("/forgot-password")
async def forgot_password(request: Request) -> Dict[str, Any]:
    """Send password reset email with token."""
    try:
        body = await request.json()
        email = body.get("email", "").lower().strip()
        user_type = body.get("user_type", "").lower().strip()  # Get requested user type
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        print(f"[AUTH] Password reset requested for: {email} (user_type: {user_type})")
        
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
        actual_user_type = user.get("user_type", "buyer").lower()
        
        # Generate reset token
        reset_token = str(uuid.uuid4())
        expires_at = dt.datetime.now(pytz.UTC) + dt.timedelta(hours=1)
        
        # Store token in verification_tokens table with user_type metadata
        token_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "token": reset_token,
            "type": "password_reset",
            "metadata": {"user_type": actual_user_type},  # Store user type in metadata
            "expires_at": expires_at.isoformat(),
            "created_at": dt.datetime.now(pytz.UTC).isoformat()
        }
        
        await db.insert("verification_tokens", token_data)
        print(f"[AUTH] Reset token created for user: {user_id} (type: {actual_user_type})")
        
        # Generate role-specific reset URL
        site_url = settings.SITE_URL or "https://homeandown.com"
        if actual_user_type == "admin":
            reset_url = f"{site_url}/admin/reset-password"
        elif actual_user_type == "agent":
            reset_url = f"{site_url}/agent/reset-password"
        elif actual_user_type == "seller":
            reset_url = f"{site_url}/seller/reset-password"
        elif actual_user_type == "buyer":
            reset_url = f"{site_url}/buyer/reset-password"
        else:
            reset_url = f"{site_url}/reset-password"
        
        # Send reset email
        reset_link = f"{reset_url}?token={reset_token}"
        # Get user role display name
        role_display = {
            "admin": "Administrator",
            "agent": "Agent",
            "seller": "Seller",
            "buyer": "Buyer"
        }.get(actual_user_type, "User")
        
        email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Home & Own</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Hello {user.get('first_name', 'User')},</h2>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        We received a request to reset the password for your <strong>{role_display}</strong> account on Home & Own.
                    </p>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Click the button below to securely reset your password:
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 40px 0;">
                    <a href="{reset_link}" 
                           style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                                  color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                            Reset Your Password
                    </a>
                </div>
                    
                    <!-- Alternative Link -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                            Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 0;">
                            {reset_link}
                        </p>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                        <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                            <strong>⚠️ Security Notice:</strong><br>
                            This link will expire in <strong>1 hour</strong> for your security.<br>
                            If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                        </p>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you're having trouble with the button above, you can also visit your {role_display.lower()} portal directly and use the "Forgot Password" link.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                        Best regards,<br>
                        <strong>The Home & Own Team</strong>
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">
                    © 2025 Home & Own. All rights reserved.
                </p>
                </div>
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
        
        # Get user details and send confirmation email
        users = await db.select("users", filters={"id": user_id})
        user_type = "buyer"  # Default
        if users:
            user = users[0]
            user_type = user.get("user_type", "buyer").lower()
            
            # Get role display name and login URL
            role_info = {
                "admin": {"name": "Administrator", "url": "/admin/login"},
                "agent": {"name": "Agent", "url": "/agent/login"},
                "seller": {"name": "Seller", "url": "/login"},
                "buyer": {"name": "Buyer", "url": "/login"}
            }
            role = role_info.get(user_type, {"name": "User", "url": "/login"})
            
            site_url = settings.SITE_URL or "https://homeandown.com"
            login_url = f"{site_url}{role['url']}"
            
            confirmation_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 30px;">✓</span>
                        </div>
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Password Changed Successfully!</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Hello {user.get('first_name', 'User')},</h2>
                        
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Your password has been successfully changed for your <strong>{role['name']}</strong> account on Home & Own.
                        </p>
                        
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            You can now use your new password to log in to your account.
                        </p>
                        
                        <!-- Login Button -->
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="{login_url}" 
                               style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                                      color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                                Login to Your Account
                            </a>
                        </div>
                        
                        <!-- Security Alert -->
                        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 30px 0; border-radius: 4px;">
                            <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
                                <strong>🔒 Security Alert:</strong><br>
                                If you didn't make this change, please contact our support team immediately at <a href="mailto:support@homeandown.com" style="color: #991b1b; text-decoration: underline;">support@homeandown.com</a>
                            </p>
                        </div>
                        
                        <!-- Additional Info -->
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
                                <strong>Password Reset Details:</strong>
                            </p>
                            <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                                • Date: {dt.datetime.now(pytz.UTC).strftime('%B %d, %Y at %I:%M %p UTC')}<br>
                                • Account Type: {role['name']}<br>
                                • Email: {user.get('email', '')}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                            Best regards,<br>
                            <strong>The Home & Own Team</strong>
                        </p>
                        <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">
                        © 2025 Home & Own. All rights reserved.
                    </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            await send_email(
                to_email=user["email"],
                subject="Password Changed Successfully - Home & Own",
                html_content=confirmation_html
            )
        
        return {
            "success": True,
            "message": "Password reset successful. You can now log in with your new password.",
            "user_type": user_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Reset password error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.post("/change-password")
async def change_password(request: Request) -> Dict[str, Any]:
    """Change user password by verifying current password and setting new one."""
    try:
        from ..core.security import get_current_user_claims
        from ..core.crypto import verify_password, get_password_hash
        from ..services.email import send_email
        from ..config import settings
        
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        body = await request.json()
        current_password = body.get("current_password", "").strip()
        new_password = body.get("new_password", "").strip()
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Both current_password and new_password are required")
        
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        # Get user
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        password_hash = user.get("password_hash")
        
        # Verify current password
        if not password_hash or not verify_password(current_password, password_hash):
            raise HTTPException(status_code=400, detail="Invalid current password")
        
        # Check if new password is same as current
        if verify_password(new_password, password_hash):
            raise HTTPException(status_code=400, detail="New password must be different from current password")
        
        # Hash new password
        new_password_hash = get_password_hash(new_password)
        
        # Update password
        await db.update("users", {
            "password_hash": new_password_hash,
            "updated_at": dt.datetime.now(pytz.UTC).isoformat()
        }, {"id": user_id})
        
        print(f"[AUTH] Password changed successfully for user: {user_id}")
        
        # Send confirmation email
        try:
            user_email = user.get("email")
            user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "User"
            
            email_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Password Changed Successfully</h2>
                    <p>Hello {user_name},</p>
                    <p>Your password has been successfully changed.</p>
                    <div style="background-color: #f0f9ff; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Security Notice:</strong></p>
                        <p style="margin: 5px 0 0 0;">If you didn't make this change, please contact our support team immediately.</p>
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        You can now log in with your new password.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">© 2025 Home & Own. All rights reserved.</p>
                </div>
            </body>
            </html>
            """
            
            await send_email(
                to_email=user_email,
                subject="Password Changed Successfully - Home & Own",
                html_content=email_html
            )
            print(f"[AUTH] Password change confirmation email sent to: {user_email}")
        except Exception as email_error:
            print(f"[AUTH] Failed to send password change email: {email_error}")
            # Don't fail password change if email fails
        
        return {
            "success": True,
            "message": "Password changed successfully. An email notification has been sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Change password error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")
