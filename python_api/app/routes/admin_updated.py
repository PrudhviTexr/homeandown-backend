from fastapi import APIRouter, HTTPException, Depends, Request
from ..core.security import require_api_key
from ..db.supabase_client import db
from ..models.schemas import (
    CreateUserRequest, 
    UpdateUserRequest,
    CreatePropertyRequest,
    UpdatePropertyRequest,
    AssignAgentRequest,
    Booking,
    Inquiry
)
import uuid
import datetime as dt

router = APIRouter()

@router.get("/stats")
async def get_stats(_=Depends(require_api_key)):
    """Get dashboard statistics"""
    try:
        print("[ADMIN] Fetching dashboard stats")
        
        # In a real application, you'd perform database queries here
        # For now, returning sample data
        stats = {
            "total_users": 150,
            "total_properties": 75,
            "total_bookings": 200,
            "total_inquiries": 350,
            "pending_approvals": 12,
            "unassigned_properties": 5
        }
        
        print(f"[ADMIN] Stats fetched: {stats}")
        return stats
    except Exception as e:
        print(f"[ADMIN] Get stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.get("/users")
async def list_users(_=Depends(require_api_key)):
    """List all users"""
    try:
        print("[ADMIN] Fetching all users")
        users = await db.admin_select("users")
        print(f"[ADMIN] Found {len(users) if users else 0} users")
        return users or []
    except Exception as e:
        print(f"[ADMIN] List users error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.post("/users")
async def create_user(payload: CreateUserRequest, _=Depends(require_api_key)):
    """Create a new user"""
    try:
        print(f"[ADMIN] Creating user: {payload.email}")
        
        # In a real app, you would hash the password
        # This is a simplified example
        user_data = {
            "id": str(uuid.uuid4()),
            "email": payload.email,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "user_type": payload.user_type,
            "created_at": dt.datetime.utcnow().isoformat()
        }
        
        new_user = await db.admin_insert("users", user_data)
        print(f"[ADMIN] User created: {new_user}")
        return new_user
    except Exception as e:
        print(f"[ADMIN] Create user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: UpdateUserRequest, _=Depends(require_api_key)):
    """Update a user's details"""
    try:
        print(f"[ADMIN] Updating user: {user_id}")
        
        update_data = payload.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            updated_user = await db.admin_update("users", update_data, {"id": user_id})
            print(f"[ADMIN] User updated: {updated_user}")
            return updated_user
        
        return {"message": "No changes to update"}
    except Exception as e:
        print(f"[ADMIN] Update user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _=Depends(require_api_key)):
    """Delete a user"""
    try:
        print(f"[ADMIN] Deleting user: {user_id}")
        await db.admin_delete("users", {"id": user_id})
        print(f"[ADMIN] User deleted")
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        print(f"[ADMIN] Delete user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/properties")
async def list_properties(_=Depends(require_api_key)):
    try:
        print("[ADMIN] Fetching all properties")
        properties = await db.admin_select("properties")
        users = await db.admin_select("users")
        
        # Build user map with full names (not IDs)
        user_map = {user['id']: f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() for user in users}
        
        if properties:
            for prop in properties:
                # Get owner name - check owner_id first, then added_by (who created it)
                owner_id = prop.get('owner_id') or prop.get('added_by')
                owner_name = user_map.get(owner_id, 'N/A')
                # Remove empty strings and set to N/A if no name found
                prop['owner_name'] = owner_name if owner_name and owner_name.strip() else 'N/A'
                
                # Get agent name - check assigned_agent_id first, then agent_id
                agent_id = prop.get('assigned_agent_id') or prop.get('agent_id')
                agent_name = user_map.get(agent_id, 'Unassigned')
                # Remove empty strings and set to Unassigned if no name found
                prop['agent_name'] = agent_name if agent_name and agent_name.strip() else 'Unassigned'
            
        print(f"[ADMIN] Returning {len(properties) if properties else 0} properties with owner/agent names")
        return properties or []
    except Exception as e:
        print(f"[ADMIN] List properties error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch properties: {str(e)}")

@router.post("/properties")
async def create_property(payload: CreatePropertyRequest, _=Depends(require_api_key)):
    """Create a new property"""
    try:
        print(f"[ADMIN] Creating property: {payload.title}")
        
        property_data = payload.dict()
        property_data["id"] = str(uuid.uuid4())
        property_data["created_at"] = dt.datetime.utcnow().isoformat()
        
        # Ensure properties created via admin also require approval
        property_data.setdefault("status", "pending")
        property_data.setdefault("verified", False)
        property_data.setdefault("featured", False)
        
        new_property = await db.admin_insert("properties", property_data)
        print(f"[ADMIN] Property created: {new_property}")
        return new_property
    except Exception as e:
        print(f"[ADMIN] Create property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create property: {str(e)}")

@router.patch("/properties/{property_id}")
async def update_property(property_id: str, payload: UpdatePropertyRequest, _=Depends(require_api_key)):
    """Update a property's details"""
    try:
        print(f"[ADMIN] Updating property: {property_id}")
        
        update_data = payload.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            updated_property = await db.admin_update("properties", update_data, {"id": property_id})
            print(f"[ADMIN] Property updated: {updated_property}")
            return updated_property
            
        return {"message": "No changes to update"}
    except Exception as e:
        print(f"[ADMIN] Update property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update property: {str(e)}")

@router.delete("/properties/{property_id}")
async def delete_property(property_id: str, _=Depends(require_api_key)):
    """Delete a property"""
    try:
        print(f"[ADMIN] Deleting property: {property_id}")
        await db.admin_delete("properties", {"id": property_id})
        print(f"[ADMIN] Property deleted")
        return {"success": True, "message": "Property deleted successfully"}
    except Exception as e:
        print(f"[ADMIN] Delete property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete property: {str(e)}")

@router.post("/properties/{property_id}/approve")
async def approve_property(property_id: str, _=Depends(require_api_key)):
    """Approve a property"""
    try:
        print(f"[ADMIN] Approving property: {property_id}")
        
        update_data = {
            "verified": True,
            "status": "verified",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        updated_property = await db.admin_update("properties", update_data, {"id": property_id})
        print(f"[ADMIN] Property approved: {updated_property}")
        return updated_property
    except Exception as e:
        print(f"[ADMIN] Approve property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve property: {str(e)}")

@router.post("/properties/{property_id}/reject")
async def reject_property(property_id: str, request: Request, _=Depends(require_api_key)):
    """Reject a property"""
    try:
        payload = await request.json()
        reason = payload.get("reason", "Rejected by admin")
        
        print(f"[ADMIN] Rejecting property: {property_id} for reason: {reason}")
        
        update_data = {
            "verified": False,
            "status": "rejected",
            "rejection_reason": reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        updated_property = await db.admin_update("properties", update_data, {"id": property_id})
        print(f"[ADMIN] Property rejected: {updated_property}")
        return updated_property
    except Exception as e:
        print(f"[ADMIN] Reject property error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject property: {str(e)}")

@router.post("/properties/{property_id}/assign-agent")
async def assign_agent(property_id: str, payload: AssignAgentRequest, _=Depends(require_api_key)):
    """Assign an agent to a property"""
    try:
        agent_id = payload.agent_id
        print(f"[ADMIN] Assigning agent {agent_id} to property {property_id}")
        
        update_data = {
            "agent_id": agent_id,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        updated_property = await db.admin_update("properties", update_data, {"id": property_id})
        print(f"[ADMIN] Agent assigned: {updated_property}")
        return updated_property
    except Exception as e:
        print(f"[ADMIN] Assign agent error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assign agent: {str(e)}")

@router.get("/bookings")
async def list_bookings(_=Depends(require_api_key)):
    """List all bookings"""
    try:
        print("[ADMIN] Fetching all bookings")
        bookings = await db.admin_select("bookings")
        print(f"[ADMIN] Found {len(bookings) if bookings else 0} bookings")
        return bookings or []
    except Exception as e:
        print(f"[ADMIN] List bookings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.get("/inquiries")
async def list_inquiries(_=Depends(require_api_key)):
    """List all inquiries"""
    try:
        print("[ADMIN] Fetching all inquiries")
        inquiries = await db.admin_select("inquiries")
        print(f"[ADMIN] Found {len(inquiries) if inquiries else 0} inquiries")
        return inquiries or []
    except Exception as e:
        print(f"[ADMIN] List inquiries error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, _=Depends(require_api_key)):
    """Approve a user"""
    try:
        print(f"[ADMIN] Approving user: {user_id}")
        update_data = {
            "verification_status": "verified",
            "status": "active",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        updated_user = await db.admin_update("users", update_data, {"id": user_id})
        print(f"[ADMIN] User approved: {updated_user}")
        return updated_user
    except Exception as e:
        print(f"[ADMIN] Approve user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve user: {str(e)}")

@router.post("/users/{user_id}/reject")
async def reject_user(user_id: str, request: Request, _=Depends(require_api_key)):
    """Reject a user"""
    try:
        payload = await request.json()
        reason = payload.get("reason", "Rejected by admin")
        print(f"[ADMIN] Rejecting user: {user_id} for reason: {reason}")
        
        update_data = {
            "verification_status": "rejected",
            "status": "inactive",
            "rejection_reason": reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        updated_user = await db.admin_update("users", update_data, {"id": user_id})
        print(f"[ADMIN] User rejected: {updated_user}")
        return updated_user
    except Exception as e:
        print(f"[ADMIN] Reject user error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject user: {str(e)}")
