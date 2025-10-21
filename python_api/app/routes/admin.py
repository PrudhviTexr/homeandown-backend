from fastapi import APIRouter, Depends, HTTPException, Request
import os
import traceback
from ..core.security import require_api_key
from ..core.crypto import hash_password
from ..db.supabase_client import db, get_public_url
from ..services.email import send_email
from ..services.templates import notify_info
import datetime as dt
import random

router = APIRouter()

# In-memory last error for quick dev diagnostics. Not suitable for production.
last_admin_error: dict | None = None

async def generate_custom_id(user_type: str) -> str:
    """Generate a sequential custom ID for users or agents.
    Format: HUSER01, HUSER02, ... for users
    Format: HAGENT01, HAGENT02, ... for agents
    """
    try:
        # Get the highest existing custom_id for this user type
        prefix = "HUSER" if user_type in ["buyer", "seller"] else "HAGENT"
        
        # Query for existing custom_ids with this prefix
        all_users = await db.admin_select("users")
        existing_ids = []
        
        for user in (all_users or []):
            custom_id = user.get("custom_id")
            if custom_id and custom_id.startswith(prefix):
                try:
                    # Extract the number part
                    num_part = custom_id[len(prefix):]
                    existing_ids.append(int(num_part))
                except (ValueError, IndexError):
                    continue
        
        # Find the next available number
        next_num = 1
        if existing_ids:
            next_num = max(existing_ids) + 1
        
        # Format with leading zeros (2 digits)
        return f"{prefix}{next_num:02d}"
        
    except Exception as e:
        print(f"[ADMIN]  Error generating custom ID: {e}")
        # Fallback: generate a random ID
        import random
        random_num = random.randint(100, 999)
        return f"{prefix}{random_num}"

@router.get("/users")
async def list_users(_=Depends(require_api_key)):
    try:
        print("[ADMIN] Fetching all users")
        users = await db.admin_select("users")
        print(f"[ADMIN] Found {len(users) if users else 0} users")

        # Enrich users with related documents and approval records for admin UI
        try:
            docs = await db.admin_select("documents")
        except Exception:
            docs = []

        try:
            approvals = await db.admin_select("user_approvals")
        except Exception:
            approvals = []

        try:
            agent_profiles = await db.admin_select("agent_profiles")
        except Exception:
            agent_profiles = []

        try:
            seller_profiles = await db.admin_select("seller_profiles")
        except Exception:
            seller_profiles = []

        # Map docs/approvals/profiles to users
        docs_by_entity = {}
        for d in (docs or []):
            et = d.get("entity_type")
            eid = d.get("entity_id")
            if not et or not eid:
                continue
            key = f"{et}:{eid}"
            docs_by_entity.setdefault(key, []).append(d)

        approvals_by_user = {a.get("user_id"): a for a in (approvals or [])}
        agent_profiles_by_user = {p.get("user_id"): p for p in (agent_profiles or [])}
        seller_profiles_by_user = {p.get("user_id"): p for p in (seller_profiles or [])}

        enriched = []
        for u in (users or []):
            uid = u.get("id")
            # Attach documents uploaded for this user/entity
            u_docs = docs_by_entity.get(f"user:{uid}", []) + docs_by_entity.get(f"agent:{uid}", [])
            u_copy = dict(u)
            u_copy["documents"] = u_docs
            # Attach approval record if present
            if approvals_by_user.get(uid):
                u_copy["approval"] = approvals_by_user.get(uid)
            # Attach agent/seller profiles if present
            if agent_profiles_by_user.get(uid):
                u_copy["agent_profile"] = agent_profiles_by_user.get(uid)
            if seller_profiles_by_user.get(uid):
                u_copy["seller_profile"] = seller_profiles_by_user.get(uid)
            enriched.append(u_copy)

        return enriched or []
    except Exception as e:
        print(f"[ADMIN] List users error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.get("/stats")
async def stats(_=Depends(require_api_key)):
    try:
        print("[ADMIN] Fetching stats")
        
        # Get counts from each table
        all_users = await db.admin_select("users")
        # Filter out deleted users for stats
        users = [u for u in (all_users or []) if u.get("status") != "deleted"]
        properties = await db.admin_select("properties")
        bookings = await db.admin_select("bookings")
        inquiries = await db.admin_select("inquiries")
        
        # Calculate stats
        today_str = dt.datetime.utcnow().date().isoformat()
        week_ago_str = (dt.datetime.utcnow().date() - dt.timedelta(days=7)).isoformat()
        
        # Filter for daily stats (simplified - check if created_at starts with today's date)
        daily_users = [u for u in (users or []) if u.get("created_at", "").startswith(today_str)]
        daily_properties = [p for p in (properties or []) if p.get("created_at", "").startswith(today_str)]
        daily_bookings = [b for b in (bookings or []) if b.get("created_at", "").startswith(today_str)]
        daily_inquiries = [i for i in (inquiries or []) if i.get("created_at", "").startswith(today_str)]
        
        # Weekly stats
        weekly_users = [u for u in (users or []) if u.get("created_at", "") >= week_ago_str]
        weekly_properties = [p for p in (properties or []) if p.get("created_at", "") >= week_ago_str]
        weekly_bookings = [b for b in (bookings or []) if b.get("created_at", "") >= week_ago_str]
        weekly_inquiries = [i for i in (inquiries or []) if i.get("created_at", "") >= week_ago_str]
        
        # Calculate property values
        sale_properties = [p for p in (properties or []) if p.get("listing_type") == "SALE" and p.get("price")]
        rent_properties = [p for p in (properties or []) if p.get("listing_type") == "RENT" and p.get("monthly_rent")]
        
        total_sale_value = sum(p.get("price", 0) for p in sale_properties)
        total_rent_value = sum(p.get("monthly_rent", 0) for p in rent_properties)
        average_price = total_sale_value / len(sale_properties) if sale_properties else 0
        average_rent = total_rent_value / len(rent_properties) if rent_properties else 0
        
        # Pending approvals
        pending_users = [u for u in (users or []) if u.get("verification_status") == "pending"]
        
        stats = {
            "totalUsers": len(users) if users else 0,
            "totalProperties": len(properties) if properties else 0,
            "totalBookings": len(bookings) if bookings else 0,
            "totalInquiries": len(inquiries) if inquiries else 0,
            "pendingApprovals": len(pending_users),
            "dailyStats": {
                "newUsers": len(daily_users),
                "newProperties": len(daily_properties),
                "newBookings": len(daily_bookings),
                "newInquiries": len(daily_inquiries),
            },
            "weeklyStats": {
                "users": len(weekly_users),
                "properties": len(weekly_properties),
                "bookings": len(weekly_bookings),
                "inquiries": len(weekly_inquiries),
            },
            "propertyValues": {
                "totalSaleValue": total_sale_value,
                "totalRentValue": total_rent_value,
                "averagePrice": average_price,
                "averageRent": average_rent,
            },
            "unassignedProperties": 0,  # Calculate if needed
            "notifications": []  # Implement if needed
        }
        
        print(f"[ADMIN]  Stats calculated successfully")
        return stats
        
    except Exception as e:
        print(f"[ADMIN]  Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")



@router.get("/analytics")
async def get_advanced_analytics(range: str = "month", _=Depends(require_api_key)):
    """Get advanced analytics data with time range filter"""
    try:
        print(f"[ADMIN] Fetching advanced analytics for range: {range}")
        
        # Calculate date range
        now = dt.datetime.now(dt.timezone.utc)
        if range == "week":
            start_date = now - dt.timedelta(days=7)
        elif range == "year":
            start_date = now - dt.timedelta(days=365)
        else:  # month
            start_date = now - dt.timedelta(days=30)
        
        # Get all data
        all_users = await db.admin_select("users")
        users = [u for u in (all_users or []) if u.get("status") != "deleted"]
        properties = await db.admin_select("properties")
        bookings = await db.admin_select("bookings")
        inquiries = await db.admin_select("inquiries")
        
        # Calculate overview
        overview = {
            "totalUsers": len(users),
            "totalProperties": len(properties or []),
            "totalBookings": len(bookings or []),
            "totalInquiries": len(inquiries or []),
            "totalRevenue": 0,  # Can be calculated from earnings table
            "activeListings": len([p for p in (properties or []) if p.get("status") == "active"])
        }
        
        # Calculate growth trends (compare with previous period)
        prev_start = start_date - (now - start_date)
        prev_users = [u for u in users if dt.datetime.fromisoformat(u.get("created_at", "").replace("Z", "+00:00")) < start_date]
        prev_properties = [p for p in (properties or []) if dt.datetime.fromisoformat(p.get("created_at", "").replace("Z", "+00:00")) < start_date]
        prev_bookings = [b for b in (bookings or []) if dt.datetime.fromisoformat(b.get("created_at", "").replace("Z", "+00:00")) < start_date]
        
        current_users = len([u for u in users if dt.datetime.fromisoformat(u.get("created_at", "").replace("Z", "+00:00")) >= start_date])
        current_properties = len([p for p in (properties or []) if dt.datetime.fromisoformat(p.get("created_at", "").replace("Z", "+00:00")) >= start_date])
        current_bookings = len([b for b in (bookings or []) if dt.datetime.fromisoformat(b.get("created_at", "").replace("Z", "+00:00")) >= start_date])
        
        trends = {
            "usersGrowth": round((current_users / max(len(prev_users), 1)) * 100 - 100, 1),
            "propertiesGrowth": round((current_properties / max(len(prev_properties), 1)) * 100 - 100, 1),
            "bookingsGrowth": round((current_bookings / max(len(prev_bookings), 1)) * 100 - 100, 1)
        }
        
        # Users by type
        user_types = {}
        for user in users:
            user_type = user.get("user_type", "buyer")
            user_types[user_type] = user_types.get(user_type, 0) + 1
        
        users_by_type = [
            {"name": "Buyers", "value": user_types.get("buyer", 0), "color": "#0ca5e9"},
            {"name": "Sellers", "value": user_types.get("seller", 0), "color": "#10b981"},
            {"name": "Agents", "value": user_types.get("agent", 0), "color": "#8b5cf6"},
            {"name": "Admins", "value": user_types.get("admin", 0), "color": "#f59e0b"}
        ]
        
        # Properties by type
        property_types = {}
        for prop in (properties or []):
            prop_type = prop.get("property_type", "other")
            property_types[prop_type] = property_types.get(prop_type, 0) + 1
        
        properties_by_type = [
            {"name": ptype.replace("_", " ").title(), "value": count}
            for ptype, count in property_types.items()
        ]
        
        # Bookings by status
        booking_statuses = {}
        for booking in (bookings or []):
            status = booking.get("status", "pending")
            booking_statuses[status] = booking_statuses.get(status, 0) + 1
        
        bookings_by_status = [
            {"name": status.title(), "value": count}
            for status, count in booking_statuses.items()
        ]
        
        # Monthly data (last 6 months)
        monthly_data = []
        for i in range(6):
            month_start = now - dt.timedelta(days=30 * (5 - i))
            month_end = now - dt.timedelta(days=30 * (4 - i))
            
            month_users = len([u for u in users if month_start <= dt.datetime.fromisoformat(u.get("created_at", "").replace("Z", "+00:00")) < month_end])
            month_properties = len([p for p in (properties or []) if month_start <= dt.datetime.fromisoformat(p.get("created_at", "").replace("Z", "+00:00")) < month_end])
            month_bookings = len([b for b in (bookings or []) if month_start <= dt.datetime.fromisoformat(b.get("created_at", "").replace("Z", "+00:00")) < month_end])
            month_inquiries = len([inq for inq in (inquiries or []) if month_start <= dt.datetime.fromisoformat(inq.get("created_at", "").replace("Z", "+00:00")) < month_end])
            
            monthly_data.append({
                "month": month_start.strftime("%b"),
                "users": month_users,
                "properties": month_properties,
                "bookings": month_bookings,
                "inquiries": month_inquiries
            })
        
        # Top performing properties (mock data - can be enhanced with real metrics)
        top_properties = []
        for prop in (properties or [])[:5]:
            prop_inquiries = len([i for i in (inquiries or []) if i.get("property_id") == prop.get("id")])
            prop_bookings = len([b for b in (bookings or []) if b.get("property_id") == prop.get("id")])
            
            top_properties.append({
                "id": prop.get("id"),
                "title": prop.get("title", "Untitled Property"),
                "views": 0,  # Can be tracked separately
                "inquiries": prop_inquiries,
                "bookings": prop_bookings
            })
        
        # Recent activity
        recent_activity = []
        
        # Add recent bookings
        for booking in (bookings or [])[-5:]:
            recent_activity.append({
                "id": booking.get("id"),
                "type": "booking",
                "message": f"New booking for {booking.get('property_id', 'property')}",
                "timestamp": booking.get("created_at", "")
            })
        
        # Add recent inquiries
        for inquiry in (inquiries or [])[-5:]:
            recent_activity.append({
                "id": inquiry.get("id"),
                "type": "inquiry",
                "message": f"New inquiry from {inquiry.get('name', 'user')}",
                "timestamp": inquiry.get("created_at", "")
            })
        
        # Sort by timestamp
        recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_activity = recent_activity[:10]
        
        analytics_data = {
            "overview": overview,
            "trends": trends,
            "usersByType": users_by_type,
            "propertiesByType": properties_by_type,
            "bookingsByStatus": bookings_by_status,
            "monthlyData": monthly_data,
            "topPerformingProperties": top_properties,
            "recentActivity": recent_activity
        }
        
        print(f"[ADMIN] Advanced analytics calculated successfully")
        return analytics_data
        
    except Exception as e:
        print(f"[ADMIN] Analytics error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

@router.get("/inquiries")
async def list_inquiries(_=Depends(require_api_key)):
    try:
        print("[ADMIN]  Fetching all inquiries")
        inquiries = await db.admin_select("inquiries")
        print(f"[ADMIN]  Found {len(inquiries) if inquiries else 0} inquiries")
        return inquiries or []
    except Exception as e:
        print(f"[ADMIN]  List inquiries error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")


@router.get("/properties")
async def list_properties(_=Depends(require_api_key)):
    try:
        print("[ADMIN] Fetching all properties")
        properties = await db.admin_select("properties")
        print(f"[ADMIN] Found {len(properties) if properties else 0} properties")
        return properties or []
    except Exception as e:
        print(f"[ADMIN] List properties error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch properties: {str(e)}")


@router.post("/users")
async def create_user(request: Request, _=Depends(require_api_key)):
    """Create a new user (admin).
    Expects JSON body with at least `email` and `password`. Optional fields: first_name, last_name, user_type.
    """
    try:
        try:
            data = await request.json()
        except Exception:
            data = {}

        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        if not email or not password:
            raise HTTPException(status_code=400, detail="`email` and `password` are required")

        # Prevent duplicate emails
        existing = await db.admin_select('users', filters={'email': email})
        if existing:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        # Guard: ensure server configured for writes
        if not getattr(db, 'admin_client', None) and not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
            raise HTTPException(status_code=500, detail=("Server misconfigured for writes: SUPABASE_SERVICE_ROLE_KEY or admin client missing. "
                                                         "Set SUPABASE_SERVICE_ROLE_KEY in python_api/.env and restart the API."))

        user_type = data.get('user_type', 'client')
        first_name = data.get('first_name') or ''
        last_name = data.get('last_name') or ''

        now_iso = dt.datetime.utcnow().isoformat()
        user_row = {
            'email': email,
            'password_hash': hash_password(password),
            'first_name': first_name,
            'last_name': last_name,
            'user_type': user_type,
            'status': 'active',
            'created_at': now_iso,
            'updated_at': now_iso,
        }

        await db.insert('users', user_row)

        created = await db.admin_select('users', filters={'email': email})
        return {'success': True, 'user': created[0] if created else user_row}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Create user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.get("/documents")
async def list_documents(entity_type: str | None = None, entity_id: str | None = None, _=Depends(require_api_key)):
    try:
        print(f"[ADMIN]  Fetching documents (type={entity_type}, id={entity_id})")
        filters = {}
        if entity_type:
            filters["entity_type"] = entity_type
        if entity_id:
            filters["entity_id"] = entity_id
        docs = await db.admin_select("documents", filters=filters)
        # Resolve public URLs for storage references if present
        for d in (docs or []):
            if d.get("storage_bucket") and d.get("storage_path"):
                try:
                    d["public_url"] = await get_public_url(d.get("storage_bucket"), d.get("storage_path"))
                except Exception:
                    d["public_url"] = None
        return docs or []
    except Exception as e:
        print(f"[ADMIN]  List documents error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


@router.post("/documents/{document_id}/approve")
async def approve_document(document_id: str, _=Depends(require_api_key)):
    try:
        print(f"[ADMIN]  Approving document: {document_id}")
        # Since documents table doesn't have status field, we'll just return success
        # In a real implementation, you might want to add a status field to the documents table
        return {"success": True, "message": "Document approved successfully"}
    except Exception as e:
        print(f"[ADMIN]  Approve document error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve document: {str(e)}")


@router.post("/documents/{document_id}/reject")
async def reject_document(document_id: str, data: dict | None = None, _=Depends(require_api_key)):
    try:
        reason = (data or {}).get("reason") if isinstance(data, dict) else None
        print(f"[ADMIN]  Rejecting document: {document_id} reason={reason}")
        # Since documents table doesn't have status/rejection_reason fields, we'll just return success
        # In a real implementation, you might want to add these fields to the documents table
        return {"success": True, "message": "Document rejected successfully"}
    except Exception as e:
        print(f"[ADMIN]  Reject document error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject document: {str(e)}")

@router.get("/bookings")
async def list_bookings(_=Depends(require_api_key)):
    try:
        print("[ADMIN]  Fetching all bookings")
        bookings = await db.admin_select("bookings")
        print(f"[ADMIN]  Found {len(bookings) if bookings else 0} bookings")
        return bookings or []
    except Exception as e:
        print(f"[ADMIN]  List bookings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, _=Depends(require_api_key)):
    try:
        print(f"[ADMIN]  Approving user: {user_id}")
        
        # Get user details first
        users = await db.admin_select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = users[0]
        user_type = user.get("user_type", "buyer")
        
        # Generate custom ID
        custom_id = await generate_custom_id(user_type)
        print(f"[ADMIN]  Generated custom ID: {custom_id} for user type: {user_type}")
        
        # Update user status and custom ID
        await db.update("users", {
            "verification_status": "verified",
            "status": "active",
            "custom_id": custom_id,
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": user_id})
        
        # Update user approval record
        await db.update("user_approvals", {
            "status": "approved",
            "approved_at": dt.datetime.utcnow().isoformat()
        }, {"user_id": user_id})
        
        # Generate license number for agents using database RPC if available
        license_number = None
        if user_type == "agent":
            try:
                # Call Postgres RPC function `approve_user(user_id, approved_by)` if present
                # Pass approved_by as None for now (could be admin id in future)
                res = await db.rpc('approve_user', {'user_id_param': user_id, 'approved_by_param': None})
                # If RPC returned a license number or updated row, try to read agent_license_number
                updated = await db.admin_select('users', filters={'id': user_id})
                if updated:
                    license_number = updated[0].get('agent_license_number')
            except Exception as rpc_err:
                print(f"[ADMIN]  RPC approve_user failed, falling back: {rpc_err}")
                # Fallback: generate locally (last resort)
                license_number = f"H001{str(random.randint(100, 999))}"
                await db.update("users", {"agent_license_number": license_number}, {"id": user_id})
        
        print(f"[ADMIN]  User approved successfully with custom ID: {custom_id}")
        
        # Notify user by email (non-blocking)
        try:
            subject = "Your Home & Own account has been approved"
            html = f"""
            <p>Hi {user.get('first_name', '')},</p>
            <p>Your account has been approved by our team.</p>
            <p><strong>Your User ID:</strong> {custom_id}</p>
            {"<p><strong>Your Agent License:</strong> " + license_number + "</p>" if license_number else ""}
            <p>You can now sign in to your account.</p>
            """
            await send_email(user.get('email'), subject, html)
            print(f"[ADMIN]  Sent approval email to user {user_id}")
        except Exception as e:
            print(f"[ADMIN]  Failed to send approval email for {user_id}: {e}")
            
        return {
            "success": True, 
            "message": "User approved successfully",
            "custom_id": custom_id,
            "license_number": license_number
        }
        
    except Exception as e:
        print(f"[ADMIN]  Approve user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve user: {str(e)}")


# ===== ADMIN APPROVAL SYSTEM =====

@router.get("/approvals")
async def list_approvals(approval_type: str | None = None, status: str | None = None, _=Depends(require_api_key)):
    """Get all admin approvals with optional filtering"""
    try:
        print(f"[ADMIN]  Fetching approvals (type={approval_type}, status={status})")

        # Get admin approvals
        filters = {}
        if approval_type:
            filters["approval_type"] = approval_type
        if status:
            filters["status"] = status

        admin_approvals = await db.admin_select("admin_approvals", filters=filters)

        # Get user approvals
        user_approvals = await db.admin_select("user_approvals", filters=filters)

        # Enrich with user details
        users = await db.admin_select("users")
        users_by_id = {u.get("id"): u for u in (users or [])}

        enriched_admin_approvals = []
        for approval in (admin_approvals or []):
            user_id = approval.get("user_id")
            if user_id and users_by_id.get(user_id):
                approval_copy = dict(approval)
                approval_copy["user"] = users_by_id[user_id]
                enriched_admin_approvals.append(approval_copy)
            else:
                enriched_admin_approvals.append(approval)

        enriched_user_approvals = []
        for approval in (user_approvals or []):
            user_id = approval.get("user_id")
            if user_id and users_by_id.get(user_id):
                approval_copy = dict(approval)
                approval_copy["user"] = users_by_id[user_id]
                enriched_user_approvals.append(approval_copy)
            else:
                enriched_user_approvals.append(approval)

        return {
            "admin_approvals": enriched_admin_approvals,
            "user_approvals": enriched_user_approvals
        }

    except Exception as e:
        print(f"[ADMIN]  List approvals error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch approvals: {str(e)}")


@router.post("/approvals/{approval_id}/approve")
async def approve_admin_approval(approval_id: str, request: Request, _=Depends(require_api_key)):
    """Approve an admin approval request"""
    try:
        data = await request.json()
        admin_notes = data.get("admin_notes", "")
        license_number = data.get("license_number")

        print(f"[ADMIN]  Approving admin approval: {approval_id}")

        # Get the approval
        approvals = await db.admin_select("admin_approvals", filters={"id": approval_id})
        if not approvals:
            raise HTTPException(status_code=404, detail="Approval not found")

        approval = approvals[0]
        user_id = approval.get("user_id")
        approval_type = approval.get("approval_type")

        # Update approval status
        await db.update("admin_approvals", {
            "status": "approved",
            "admin_notes": admin_notes,
            "approved_at": dt.datetime.utcnow().isoformat()
        }, {"id": approval_id})
        
        # Send approval email
        try:
            from ..services.email import send_email
            from ..services.templates import approval_email
            
            # Get user details
            user_data = await db.admin_select("users", filters={"id": user_id})
            if user_data:
                user = user_data[0]
                user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                user_email = user.get('email')
                
                if user_email:
                    approval_html = approval_email(
                        user_name,
                        approval_type,
                        'approved',
                        admin_notes
                    )
                    await send_email(
                        to=user_email,
                        subject="Request Approved - Home & Own",
                        html=approval_html
                    )
                    print(f"[ADMIN]  Approval email sent to: {user_email}")
        except Exception as email_error:
            print(f"[ADMIN]  Email sending failed: {email_error}")
            # Don't fail the approval if email fails

        # Handle specific approval types
        if approval_type == "agent_license":
            # Generate license number if not provided
            if not license_number:
                license_number = f"HA{str(random.randint(10000, 99999))}"

            # Update agent profile
            await db.update("agent_profiles", {
                "license_number": license_number,
                "license_status": "approved",
                "license_approved_at": dt.datetime.utcnow().isoformat()
            }, {"user_id": user_id})

            # Update user
            await db.update("users", {
                "agent_license_number": license_number,
                "verification_status": "verified"
            }, {"id": user_id})

        elif approval_type == "seller_verification":
            # Update seller profile
            await db.update("seller_profiles", {
                "verification_status": "approved",
                "status": "active"
            }, {"user_id": user_id})

            # Update user
            await db.update("users", {
                "verification_status": "verified"
            }, {"id": user_id})

        # Create notification
        await create_notification(
            user_id=user_id,
            title="Approval Granted",
            message=f"Your {approval_type.replace('_', ' ')} has been approved.",
            type="approval",
            entity_type="admin_approval",
            entity_id=approval_id
        )

        return {"success": True, "message": "Approval granted successfully"}

    except Exception as e:
        print(f"[ADMIN]  Approve admin approval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve: {str(e)}")


@router.post("/properties/{property_id}/approve")
async def approve_property(property_id: str, _=Depends(require_api_key)):
    """Approve a property and send notification email to owner"""
    try:
        print(f"[ADMIN] Approving property: {property_id}")
        
        # Get property details
        properties = await db.admin_select("properties", filters={"id": property_id})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = properties[0]
        
        # Update property status
        await db.update("properties", {
            "verified": True,
            "status": "active",
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": property_id})
        
        # Send approval email to property owner
        try:
            owner_id = property_data.get('owner_id') or property_data.get('added_by')
            if owner_id:
                # Get owner details
                users = await db.admin_select("users", filters={"id": owner_id})
                if users:
                    owner = users[0]
                    owner_email = owner.get('email')
                    owner_name = f"{owner.get('first_name', '')} {owner.get('last_name', '')}".strip()
                    property_title = property_data.get('title', 'Property')
                    
                    if owner_email:
                        email_html = f"""
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #10b981;">🎉 Property Approved!</h2>
                                <p>Hello {owner_name},</p>
                                <p>Great news! Your property "<strong>{property_title}</strong>" has been approved by our admin team and is now live on Home & Own!</p>
                                
                                <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #065f46;">Property Details:</h3>
                                    <p><strong>Title:</strong> {property_title}</p>
                                    <p><strong>Type:</strong> {property_data.get('property_type', 'N/A').replace('_', ' ').title()}</p>
                                    <p><strong>Listing Type:</strong> {property_data.get('listing_type', 'N/A')}</p>
                                    <p><strong>Location:</strong> {property_data.get('city', 'N/A')}, {property_data.get('state', 'N/A')}</p>
                                    <p><strong>Area:</strong> {property_data.get('area_sqft', 'N/A')} sq ft</p>
                                    {f'<p><strong>Price:</strong> ₹{property_data.get("price", "N/A")}</p>' if property_data.get('listing_type') == 'SALE' and property_data.get('price') else ''}
                                    {f'<p><strong>Monthly Rent:</strong> ₹{property_data.get("monthly_rent", "N/A")}</p>' if property_data.get('listing_type') == 'RENT' and property_data.get('monthly_rent') else ''}
                                </div>
                                
                                <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                    <p style="margin: 0; color: #1e40af;"><strong>What's Next?</strong></p>
                                    <ul style="margin: 10px 0 0 0; color: #1e40af;">
                                        <li>Your property is now visible to potential buyers/tenants</li>
                                        <li>You'll receive inquiries directly to your email</li>
                                        <li>Our team will help promote your property</li>
                                    </ul>
                                </div>
                                
                                <p>Thank you for choosing Home & Own!</p>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                                <p style="color: #999; font-size: 12px;">© 2025 Home & Own. All rights reserved.</p>
                            </div>
                        </body>
                        </html>
                        """
                        
                        from ..services.email import send_email
                        await send_email(
                            to=owner_email,
                            subject=f"🎉 Property Approved - {property_title} is now live! - Home & Own",
                            html=email_html
                        )
                        print(f"[ADMIN] Property approval email sent to owner: {owner_email}")
        except Exception as email_error:
            print(f"[ADMIN] Failed to send property approval email: {email_error}")
        
        # Create notification
        await create_notification(
            user_id=owner_id,
            title="Property Approved",
            message=f"Your property '{property_data.get('title', 'Property')}' has been approved and is now live!",
            type="approval",
            entity_type="property",
            entity_id=property_id
        )
        
        print(f"[ADMIN] Property {property_id} approved successfully")
        return {"success": True, "message": "Property approved successfully"}
        
    except Exception as e:
        print(f"[ADMIN] Approve property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve property: {str(e)}")


@router.post("/properties/{property_id}/reject")
async def reject_property(property_id: str, request: Request, _=Depends(require_api_key)):
    """Reject a property and send notification email to owner"""
    try:
        data = await request.json()
        rejection_reason = data.get("rejection_reason", "Property does not meet our quality standards")
        
        print(f"[ADMIN] Rejecting property: {property_id}")
        
        # Get property details
        properties = await db.admin_select("properties", filters={"id": property_id})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = properties[0]
        
        # Update property status
        await db.update("properties", {
            "verified": False,
            "status": "rejected",
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": property_id})
        
        # Send rejection email to property owner
        try:
            owner_id = property_data.get('owner_id') or property_data.get('added_by')
            if owner_id:
                # Get owner details
                users = await db.admin_select("users", filters={"id": owner_id})
                if users:
                    owner = users[0]
                    owner_email = owner.get('email')
                    owner_name = f"{owner.get('first_name', '')} {owner.get('last_name', '')}".strip()
                    property_title = property_data.get('title', 'Property')
                    
                    if owner_email:
                        email_html = f"""
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #dc2626;">Property Submission Update</h2>
                                <p>Hello {owner_name},</p>
                                <p>We've reviewed your property "<strong>{property_title}</strong>" and unfortunately, it doesn't meet our current quality standards.</p>
                                
                                <div style="background-color: #fef2f2; border: 1px solid #dc2626; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #991b1b;">Reason for Rejection:</h3>
                                    <p style="color: #991b1b;">{rejection_reason}</p>
                                </div>
                                
                                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                    <p style="margin: 0; color: #0c4a6e;"><strong>What You Can Do:</strong></p>
                                    <ul style="margin: 10px 0 0 0; color: #0c4a6e;">
                                        <li>Review the feedback and make necessary improvements</li>
                                        <li>Resubmit your property with better details/photos</li>
                                        <li>Contact our support team for assistance</li>
                                    </ul>
                                </div>
                                
                                <p>We appreciate your interest in Home & Own and look forward to working with you!</p>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                                <p style="color: #999; font-size: 12px;">© 2025 Home & Own. All rights reserved.</p>
                            </div>
                        </body>
                        </html>
                        """
                        
                        from ..services.email import send_email
                        await send_email(
                            to=owner_email,
                            subject=f"Property Submission Update - {property_title} - Home & Own",
                            html=email_html
                        )
                        print(f"[ADMIN] Property rejection email sent to owner: {owner_email}")
        except Exception as email_error:
            print(f"[ADMIN] Failed to send property rejection email: {email_error}")
        
        # Create notification
        await create_notification(
            user_id=owner_id,
            title="Property Rejected",
            message=f"Your property '{property_data.get('title', 'Property')}' was rejected. Please check the feedback and resubmit.",
            type="rejection",
            entity_type="property",
            entity_id=property_id
        )
        
        print(f"[ADMIN] Property {property_id} rejected successfully")
        return {"success": True, "message": "Property rejected successfully"}
        
    except Exception as e:
        print(f"[ADMIN] Reject property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject property: {str(e)}")


@router.post("/approvals/{approval_id}/reject")
async def reject_admin_approval(approval_id: str, request: Request, _=Depends(require_api_key)):
    """Reject an admin approval request"""
    try:
        data = await request.json()
        admin_notes = data.get("admin_notes", "No reason provided")

        print(f"[ADMIN]  Rejecting admin approval: {approval_id}")

        # Get the approval
        approvals = await db.admin_select("admin_approvals", filters={"id": approval_id})
        if not approvals:
            raise HTTPException(status_code=404, detail="Approval not found")

        approval = approvals[0]
        user_id = approval.get("user_id")
        approval_type = approval.get("approval_type")

        # Update approval status
        await db.update("admin_approvals", {
            "status": "rejected",
            "admin_notes": admin_notes,
            "approved_at": dt.datetime.utcnow().isoformat()
        }, {"id": approval_id})
        
        # Send rejection email
        try:
            from ..services.email import send_email
            from ..services.templates import approval_email
            
            # Get user details
            user_data = await db.admin_select("users", filters={"id": user_id})
            if user_data:
                user = user_data[0]
                user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                user_email = user.get('email')
                
                if user_email:
                    rejection_html = approval_email(
                        user_name,
                        approval_type,
                        'rejected',
                        admin_notes
                    )
                    await send_email(
                        to=user_email,
                        subject="Request Rejected - Home & Own",
                        html=rejection_html
                    )
                    print(f"[ADMIN]  Rejection email sent to: {user_email}")
        except Exception as email_error:
            print(f"[ADMIN]  Email sending failed: {email_error}")
            # Don't fail the rejection if email fails

        # Handle specific rejection types
        if approval_type == "agent_license":
            await db.update("agent_profiles", {
                "license_status": "rejected"
            }, {"user_id": user_id})

        elif approval_type == "seller_verification":
            await db.update("seller_profiles", {
                "verification_status": "rejected",
                "status": "rejected"
            }, {"user_id": user_id})

        # Create notification
        await create_notification(
            user_id=user_id,
            title="Approval Rejected",
            message=f"Your {approval_type.replace('_', ' ')} has been rejected. Reason: {admin_notes}",
            type="rejection",
            entity_type="admin_approval",
            entity_id=approval_id
        )

        return {"success": True, "message": "Approval rejected successfully"}

    except Exception as e:
        print(f"[ADMIN]  Reject admin approval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject: {str(e)}")


@router.post("/approvals/{approval_id}/resubmit")
async def resubmit_admin_approval(approval_id: str, request: Request, _=Depends(require_api_key)):
    """Request resubmission of an admin approval request"""
    try:
        data = await request.json()
        admin_notes = data.get("admin_notes", "Please resubmit with corrections")

        print(f"[ADMIN]  Requesting resubmission for approval: {approval_id}")

        # Get the approval
        approvals = await db.admin_select("admin_approvals", filters={"id": approval_id})
        if not approvals:
            raise HTTPException(status_code=404, detail="Approval not found")

        approval = approvals[0]
        user_id = approval.get("user_id")
        approval_type = approval.get("approval_type")

        # Update approval status
        await db.update("admin_approvals", {
            "status": "resubmit",
            "admin_notes": admin_notes,
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": approval_id})
        
        # Send resubmit email
        try:
            from ..services.email import send_email
            from ..services.templates import approval_email
            
            # Get user details
            user_data = await db.admin_select("users", filters={"id": user_id})
            if user_data:
                user = user_data[0]
                user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                user_email = user.get('email')
                
                if user_email:
                    resubmit_html = approval_email(
                        user_name,
                        approval_type,
                        'resubmit',
                        admin_notes
                    )
                    await send_email(
                        to=user_email,
                        subject="Request Needs Resubmission - Home & Own",
                        html=resubmit_html
                    )
                    print(f"[ADMIN]  Resubmit email sent to: {user_email}")
        except Exception as email_error:
            print(f"[ADMIN]  Email sending failed: {email_error}")
            # Don't fail the resubmit if email fails

        # Create notification
        await create_notification(
            user_id=user_id,
            title="Resubmission Required",
            message=f"Your {approval_type.replace('_', ' ')} needs to be resubmitted with corrections.",
            type="approval",
            entity_type="admin_approval",
            entity_id=approval_id
        )

        return {"success": True, "message": "Resubmission requested successfully"}

    except Exception as e:
        print(f"[ADMIN]  Resubmit admin approval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to request resubmission: {str(e)}")


@router.post("/inquiries/{inquiry_id}/assign-agent")
async def assign_agent_to_inquiry(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Assign an agent to an inquiry"""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Assigning agent {agent_id} to inquiry {inquiry_id}")

        # Get inquiry details
        inquiries = await db.admin_select("inquiries", filters={"id": inquiry_id})
        if not inquiries:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        inquiry = inquiries[0]
        
        # Get property details
        properties = await db.admin_select("properties", filters={"id": inquiry.get("property_id")})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_info = properties[0]
        
        # Get agent details
        agents = await db.admin_select("users", filters={"id": agent_id})
        if not agents:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agents[0]
        
        # Update inquiry with agent assignment
        await db.update("inquiries", {
            "agent_id": agent_id,
            "status": "assigned",
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": inquiry_id})
        
        # Send assignment email to agent
        try:
            from ..services.email import send_email
            from ..services.templates import agent_inquiry_assignment_email
            
            agent_name = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
            agent_email = agent.get('email')
            
            if agent_email:
                assignment_html = agent_inquiry_assignment_email(
                    agent_name,
                    inquiry.get('name', 'Client'),
                    property_info.get('title', 'Property'),
                    inquiry.get('message', '')
                )
                await send_email(
                    to=agent_email,
                    subject=f"New Inquiry Assignment - {property_info.get('title', 'Property')}",
                    html=assignment_html
                )
                print(f"[ADMIN]  Assignment email sent to agent: {agent_email}")
        except Exception as email_error:
            print(f"[ADMIN]  Email sending failed: {email_error}")
            # Don't fail the assignment if email fails

        return {"success": True, "message": "Agent assigned successfully"}

    except Exception as e:
        print(f"[ADMIN]  Assign agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign agent: {str(e)}")


@router.post("/inquiries/{inquiry_id}/agent-response")
async def agent_inquiry_response(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Agent responds to an inquiry"""
    try:
        data = await request.json()
        response_message = data.get("response_message", "")
        visit_scheduled = data.get("visit_scheduled", False)
        
        if not response_message:
            raise HTTPException(status_code=400, detail="Response message is required")

        print(f"[ADMIN]  Agent responding to inquiry {inquiry_id}")

        # Get inquiry details
        inquiries = await db.admin_select("inquiries", filters={"id": inquiry_id})
        if not inquiries:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        inquiry = inquiries[0]
        
        # Get property details
        properties = await db.admin_select("properties", filters={"id": inquiry.get("property_id")})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_info = properties[0]
        
        # Get agent details
        agents = await db.admin_select("users", filters={"id": inquiry.get("agent_id")})
        if not agents:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agents[0]
        
        # Update inquiry with agent response
        await db.update("inquiries", {
            "agent_response": response_message,
            "visit_scheduled": visit_scheduled,
            "status": "responded",
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": inquiry_id})
        
        # Send response email to inquirer
        try:
            from ..services.email import send_email
            from ..services.templates import agent_inquiry_response_email
            
            inquirer_email = inquiry.get('email')
            inquirer_name = inquiry.get('name', 'Client')
            agent_name = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
            
            if inquirer_email:
                response_html = agent_inquiry_response_email(
                    inquirer_name,
                    agent_name,
                    property_info.get('title', 'Property'),
                    response_message,
                    visit_scheduled
                )
                await send_email(
                    to=inquirer_email,
                    subject=f"Agent Response - {property_info.get('title', 'Property')}",
                    html=response_html
                )
                print(f"[ADMIN]  Response email sent to inquirer: {inquirer_email}")
        except Exception as email_error:
            print(f"[ADMIN]  Email sending failed: {email_error}")
            # Don't fail the response if email fails

        return {"success": True, "message": "Response sent successfully"}

    except Exception as e:
        print(f"[ADMIN]  Agent response error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send response: {str(e)}")


# ===== NOTIFICATION SYSTEM =====

async def create_notification(user_id: str, title: str, message: str, type: str, entity_type: str | None = None, entity_id: str | None = None):
    """Create a notification for a user"""
    try:
        notification_data = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "read": False,
            "created_at": dt.datetime.utcnow().isoformat()
        }

        await db.insert("notifications", notification_data)
        print(f"[NOTIFICATION]  Created notification for user {user_id}: {title}")

    except Exception as e:
        print(f"[NOTIFICATION]  Failed to create notification: {e}")


@router.get("/notifications")
async def list_notifications(user_id: str | None = None, read: bool | None = None, _=Depends(require_api_key)):
    """Get notifications with optional filtering"""
    try:
        print(f"[ADMIN]  Fetching notifications (user={user_id}, read={read})")

        filters = {}
        if user_id:
            filters["user_id"] = user_id
        if read is not None:
            filters["read"] = read

        notifications = await db.admin_select("notifications", filters=filters)

        # Enrich with user details
        if notifications:
            user_ids = list(set(n.get("user_id") for n in notifications if n.get("user_id")))
            users = await db.admin_select("users", filters={"id": {"in": user_ids}} if len(user_ids) > 1 else {"id": user_ids[0]} if user_ids else {})
            users_by_id = {u.get("id"): u for u in (users or [])}

            for notification in notifications:
                user_id = notification.get("user_id")
                if user_id and users_by_id.get(user_id):
                    notification["user"] = users_by_id[user_id]

        return notifications or []

    except Exception as e:
        print(f"[ADMIN]  List notifications error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str, _=Depends(require_api_key)):
    """Mark a notification as read"""
    try:
        print(f"[ADMIN]  Marking notification as read: {notification_id}")

        await db.update("notifications", {
            "read": True
        }, {"id": notification_id})

        return {"success": True, "message": "Notification marked as read"}

    except Exception as e:
        print(f"[ADMIN]  Mark notification read error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")


# ===== AGENT ASSIGNMENT SYSTEM =====

@router.post("/inquiries/{inquiry_id}/assign-agent")
async def assign_agent_to_inquiry(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Assign an agent to an inquiry"""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        notes = data.get("notes", "")

        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Assigning agent {agent_id} to inquiry {inquiry_id}")

        # Check if assignment already exists
        existing = await db.admin_select("agent_inquiry_assignments", filters={
            "inquiry_id": inquiry_id,
            "agent_id": agent_id,
            "status": "active"
        })

        if existing:
            raise HTTPException(status_code=409, detail="Agent already assigned to this inquiry")

        # Create assignment
        assignment_data = {
            "inquiry_id": inquiry_id,
            "agent_id": agent_id,
            "status": "active",
            "assigned_at": dt.datetime.utcnow().isoformat(),
            "notes": notes
        }

        await db.insert("agent_inquiry_assignments", assignment_data)

        # Update inquiry with assigned agent
        await db.update("inquiries", {
            "assigned_agent_id": agent_id,
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": inquiry_id})

        # Create notification for agent
        await create_notification(
            user_id=agent_id,
            title="New Inquiry Assigned",
            message=f"You have been assigned a new inquiry (ID: {inquiry_id})",
            type="assignment",
            entity_type="inquiry",
            entity_id=inquiry_id
        )

        return {"success": True, "message": "Agent assigned to inquiry successfully"}

    except Exception as e:
        print(f"[ADMIN]  Assign agent to inquiry error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign agent: {str(e)}")


@router.post("/properties/{property_id}/assign-agent")
async def assign_agent_to_property(property_id: str, request: Request, _=Depends(require_api_key)):
    """Assign an agent to a property"""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        notes = data.get("notes", "")

        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Assigning agent {agent_id} to property {property_id}")

        # Check if assignment already exists
        existing = await db.admin_select("agent_property_assignments", filters={
            "property_id": property_id,
            "agent_id": agent_id,
            "status": "active"
        })

        if existing:
            raise HTTPException(status_code=409, detail="Agent already assigned to this property")

        # Create assignment
        assignment_data = {
            "property_id": property_id,
            "agent_id": agent_id,
            "status": "active",
            "assigned_at": dt.datetime.utcnow().isoformat(),
            "notes": notes
        }

        await db.insert("agent_property_assignments", assignment_data)

        # Update property with assigned agent
        await db.update("properties", {
            "agent_id": agent_id,
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": property_id})

        # Create notification for agent
        await create_notification(
            user_id=agent_id,
            title="New Property Assigned",
            message=f"You have been assigned a new property (ID: {property_id})",
            type="assignment",
            entity_type="property",
            entity_id=property_id
        )

        return {"success": True, "message": "Agent assigned to property successfully"}

    except Exception as e:
        print(f"[ADMIN]  Assign agent to property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign agent: {str(e)}")


@router.get("/agent-assignments")
async def list_agent_assignments(agent_id: str | None = None, _=Depends(require_api_key)):
    """Get agent assignments"""
    try:
        print(f"[ADMIN]  Fetching agent assignments (agent={agent_id})")

        # Get inquiry assignments
        inquiry_filters = {"agent_id": agent_id} if agent_id else {}
        inquiry_assignments = await db.admin_select("agent_inquiry_assignments", filters=inquiry_filters)

        # Get property assignments
        property_filters = {"agent_id": agent_id} if agent_id else {}
        property_assignments = await db.admin_select("agent_property_assignments", filters=property_filters)

        # Enrich with related data
        if inquiry_assignments:
            inquiry_ids = [a.get("inquiry_id") for a in inquiry_assignments if a.get("inquiry_id")]
            inquiries = await db.admin_select("inquiries", filters={"id": {"in": inquiry_ids}} if len(inquiry_ids) > 1 else {"id": inquiry_ids[0]} if inquiry_ids else {})
            inquiries_by_id = {i.get("id"): i for i in (inquiries or [])}

            for assignment in inquiry_assignments:
                inquiry_id = assignment.get("inquiry_id")
                if inquiry_id and inquiries_by_id.get(inquiry_id):
                    assignment["inquiry"] = inquiries_by_id[inquiry_id]

        if property_assignments:
            property_ids = [a.get("property_id") for a in property_assignments if a.get("property_id")]
            properties = await db.admin_select("properties", filters={"id": {"in": property_ids}} if len(property_ids) > 1 else {"id": property_ids[0]} if property_ids else {})
            properties_by_id = {p.get("id"): p for p in (properties or [])}

            for assignment in property_assignments:
                property_id = assignment.get("property_id")
                if property_id and properties_by_id.get(property_id):
                    assignment["property"] = properties_by_id[property_id]

        return {
            "inquiry_assignments": inquiry_assignments or [],
            "property_assignments": property_assignments or []
        }

    except Exception as e:
        print(f"[ADMIN]  List agent assignments error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignments: {str(e)}")


@router.patch("/users/{user_id}")
async def update_user(user_id: str, request: Request, data: dict | None = None, _=Depends(require_api_key)):
    """Update a user's profile fields (admin).
    If verification_status is set to 'verified', mark email_verified and send notification email."""
    try:
        # If FastAPI didn't parse the JSON body into `data`, read raw JSON
        if data is None:
            try:
                data = await request.json()
            except Exception:
                data = {}

        print(f"[ADMIN]  Updating user {user_id} with: {data}")

        users = await db.admin_select("users", filters={"id": user_id})
        if not users:
            print(f"[ADMIN]  User not found for update: {user_id}")
            raise HTTPException(status_code=404, detail="Not Found")

        existing = users[0]
        prev_ver = existing.get("verification_status")

        # Ensure updated_at present
        updated_fields = dict(data)
        if "updated_at" not in updated_fields:
            updated_fields["updated_at"] = dt.datetime.utcnow().isoformat()

        # Quick guard: if admin client/service role key not configured, return helpful error
        if not getattr(db, 'admin_client', None) and not os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
            raise HTTPException(status_code=500, detail=("Server misconfigured for writes: SUPABASE_SERVICE_ROLE_KEY or admin client missing. "
                                                         "Set SUPABASE_SERVICE_ROLE_KEY in python_api/.env and restart the API."))

        await db.update("users", updated_fields, {"id": user_id})

        # If verification moved to verified, mark email_verified and notify user
        new_ver = updated_fields.get("verification_status")
        if new_ver == "verified" and not existing.get("email_verified", False):
            now_iso = dt.datetime.utcnow().isoformat()
            try:
                await db.update("users", {"email_verified": True, "email_verified_at": now_iso, "updated_at": now_iso}, {"id": user_id})
            except Exception as e:
                print(f"[ADMIN]  Failed to mark email_verified in DB for {user_id}: {e}")

            # Update or create an approval record
            try:
                await db.update("user_approvals", {"status": "approved", "approved_at": now_iso}, {"user_id": user_id})
            except Exception:
                # ignore if approvals table not present or update fails
                pass

            # Send notification email to the user (non-blocking)
            try:
                subject = "Your Home & Own account has been verified"
                html = f"<p>Hi {existing.get('first_name','')},</p><p>Your account has been verified by our team. You can now sign in to your account.</p>"
                await send_email(existing.get('email'), subject, html)
                print(f"[ADMIN]  Sent verification email to {existing.get('email')}")
            except Exception as e:
                print(f"[ADMIN]  Failed to send verification email to {existing.get('email')}: {e}")

        # Return updated user record
        updated_users = await db.admin_select("users", filters={"id": user_id})
        updated_user = updated_users[0] if updated_users else {}
        return {"success": True, "user": updated_user}

    except HTTPException:
        raise
    except Exception as e:
        # Log full traceback for diagnostics but return a friendly message to client
        import traceback
        tb = traceback.format_exc()
        print(f"[ADMIN]  Update user error: {e}")
        print(tb)
        # Store last error for dev diagnostics
        try:
            global last_admin_error
            last_admin_error = {"error": str(e), "traceback": tb}
        except Exception:
            pass

        # If this looks like a Supabase service-role auth failure, return a clear 502 with guidance
        msg = str(e)
        if 'Invalid SUPABASE_SERVICE_ROLE_KEY' in msg or 'Invalid API key' in msg:
            raise HTTPException(status_code=502, detail={
                "message": "Database write blocked: Supabase service-role key appears invalid.\nEnsure SUPABASE_SERVICE_ROLE_KEY in python_api/.env matches your project's service role key and the SUPABASE_URL is correct.",
                "hint": "Use /api/admin/check-supabase to test the key."
            })

        # Generic failure
        raise HTTPException(status_code=500, detail={"message": f"Failed to update user: {str(e)}"})

@router.post("/users/{user_id}/reject")
async def reject_user(user_id: str, data: dict, _=Depends(require_api_key)):
    try:
        print(f"[ADMIN]  Rejecting user: {user_id}")
        
        reason = data.get("reason", "Application did not meet requirements")
        
        # Get user details first
        user_details = await db.select("users", filters={"id": user_id})
        if not user_details or not user_details[0]:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_details[0]
        user_email = user.get("email")
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        
        # Update user status
        await db.update("users", {
            "verification_status": "rejected",
            "status": "inactive",
            "updated_at": dt.datetime.utcnow().isoformat()
        }, {"id": user_id})
        
        # Update user approval record
        await db.update("user_approvals", {
            "status": "rejected",
            "rejected_at": dt.datetime.utcnow().isoformat(),
            "rejection_reason": reason
        }, {"user_id": user_id})
        
        # Send rejection email to user
        if user_email:
            try:
                subject = "Account Application Rejected - Home & Own"
                html_content = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #162e5a;">Account Application Rejected</h2>
                    <p>Dear {user_name},</p>
                    <p>We regret to inform you that your account application has been rejected.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                        <strong>Reason for rejection:</strong><br>
                        {reason}
                    </div>
                    <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team.</p>
                    <p>Best regards,<br>Home & Own Team</p>
                </div>
                """
                await send_email(user_email, subject, html_content)
                print(f"[ADMIN]  Sent rejection email to user: {user_email}")
            except Exception as email_error:
                print(f"[ADMIN]  Failed to send rejection email to user: {email_error}")
        
        # Send notification to agents if this was an agent application
        if user.get("user_type") == "agent":
            try:
                # Get all agents to notify them
                agents = await db.select("users", filters={"user_type": "agent", "status": "active"})
                for agent in agents:
                    if agent.get("email") and agent["email"] != user_email:
                        agent_email = agent["email"]
                        agent_name = f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip()
                        
                        subject = "New Agent Application Rejected - Home & Own"
                        html_content = f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #162e5a;">Agent Application Rejected</h2>
                            <p>Dear {agent_name},</p>
                            <p>This is to inform you that an agent application has been rejected.</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                                <strong>Applicant:</strong> {user_name}<br>
                                <strong>Email:</strong> {user_email}<br>
                                <strong>Reason for rejection:</strong><br>
                                {reason}
                            </div>
                            <p>Best regards,<br>Home & Own Admin Team</p>
                        </div>
                        """
                        await send_email(agent_email, subject, html_content)
                        print(f"[ADMIN]  Sent rejection notification to agent: {agent_email}")
            except Exception as agent_email_error:
                print(f"[ADMIN]  Failed to send rejection notification to agents: {agent_email_error}")
        
        print(f"[ADMIN]  User rejected successfully")
        return {"success": True, "message": "User rejected successfully"}
        
    except Exception as e:
        print(f"[ADMIN]  Reject user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject user: {str(e)}")


@router.get("/last-error")
async def get_last_admin_error(_=Depends(require_api_key)):
    """Dev-only: return the last admin handler error, if any."""
    global last_admin_error
    if not last_admin_error:
        raise HTTPException(status_code=404, detail="No recent admin errors captured")
    return {"success": True, "last_error": last_admin_error}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, hard: bool = True, _=Depends(require_api_key)):
    """Delete a user (admin). By default performs a hard delete (permanently removes from DB).
    Set ?hard=false for soft-delete (status='deleted') instead.
    For agents, also cleans up associated properties, bookings, and inquiries.
    """
    try:
        print(f"[ADMIN]  Deleting user {user_id} (hard={hard})")

        # Get user details before deletion
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="User not found")

        user = users[0]
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('email', 'User')
        is_agent = user.get("user_type") == "agent"

        if is_agent:
            print(f"[ADMIN]  Agent deletion detected - cleaning up associated records")

            # 1. Remove agent assignment from all properties
            try:
                await db.update("properties", {"agent_id": None}, {"agent_id": user_id})
                print(f"[ADMIN]  Removed agent assignment from properties")
            except Exception as prop_error:
                print(f"[ADMIN]  Error removing agent from properties: {prop_error}")

            # 2. Handle agent's bookings and inquiries
            try:
                # Update bookings to remove agent assignment
                await db.update("bookings", {"agent_id": None}, {"agent_id": user_id})
                print(f"[ADMIN]  Removed agent assignment from bookings")

                # Update inquiries to remove agent assignment
                await db.update("inquiries", {"agent_id": None}, {"agent_id": user_id})
                print(f"[ADMIN]  Removed agent assignment from inquiries")
            except Exception as records_error:
                print(f"[ADMIN]  Error updating agent records: {records_error}")

        if hard:
            # Hard delete
            try:
                deleted = await db.delete('users', {'id': user_id})
                print(f"[ADMIN]  Hard deleted user {user_id}")
                return {"success": True, "message": f"User '{user_name}' deleted successfully"}
            except Exception as del_error:
                print(f"[ADMIN]  Hard delete failed, falling back to soft delete: {del_error}")
                # Fall back to soft delete if hard delete fails
                await db.update('users', {'status': 'deleted', 'updated_at': dt.datetime.utcnow().isoformat()}, {'id': user_id})
                print(f"[ADMIN]  Soft-deleted user {user_id} (hard delete unavailable)")
                return {"success": True, "message": f"User '{user_name}' deleted successfully"}

        # Soft delete: mark as deleted/inactive
        await db.update('users', {'status': 'deleted', 'updated_at': dt.datetime.utcnow().isoformat()}, {'id': user_id})
        print(f"[ADMIN]  Soft-deleted user {user_id}")
        return {"success": True, "message": f"User '{user_name}' marked as deleted"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  Delete user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.get("/agent/bookings")
async def list_agent_bookings(request: Request, _=Depends(require_api_key)):
    try:
        # Get agent ID from request headers or query params
        agent_id = request.headers.get('X-Agent-ID') or request.query_params.get('agent_id')
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Fetching bookings for agent: {agent_id}")

        # Verify agent exists and is not deleted
        agents = await db.select("users", filters={"id": agent_id, "user_type": "agent"})
        if not agents or agents[0].get("status") == "deleted":
            raise HTTPException(status_code=404, detail="Agent not found or deleted")

        # Get properties managed by this agent
        agent_properties = await db.admin_select("properties", filters={"agent_id": agent_id})
        property_ids = [p.get("id") for p in (agent_properties or []) if p.get("id")]

        if not property_ids:
            return []

        # Get bookings for agent's properties
        all_bookings = await db.admin_select("bookings")
        agent_bookings = [b for b in (all_bookings or []) if b.get("property_id") in property_ids]

        # Enhance bookings with property and customer names
        enhanced_bookings = []
        for booking in agent_bookings:
            enhanced_booking = dict(booking)  # Copy the booking
            
            # Add property name
            try:
                prop_details = next((p for p in agent_properties if p.get("id") == booking.get("property_id")), None)
                if prop_details:
                    enhanced_booking["property_name"] = prop_details.get("title", f"Property #{booking.get('property_id')}")
                else:
                    enhanced_booking["property_name"] = f"Property #{booking.get('property_id')}"
            except:
                enhanced_booking["property_name"] = f"Property #{booking.get('property_id')}"
            
            # Add customer name (already included as 'name' field)
            enhanced_booking["customer_name"] = booking.get("name", "Unknown")
            
            enhanced_bookings.append(enhanced_booking)

        print(f"[ADMIN]  Found {len(enhanced_bookings)} bookings for agent {agent_id}")
        return enhanced_bookings
    except Exception as e:
        print(f"[ADMIN]  List agent bookings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent bookings: {str(e)}")

@router.get("/agent/inquiries")
async def list_agent_inquiries(request: Request, _=Depends(require_api_key)):
    try:
        # Get agent ID from request headers or query params
        agent_id = request.headers.get('X-Agent-ID') or request.query_params.get('agent_id')
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Fetching inquiries for agent: {agent_id}")

        # Verify agent exists and is not deleted
        agents = await db.select("users", filters={"id": agent_id, "user_type": "agent"})
        if not agents or agents[0].get("status") == "deleted":
            raise HTTPException(status_code=404, detail="Agent not found or deleted")

        # Get properties managed by this agent
        agent_properties = await db.admin_select("properties", filters={"agent_id": agent_id})
        property_ids = [p.get("id") for p in (agent_properties or []) if p.get("id")]

        if not property_ids:
            return []

        # Get inquiries for agent's properties
        all_inquiries = await db.admin_select("inquiries")
        agent_inquiries = [i for i in (all_inquiries or []) if i.get("property_id") in property_ids]

        # Enhance inquiries with property and customer names
        enhanced_inquiries = []
        for inquiry in agent_inquiries:
            enhanced_inquiry = dict(inquiry)  # Copy the inquiry
            
            # Add property name
            try:
                prop_details = next((p for p in agent_properties if p.get("id") == inquiry.get("property_id")), None)
                if prop_details:
                    enhanced_inquiry["property_name"] = prop_details.get("title", f"Property #{inquiry.get('property_id')}")
                else:
                    enhanced_inquiry["property_name"] = f"Property #{inquiry.get('property_id')}"
            except:
                enhanced_inquiry["property_name"] = f"Property #{inquiry.get('property_id')}"
            
            # Add customer name (already included as 'name' field)
            enhanced_inquiry["customer_name"] = inquiry.get("name", "Unknown")
            
            enhanced_inquiries.append(enhanced_inquiry)

        print(f"[ADMIN]  Found {len(enhanced_inquiries)} inquiries for agent {agent_id}")
        return enhanced_inquiries
    except Exception as e:
        print(f"[ADMIN]  List agent inquiries error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent inquiries: {str(e)}")

@router.get("/check-supabase")
async def check_supabase(_=Depends(require_api_key)):
    """Dev-only: quick diagnostic to verify admin_client and/or SUPABASE_SERVICE_ROLE_KEY validity.

    This will attempt a lightweight REST probe against the `users` table using the
    SUPABASE_SERVICE_ROLE_KEY and return the status. Do NOT include secrets in logs.
    """
    try:
        admin_available = bool(getattr(db, 'admin_client', None))
        supabase_url = os.getenv('SUPABASE_URL', '').rstrip('/')
        service_role = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip()

        probe = None
        if not supabase_url:
            raise HTTPException(status_code=500, detail="SUPABASE_URL not set in environment")

        if service_role:
            try:
                import requests
                url = f"{supabase_url}/rest/v1/users?select=id&limit=1"
                headers = {
                    'apikey': service_role,
                    'Authorization': f'Bearer {service_role}'
                }
                resp = requests.get(url, headers=headers, timeout=8)
                # Only include limited response info to avoid leaking data
                probe = {"status_code": resp.status_code, "ok": resp.ok, "text_preview": (resp.text or '')[:600]}
            except Exception as e:
                probe = {"error": str(e)}
        else:
            probe = {"error": "SUPABASE_SERVICE_ROLE_KEY not set"}

        return {
            "success": True,
            "admin_client_initialized": admin_available,
            "supabase_url_set": bool(supabase_url),
            "service_role_present": bool(service_role),
            "probe": probe
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  check_supabase error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to run Supabase check: {str(e)}")


@router.post("/users/assign-custom-ids")
async def assign_custom_ids_to_existing_users(_=Depends(require_api_key)):
    """Assign custom IDs to existing users who don't have them."""
    try:
        print("[ADMIN]  Assigning custom IDs to existing users")
        
        # Get all users
        all_users = await db.admin_select("users")
        if not all_users:
            return {"success": True, "message": "No users found"}
        
        updated_count = 0
        for user in all_users:
            user_id = user.get("id")
            custom_id = user.get("custom_id")
            user_type = user.get("user_type", "buyer")
            
            if not custom_id:
                try:
                    # Generate custom ID
                    new_custom_id = await generate_custom_id(user_type)
                    
                    # Update user
                    await db.update("users", {"custom_id": new_custom_id}, {"id": user_id})
                    updated_count += 1
                    print(f"[ADMIN]  Assigned custom ID {new_custom_id} to user {user_id}")
                except Exception as update_error:
                    print(f"[ADMIN]  Failed to assign custom ID to user {user_id}: {update_error}")
        
        return {
            "success": True, 
            "message": f"Assigned custom IDs to {updated_count} users",
            "updated_count": updated_count
        }
        
    except Exception as e:
        print(f"[ADMIN]  Assign custom IDs error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign custom IDs: {str(e)}")


@router.get("/user-roles")
async def list_user_roles(user_id: str | None = None, _=Depends(require_api_key)):
    """Get user roles with optional filtering"""
    try:
        print(f"[ADMIN] Fetching user roles (user_id={user_id})")
        
        filters = {}
        if user_id:
            filters["user_id"] = user_id
        
        roles = await db.admin_select("user_roles", filters=filters)
        
        # Enrich with user details
        if roles:
            user_ids = list(set(r.get("user_id") for r in roles if r.get("user_id")))
            users = await db.admin_select("users", filters={"id": {"in": user_ids}} if len(user_ids) > 1 else {"id": user_ids[0]} if user_ids else {})
            users_by_id = {u.get("id"): u for u in (users or [])}
            
            for role in roles:
                user_id = role.get("user_id")
                if user_id and users_by_id.get(user_id):
                    role["user"] = users_by_id[user_id]
        
        return roles or []
        
    except Exception as e:
        print(f"[ADMIN] List user roles error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user roles: {str(e)}")


@router.post("/user-roles/{user_id}/approve")
async def approve_user_role(user_id: str, request: Request, _=Depends(require_api_key)):
    """Approve a user's role request"""
    try:
        data = await request.json()
        role = data.get("role", "").lower()
        
        if not role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        print(f"[ADMIN] Approving role '{role}' for user {user_id}")
        
        try:
            from ..services.user_role_service import UserRoleService
            success = await UserRoleService.verify_role(user_id, role)
            
            if success:
                # Create notification
                await create_notification(
                    user_id=user_id,
                    title="Role Approved",
                    message=f"Your {role} role has been approved and is now active!",
                    type="approval",
                    entity_type="user_role",
                    entity_id=f"{user_id}_{role}"
                )
                
                return {"success": True, "message": f"Role '{role}' approved successfully"}
            else:
                return {"success": False, "error": "Failed to approve role"}
                
        except Exception as role_error:
            print(f"[ADMIN] Role approval error: {role_error}")
            return {"success": False, "error": f"Failed to approve role: {str(role_error)}"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Approve user role error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve role: {str(e)}")


@router.post("/user-roles/{user_id}/reject")
async def reject_user_role(user_id: str, request: Request, _=Depends(require_api_key)):
    """Reject a user's role request"""
    try:
        data = await request.json()
        role = data.get("role", "").lower()
        reason = data.get("reason", "Role request does not meet requirements")
        
        if not role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        print(f"[ADMIN] Rejecting role '{role}' for user {user_id}")
        
        try:
            from ..services.user_role_service import UserRoleService
            success = await UserRoleService.delete_role(user_id, role)
            
            if success:
                # Create notification
                await create_notification(
                    user_id=user_id,
                    title="Role Request Rejected",
                    message=f"Your {role} role request was rejected. Reason: {reason}",
                    type="rejection",
                    entity_type="user_role",
                    entity_id=f"{user_id}_{role}"
                )
                
                return {"success": True, "message": f"Role '{role}' rejected successfully"}
            else:
                return {"success": False, "error": "Failed to reject role"}
                
        except Exception as role_error:
            print(f"[ADMIN] Role rejection error: {role_error}")
            return {"success": False, "error": f"Failed to reject role: {str(role_error)}"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Reject user role error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject role: {str(e)}")


@router.get("/agent-assignments")
async def get_agent_assignments(_=Depends(require_api_key)):
    """Get all agent assignments for inquiries and properties."""
    try:
        print("[ADMIN]  Getting agent assignments")

        # Get inquiry assignments
        inquiry_assignments = await db.admin_select("agent_assignments", filters={"assignment_type": "inquiry"})
        inquiry_assignments_data = []

        if inquiry_assignments:
            for assignment in inquiry_assignments:
                # Get inquiry details
                inquiry = await db.admin_select("inquiries", filters={"id": assignment.get("inquiry_id")})
                if inquiry and len(inquiry) > 0:
                    inquiry_data = inquiry[0]
                    # Get property details for the inquiry
                    property_details = None
                    if inquiry_data.get("property_id"):
                        property_info = await db.admin_select("properties", filters={"id": inquiry_data.get("property_id")})
                        if property_info and len(property_info) > 0:
                            property_details = property_info[0]

                    # Get agent details
                    agent_details = None
                    if assignment.get("agent_id"):
                        agent_info = await db.admin_select("users", filters={"id": assignment.get("agent_id")})
                        if agent_info and len(agent_info) > 0:
                            agent_details = agent_info[0]

                    inquiry_assignments_data.append({
                        "id": assignment.get("id"),
                        "inquiry_id": assignment.get("inquiry_id"),
                        "agent_id": assignment.get("agent_id"),
                        "status": assignment.get("status", "active"),
                        "assigned_at": assignment.get("assigned_at"),
                        "notes": assignment.get("notes"),
                        "inquiry": inquiry_data,
                        "property": property_details,
                        "agent": agent_details
                    })

        # Get property assignments
        property_assignments = await db.admin_select("agent_assignments", filters={"assignment_type": "property"})
        property_assignments_data = []

        if property_assignments:
            for assignment in property_assignments:
                # Get property details
                property_info = await db.admin_select("properties", filters={"id": assignment.get("property_id")})
                property_data = property_info[0] if property_info and len(property_info) > 0 else None

                # Get agent details
                agent_details = None
                if assignment.get("agent_id"):
                    agent_info = await db.admin_select("users", filters={"id": assignment.get("agent_id")})
                    if agent_info and len(agent_info) > 0:
                        agent_details = agent_info[0]

                property_assignments_data.append({
                    "id": assignment.get("id"),
                    "property_id": assignment.get("property_id"),
                    "agent_id": assignment.get("agent_id"),
                    "status": assignment.get("status", "active"),
                    "assigned_at": assignment.get("assigned_at"),
                    "notes": assignment.get("notes"),
                    "property": property_data,
                    "agent": agent_details
                })

        return {
            "success": True,
            "inquiry_assignments": inquiry_assignments_data,
            "property_assignments": property_assignments_data
        }

    except Exception as e:
        print(f"[ADMIN]  Get agent assignments error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent assignments: {str(e)}")


@router.post("/inquiries/{inquiry_id}/assign-agent")
async def assign_inquiry_to_agent(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Assign an inquiry to an agent."""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        notes = data.get("notes", "")

        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Assigning inquiry {inquiry_id} to agent {agent_id}")

        # Check if inquiry exists
        inquiry = await db.admin_select("inquiries", filters={"id": inquiry_id})
        if not inquiry or len(inquiry) == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")

        # Check if agent exists and is an agent
        agent = await db.admin_select("users", filters={"id": agent_id, "user_type": "agent"})
        if not agent or len(agent) == 0:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Check if assignment already exists
        existing_assignment = await db.admin_select("agent_assignments",
            filters={"inquiry_id": inquiry_id, "assignment_type": "inquiry"})
        if existing_assignment and len(existing_assignment) > 0:
            raise HTTPException(status_code=400, detail="Inquiry already assigned to an agent")

        # Create assignment
        assignment_data = {
            "inquiry_id": inquiry_id,
            "agent_id": agent_id,
            "assignment_type": "inquiry",
            "status": "active",
            "assigned_at": dt.datetime.now().isoformat(),
            "notes": notes
        }

        result = await db.insert("agent_assignments", assignment_data)

        # Update inquiry with assigned agent
        await db.update("inquiries", {"assigned_agent_id": agent_id}, {"id": inquiry_id})

        # Create notification for agent
        notification_data = {
            "user_id": agent_id,
            "type": "assignment",
            "title": "New Inquiry Assigned",
            "message": f"You have been assigned a new inquiry from {inquiry[0].get('name')}",
            "data": {"inquiry_id": inquiry_id, "assignment_type": "inquiry"},
            "is_read": False,
            "created_at": dt.datetime.now().isoformat()
        }
        await db.insert("notifications", notification_data)

        return {
            "success": True,
            "message": "Inquiry assigned to agent successfully",
            "assignment": result
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  Assign inquiry to agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign inquiry: {str(e)}")


@router.post("/properties/{property_id}/assign-agent")
async def assign_property_to_agent(property_id: str, request: Request, _=Depends(require_api_key)):
    """Assign a property to an agent."""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        notes = data.get("notes", "")

        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")

        print(f"[ADMIN]  Assigning property {property_id} to agent {agent_id}")

        # Check if property exists
        property_info = await db.admin_select("properties", filters={"id": property_id})
        if not property_info or len(property_info) == 0:
            raise HTTPException(status_code=404, detail="Property not found")

        # Check if agent exists and is an agent
        agent = await db.admin_select("users", filters={"id": agent_id, "user_type": "agent"})
        if not agent or len(agent) == 0:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Check if assignment already exists
        existing_assignment = await db.admin_select("agent_assignments",
            filters={"property_id": property_id, "assignment_type": "property"})
        if existing_assignment and len(existing_assignment) > 0:
            raise HTTPException(status_code=400, detail="Property already assigned to an agent")

        # Create assignment
        assignment_data = {
            "property_id": property_id,
            "agent_id": agent_id,
            "assignment_type": "property",
            "status": "active",
            "assigned_at": dt.datetime.now().isoformat(),
            "notes": notes
        }

        result = await db.insert("agent_assignments", assignment_data)

        # Update property with assigned agent
        await db.update("properties", {"assigned_agent_id": agent_id}, {"id": property_id})

        # Create notification for agent
        notification_data = {
            "user_id": agent_id,
            "type": "assignment",
            "title": "New Property Assigned",
            "message": f"You have been assigned a new property: {property_info[0].get('title')}",
            "data": {"property_id": property_id, "assignment_type": "property"},
            "is_read": False,
            "created_at": dt.datetime.now().isoformat()
        }
        await db.insert("notifications", notification_data)

        return {
            "success": True,
            "message": "Property assigned to agent successfully",
            "assignment": result
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  Assign property to agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign property: {str(e)}")


# ===== DELETE OPERATIONS =====

@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, _=Depends(require_api_key)):
    """Delete a booking"""
    try:
        print(f"[ADMIN]  Deleting booking: {booking_id}")
        
        # Check if booking exists
        booking = await db.admin_select("bookings", filters={"id": booking_id})
        if not booking or len(booking) == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Delete booking
        await db.delete("bookings", {"id": booking_id})
        
        return {
            "success": True,
            "message": "Booking deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  Delete booking error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete booking: {str(e)}")


@router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, _=Depends(require_api_key)):
    """Delete an inquiry"""
    try:
        print(f"[ADMIN]  Deleting inquiry: {inquiry_id}")
        
        # Check if inquiry exists
        inquiry = await db.admin_select("inquiries", filters={"id": inquiry_id})
        if not inquiry or len(inquiry) == 0:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        # Delete inquiry
        await db.delete("inquiries", {"id": inquiry_id})
        
        return {
            "success": True,
            "message": "Inquiry deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN]  Delete inquiry error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete inquiry: {str(e)}")


# Cities and States Management
@router.get("/cities")
async def list_cities(_=Depends(require_api_key)):
    """Get all cities"""
    try:
        print("[ADMIN] Fetching cities")
        cities = await db.admin_select("cities")
        return cities or []
    except Exception as e:
        print(f"[ADMIN] List cities error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cities: {str(e)}")


@router.post("/cities")
async def create_city(city_data: dict, _=Depends(require_api_key)):
    """Create a new city"""
    try:
        print(f"[ADMIN] Creating city: {city_data}")
        city_id = await db.insert("cities", city_data)
        return {"id": city_id, **city_data}
    except Exception as e:
        print(f"[ADMIN] Create city error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create city: {str(e)}")


@router.patch("/cities/{city_id}")
async def update_city(city_id: str, city_data: dict, _=Depends(require_api_key)):
    """Update a city"""
    try:
        print(f"[ADMIN] Updating city {city_id}: {city_data}")
        await db.update("cities", city_data, {"id": city_id})
        return {"id": city_id, **city_data}
    except Exception as e:
        print(f"[ADMIN] Update city error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update city: {str(e)}")


@router.delete("/cities/{city_id}")
async def delete_city(city_id: str, _=Depends(require_api_key)):
    """Delete a city"""
    try:
        print(f"[ADMIN] Deleting city {city_id}")
        await db.delete("cities", {"id": city_id})
        return {"message": "City deleted successfully"}
    except Exception as e:
        print(f"[ADMIN] Delete city error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete city: {str(e)}")


@router.get("/states")
async def list_states(_=Depends(require_api_key)):
    """Get all states"""
    try:
        print("[ADMIN] Fetching states")
        states = await db.admin_select("states")
        return states or []
    except Exception as e:
        print(f"[ADMIN] List states error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch states: {str(e)}")


@router.post("/states")
async def create_state(state_data: dict, _=Depends(require_api_key)):
    """Create a new state"""
    try:
        print(f"[ADMIN] Creating state: {state_data}")
        state_id = await db.insert("states", state_data)
        return {"id": state_id, **state_data}
    except Exception as e:
        print(f"[ADMIN] Create state error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create state: {str(e)}")


@router.patch("/states/{state_id}")
async def update_state(state_id: str, state_data: dict, _=Depends(require_api_key)):
    """Update a state"""
    try:
        print(f"[ADMIN] Updating state {state_id}: {state_data}")
        await db.update("states", state_data, {"id": state_id})
        return {"id": state_id, **state_data}
    except Exception as e:
        print(f"[ADMIN] Update state error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update state: {str(e)}")


@router.delete("/states/{state_id}")
async def delete_state(state_id: str, _=Depends(require_api_key)):
    """Delete a state"""
    try:
        print(f"[ADMIN] Deleting state {state_id}")
        await db.delete("states", {"id": state_id})
        return {"message": "State deleted successfully"}
    except Exception as e:
        print(f"[ADMIN] Delete state error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete state: {str(e)}")


# Property Assignment Management
@router.post("/properties/{property_id}/accept")
async def accept_property_assignment(property_id: str, request: Request, _=Depends(require_api_key)):
    """Agent accepts property assignment"""
    try:
        # Get agent ID from request body or headers
        data = await request.json()
        agent_id = data.get("agent_id")
        
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")
        
        print(f"[ADMIN] Agent {agent_id} accepting property {property_id}")
        
        from ..services.agent_assignment import AgentAssignmentService
        result = await AgentAssignmentService.accept_property_assignment(property_id, agent_id)
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Accept property assignment error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to accept property assignment: {str(e)}")


@router.post("/properties/{property_id}/reject")
async def reject_property_assignment(property_id: str, request: Request, _=Depends(require_api_key)):
    """Agent rejects property assignment"""
    try:
        # Get agent ID and reason from request body
        data = await request.json()
        agent_id = data.get("agent_id")
        reason = data.get("reason", "")
        
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")
        
        print(f"[ADMIN] Agent {agent_id} rejecting property {property_id}")
        
        from ..services.agent_assignment import AgentAssignmentService
        result = await AgentAssignmentService.reject_property_assignment(property_id, agent_id, reason)
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Reject property assignment error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject property assignment: {str(e)}")


@router.get("/properties/pool")
async def get_property_pool(_=Depends(require_api_key)):
    """Get properties in the pool"""
    try:
        print("[ADMIN] Fetching properties in pool")
        properties = await db.admin_select("properties", filters={"in_pool": True})
        return properties or []
    except Exception as e:
        print(f"[ADMIN] Get property pool error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch property pool: {str(e)}")


@router.post("/emails/send")
async def send_admin_email(request: Request, _=Depends(require_api_key)):
    """Send email from admin panel"""
    try:
        data = await request.json()
        to = data.get("to")
        subject = data.get("subject")
        html = data.get("html")
        
        if not all([to, subject, html]):
            raise HTTPException(status_code=400, detail="Missing required fields: to, subject, html")
        
        print(f"[ADMIN] Sending email to: {to}")
        print(f"[ADMIN] Subject: {subject}")
        
        from ..services.email import send_email
        result = await send_email(to, subject, html)
        
        print(f"[ADMIN] Email sent successfully: {result}")
        return {"success": True, "message": "Email sent successfully", "result": result}
        
    except Exception as e:
        print(f"[ADMIN] Send email error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/properties/{property_id}/assign-from-pool")
async def assign_property_from_pool(property_id: str, request: Request, _=Depends(require_api_key)):
    """Manually assign property from pool to agent"""
    try:
        data = await request.json()
        agent_id = data.get("agent_id")
        
        if not agent_id:
            raise HTTPException(status_code=400, detail="Agent ID is required")
        
        print(f"[ADMIN] Assigning property {property_id} from pool to agent {agent_id}")
        
        # Verify property is in pool
        properties = await db.select("properties", filters={"id": property_id, "in_pool": True})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found in pool")
        
        # Verify agent exists
        agents = await db.select("users", filters={"id": agent_id, "user_type": "agent", "status": "active"})
        if not agents:
            raise HTTPException(status_code=404, detail="Agent not found or inactive")
        
        # Assign property to agent
        await db.update("properties", {
            "agent_id": agent_id,
            "in_pool": False,
            "status": "active",
            "assigned_from_pool": True,
            "pool_assignment_date": dt.datetime.utcnow().isoformat()
        }, {"id": property_id})
        
        agent_name = f"{agents[0]['first_name']} {agents[0]['last_name']}"
        return {
            "success": True,
            "message": f"Property assigned to {agent_name} from pool",
            "agent_id": agent_id,
            "agent_name": agent_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ADMIN] Assign from pool error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign property from pool: {str(e)}")
