from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional
from ..core.security import require_api_key
from ..db.supabase_client import db
from ..services.email import send_email

from ..models.schemas import (
    SignupRequest,
    UpdateProfileRequest,
    PropertyRequest,
)
import uuid
import datetime as dt

router = APIRouter()

@router.get("/stats")
async def get_stats(_=Depends(require_api_key)):
    try:
        users = await db.admin_select("users", select="count")
        properties = await db.admin_select("properties", select="count")
        bookings = await db.admin_select("bookings", select="count")
        inquiries = await db.admin_select("inquiries", select="count")
        
        stats = {
            "total_users": users[0]['count'] if users else 0,
            "total_properties": properties[0]['count'] if properties else 0,
            "total_bookings": bookings[0]['count'] if bookings else 0,
            "total_inquiries": inquiries[0]['count'] if inquiries else 0,
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def list_users(_=Depends(require_api_key)):
    try:
        return await db.admin_select("users") or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
async def get_user(user_id: str, _=Depends(require_api_key)):
    """Get a single user by ID"""
    try:
        user_data = await db.select("users", filters={"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        return user_data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
async def create_user(payload: SignupRequest, _=Depends(require_api_key)):
    try:
        user_data = {
            "id": str(uuid.uuid4()),
            "email": payload.email,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "user_type": payload.role,
            "created_at": dt.datetime.utcnow().isoformat()
        }
        return await db.insert("users", user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: UpdateProfileRequest, _=Depends(require_api_key)):
    try:
        update_data = payload.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            return await db.update("users", update_data, {"id": user_id})
        return {"message": "No changes to update"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user_put(user_id: str, request: Request, _=Depends(require_api_key)):
    """Update a user - PUT method"""
    try:
        payload = await request.json()
        if payload:
            payload["updated_at"] = dt.datetime.utcnow().isoformat()
            return await db.update("users", payload, {"id": user_id})
        return {"message": "No changes to update"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _=Depends(require_api_key)):
    try:
        await db.delete("users", {"id": user_id})
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/properties")
async def list_properties(_=Depends(require_api_key)):
    try:
        properties = await db.admin_select("properties")
        users = await db.admin_select("users")
        
        # Build user map with full names (not IDs)
        user_map = {}
        for user in users:
            user_id = user.get('id')
            first_name = user.get('first_name', '').strip()
            last_name = user.get('last_name', '').strip()
            full_name = f"{first_name} {last_name}".strip()
            # Only add if we have a valid name
            if user_id and full_name:
                user_map[user_id] = full_name
            elif user_id:
                # Fallback to email if no name
                user_map[user_id] = user.get('email', 'Unknown User')
        
        if properties:
            for prop in properties:
                # Get owner name - check owner_id first, then added_by (who created it)
                owner_id = prop.get('owner_id') or prop.get('added_by')
                if owner_id and owner_id in user_map:
                    owner_name = user_map[owner_id]
                elif owner_id:
                    # If ID exists but not in map, try to fetch or use ID
                    owner_name = f"User {owner_id[:8]}..."
                else:
                    owner_name = 'N/A'
                
                prop['owner_name'] = owner_name
                
                # Get agent name - check assigned_agent_id first, then agent_id
                agent_id = prop.get('assigned_agent_id') or prop.get('agent_id')
                if agent_id and agent_id in user_map:
                    agent_name = user_map[agent_id]
                elif agent_id:
                    # If ID exists but not in map, use ID
                    agent_name = f"Agent {agent_id[:8]}..."
                else:
                    agent_name = 'Unassigned'
                
                prop['agent_name'] = agent_name
                
                # Debug logging for first property
                if properties.index(prop) == 0:
                    print(f"[ADMIN] Property {prop.get('id')[:8]}: owner_id={owner_id}, owner_name={owner_name}, agent_id={agent_id}, agent_name={agent_name}")
        
        print(f"[ADMIN] Returning {len(properties) if properties else 0} properties with owner/agent names")
        return properties or []
    except Exception as e:
        print(f"[ADMIN] Error in list_properties: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/properties")
async def create_property(payload: PropertyRequest, _=Depends(require_api_key)):
    try:
        property_data = payload.dict()
        property_data["id"] = str(uuid.uuid4())
        property_data["created_at"] = dt.datetime.utcnow().isoformat()
        return await db.insert("properties", property_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/properties/{property_id}")
async def update_property(property_id: str, payload: PropertyRequest, _=Depends(require_api_key)):
    try:
        update_data = payload.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = dt.datetime.utcnow().isoformat()
            return await db.update("properties", update_data, {"id": property_id})
        return {"message": "No changes to update"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/properties/{property_id}")
async def delete_property(property_id: str, _=Depends(require_api_key)):
    try:
        await db.delete("properties", {"id": property_id})
        return {"success": True, "message": "Property deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/properties/{property_id}/approve")
async def approve_property(property_id: str, _=Depends(require_api_key)):
    try:
        update_data = {
            "verified": True, 
            "status": "active",  # Changed from "verified" to "active" so property is visible
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("properties", update_data, {"id": property_id})
        
        # Send approval email
        try:
            property_data = await db.select("properties", filters={"id": property_id})
            if property_data:
                prop = property_data[0]
                owner_id = prop.get('owner_id')
                if owner_id:
                    user_data = await db.select("users", filters={"id": owner_id})
                    if user_data:
                        user = user_data[0]
                        subject = f"Your property listing '{prop.get('title')}' has been approved"
                        html_content = f"<p>Hi {user.get('first_name')},</p><p>Congratulations! Your property listing, <strong>{prop.get('title')}</strong>, has been approved and is now live on Home & Own.</p>"
                        await send_email(to=user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send property approval email: {email_error}")

        # Start sequential agent notification queue
        try:
            from ..services.sequential_agent_notification import SequentialAgentNotificationService
            queue_result = await SequentialAgentNotificationService.start_property_assignment_queue(property_id)
            
            if not queue_result.get("success"):
                print(f"[ADMIN] Warning: Failed to start agent notification queue: {queue_result.get('error')}")
                # Don't fail the approval if notification queue fails - property is still approved
        except Exception as notification_error:
            print(f"[ADMIN] !!! Failed to start agent notification queue: {notification_error}")
            # Property is still approved, this is a warning
            import traceback
            print(traceback.format_exc())

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error approving property {property_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/properties/{property_id}/reject")
async def reject_property(property_id: str, request: Request, _=Depends(require_api_key)):
    try:
        payload = await request.json()
        reason = payload.get("reason", "Rejected by admin")
        update_data = {
            "verified": False, "status": "rejected", "rejection_reason": reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("properties", update_data, {"id": property_id})
        
        # Send rejection email
        try:
            property_data = await db.select("properties", filters={"id": property_id})
            if property_data:
                prop = property_data[0]
                owner_id = prop.get('owner_id')
                if owner_id:
                    user_data = await db.select("users", filters={"id": owner_id})
                    if user_data:
                        user = user_data[0]
                        subject = f"An update on your property listing '{prop.get('title')}'"
                        html_content = f"<p>Hi {user.get('first_name')},</p><p>We have reviewed your property listing, <strong>{prop.get('title')}</strong>. We regret to inform you that it has been rejected.</p><p><strong>Reason:</strong> {reason}</p>"
                        await send_email(to=user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send property rejection email: {email_error}")

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error rejecting property {property_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
        
@router.post("/properties/{property_id}/resubmit")
async def resubmit_property(property_id: str, request: Request, _=Depends(require_api_key)):
    try:
        payload = await request.json()
        reason = payload.get("reason", "Resubmission requested")
        update_data = {
            "status": "resubmit",
            "rejection_reason": reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("properties", update_data, {"id": property_id})

        # Send resubmission request email
        try:
            property_data = await db.select("properties", filters={"id": property_id})
            if property_data:
                prop = property_data[0]
                owner_id = prop.get('owner_id')
                if owner_id:
                    user_data = await db.select("users", filters={"id": owner_id})
                    if user_data:
                        user = user_data[0]
                        subject = f"Action required for your property listing '{prop.get('title')}'"
                        html_content = f"<p>Hi {user.get('first_name')},</p><p>Regarding your property listing, <strong>{prop.get('title')}</strong>, we require some changes before it can be approved.</p><p><strong>Reason:</strong> {reason}</p><p>Please log in to your account to edit and resubmit your property for review.</p>"
                        await send_email(to=user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send property resubmission email: {email_error}")

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error setting property to resubmit {property_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/properties/{property_id}/assign-agent")
async def assign_agent(property_id: str, payload: dict, _=Depends(require_api_key)):
    try:
        agent_id = payload.get("agent_id")
        update_data = {"agent_id": agent_id, "updated_at": dt.datetime.utcnow().isoformat()}
        result = await db.update("properties", update_data, {"id": property_id})

        # Send email notification
        try:
            property_data = await db.select("properties", filters={"id": property_id})
            agent_data = await db.select("users", filters={"id": agent_id})
            if property_data and agent_data:
                prop = property_data[0]
                agent = agent_data[0]
                subject = f"You have been assigned to a new property: {prop.get('title')}"
                html_content = f"""
                <p>Hi {agent.get('first_name')},</p>
                <p>You have been assigned as the agent for the property: <strong>{prop.get('title')}</strong>.</p>
                <p>You can view the property details in your dashboard.</p>
                """
                await send_email(to=agent.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send agent assignment email: {email_error}")

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error assigning agent to {property_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/bookings")
async def list_bookings(_=Depends(require_api_key)):
    try:
        bookings = await db.admin_select("bookings") or []
        properties = await db.admin_select("properties") or []
        users = await db.admin_select("users") or []

        user_map = {user['id']: f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() for user in users}
        property_map = {prop['id']: prop for prop in properties}

        for booking in bookings:
            booking['customer_name'] = user_map.get(booking.get('user_id'), 'N/A')
            property_info = property_map.get(booking.get('property_id'))
            if property_info:
                booking['property_title'] = property_info.get('title', 'N/A')
                agent_id = property_info.get('agent_id')
                booking['agent_name'] = user_map.get(agent_id, 'Unassigned') if agent_id else 'Unassigned'
            else:
                booking['property_title'] = 'N/A'
                booking['agent_name'] = 'N/A'
        
        return bookings
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error listing bookings: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/inquiries")
async def list_inquiries(_=Depends(require_api_key)):
    try:
        return await db.admin_select("inquiries") or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/fix-status-mismatch")
async def fix_status_mismatch(_=Depends(require_api_key)):
    """Fix users who have verification_status='verified' but status='pending'"""
    try:
        # Find all users with mismatch
        all_users = await db.admin_select("users")
        fixed_count = 0
        
        for user in all_users:
            verification_status = (user.get('verification_status') or '').lower()
            status = (user.get('status') or '').lower()
            
            # If verified but status is pending, fix it
            if verification_status == 'verified' and status in ['pending', '', None]:
                await db.update("users", {
                    "status": "active",
                    "updated_at": dt.datetime.utcnow().isoformat()
                }, {"id": user['id']})
                fixed_count += 1
                print(f"[ADMIN] Fixed status for user {user.get('id')[:8]}: {user.get('email')}")
        
        return {
            "success": True,
            "message": f"Fixed {fixed_count} users with status mismatch",
            "fixed_count": fixed_count
        }
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error fixing status mismatch: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fix status mismatch: {str(e)}")

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, _=Depends(require_api_key)):
    try:
        # Get user data first to check user type
        user_data = await db.select("users", filters={"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = user_data[0]
        user_type = user.get('user_type', '').lower()
        
        update_data = {
            "verification_status": "verified",
            "status": "active",  # Ensure status is set to 'active' not 'pending'
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        # For agents, ensure license number is set after approval
        if user_type == 'agent':
            # Get or generate license number
            license_number = user.get('agent_license_number') or user.get('license_number')
            if not license_number:
                # Generate license number from custom_id if available
                custom_id = user.get('custom_id')
                if custom_id:
                    license_number = custom_id
                else:
                    # Generate new custom_id for license
                    try:
                        from ..services.admin_service import generate_custom_id
                        license_number = await generate_custom_id('agent')
                    except Exception as gen_error:
                        print(f"[ADMIN] Failed to generate license number: {gen_error}")
                        license_number = f"AGT-{user_id[:8].upper()}"
                
                # Set license number in both possible fields
                update_data['agent_license_number'] = license_number
                update_data['license_number'] = license_number
                print(f"[ADMIN] Set license number for agent {user_id}: {license_number}")
        
        # For buyers and sellers, ensure license number is set to null or 'NA'
        elif user_type in ['buyer', 'seller']:
            # Explicitly set to None or remove if exists
            update_data['agent_license_number'] = None
            update_data['license_number'] = None
            print(f"[ADMIN] Cleared license number for {user_type} {user_id}")
        
        result = await db.update("users", update_data, {"id": user_id})

        # Send approval email
        try:
            updated_user_data = await db.select("users", filters={"id": user_id})
            if updated_user_data:
                updated_user = updated_user_data[0]
                license_number = updated_user.get('agent_license_number') or updated_user.get('license_number')
                subject = "Your Home & Own account has been approved"
                html_content = f"<p>Hi {updated_user.get('first_name')},</p><p>Congratulations! Your {updated_user.get('user_type')} account on Home & Own has been approved.</p>"
                if user_type == 'agent' and license_number:
                    html_content += f"<p><strong>Your License Number:</strong> {license_number}</p>"
                html_content += "<p>You can now log in and access your dashboard.</p>"
                await send_email(to=updated_user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send approval email: {email_error}")

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error approving user {user_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/users/{user_id}/reject")
async def reject_user(user_id: str, request: Request, _=Depends(require_api_key)):
    try:
        payload = await request.json()
        reason = payload.get("reason", "Rejected by admin")
        update_data = {
            "verification_status": "rejected", "status": "inactive", "rejection_reason": reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": user_id})
        
        # Send rejection email
        try:
            user_data = await db.select("users", filters={"id": user_id})
            if user_data:
                user = user_data[0]
                subject = "An update on your Home & Own application"
                html_content = f"<p>Hi {user.get('first_name')},</p><p>Thank you for your application to Home & Own. After careful review, we regret to inform you that your application has been rejected.</p><p><strong>Reason:</strong> {reason}</p>"
                await send_email(to=user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send rejection email: {email_error}")
        
        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error rejecting user {user_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/documents")
async def list_documents(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    _=Depends(require_api_key)
):
    """List documents with optional filtering"""
    try:
        print(f"[ADMIN] Fetching documents with entity_type={entity_type}, entity_id={entity_id}")
        
        # Build filters if provided
        filters = {}
        if entity_id:
            filters['entity_id'] = entity_id
        
        # Handle entity_type: if searching for 'user', also include 'user_documents' for backwards compatibility
        if entity_type:
            if entity_type == 'user':
                # Query for both 'user' and 'user_documents' to catch old uploads
                all_documents = await db.admin_select("documents", filters={'entity_id': entity_id} if entity_id else None) or []
                # Filter to only user-related documents
                documents = [doc for doc in all_documents if doc.get('entity_type') in ['user', 'user_documents']]
            elif entity_type == 'property':
                filters['entity_type'] = entity_type
                documents = await db.admin_select("documents", filters=filters if filters else None) or []
            else:
                filters['entity_type'] = entity_type
                documents = await db.admin_select("documents", filters=filters if filters else None) or []
        else:
            # No entity_type filter, fetch all
            documents = await db.admin_select("documents", filters=filters if filters else None) or []
        
        print(f"[ADMIN] Found {len(documents)} documents")
        return documents
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error fetching documents: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Agent-specific routes
@router.get("/agents/{agent_id}/profile")
async def get_agent_profile(agent_id: str, _=Depends(require_api_key)):
    """Get agent profile with documents and application info"""
    try:
        # Get agent user data
        user_data = await db.select("users", filters={"id": agent_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = user_data[0]
        
        # Get agent documents if any
        documents = await db.select("documents", filters={"user_id": agent_id}) or []
        
        # Get role requests if any
        role_requests = await db.select("role_requests", filters={"user_id": agent_id}) or []
        
        # Get property assignments
        assigned_properties = await db.select("properties", filters={"agent_id": agent_id}) or []
        
        profile = {
            "agent": agent,
            "documents": documents,
            "roleRequests": role_requests,
            "applicationDate": agent.get("created_at"),
            "lastUpdated": agent.get("updated_at") or agent.get("created_at"),
            "status": agent.get("status"),
            "verificationStatus": agent.get("verification_status"),
            "licenseNumber": agent.get("license_number"),
            "customId": agent.get("custom_id"),
            "assignedProperties": len(assigned_properties)
        }
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting agent profile {agent_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/agents/{agent_id}/approve")
async def approve_agent(agent_id: str, request: Request, _=Depends(require_api_key)):
    """Approve an agent and ensure license number is set"""
    try:
        payload = await request.json() if request else {}
        approval_notes = payload.get("approval_notes", "Agent approved by admin")
        
        # Get user data first
        user_data = await db.select("users", filters={"id": agent_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        user = user_data[0]
        
        # Get or generate license number
        license_number = user.get('agent_license_number') or user.get('license_number')
        if not license_number:
            # Generate from custom_id if available
            custom_id = user.get('custom_id')
            if custom_id:
                license_number = custom_id
            else:
                # Generate new license number
                try:
                    from ..services.admin_service import generate_custom_id
                    license_number = await generate_custom_id('agent')
                except Exception as gen_error:
                    print(f"[ADMIN] Failed to generate license number: {gen_error}")
                    license_number = f"AGT-{agent_id[:8].upper()}"
            
            print(f"[ADMIN] Generated license number for agent {agent_id}: {license_number}")
        
        update_data = {
            "verification_status": "verified",
            "status": "active",  # Ensure status is 'active' not 'pending'
            "agent_license_number": license_number,
            "license_number": license_number,  # Set both fields for compatibility
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": agent_id})

        # Send approval email
        try:
            updated_user_data = await db.select("users", filters={"id": agent_id})
            if updated_user_data:
                updated_user = updated_user_data[0]
                final_license = updated_user.get('agent_license_number') or updated_user.get('license_number') or license_number
                subject = "Your Home & Own agent account has been approved"
                html_content = f"<p>Hi {updated_user.get('first_name')},</p><p>Congratulations! Your agent account on Home & Own has been approved.</p>"
                if final_license:
                    html_content += f"<p><strong>Your License Number:</strong> {final_license}</p>"
                html_content += f"<p>You can now log in and access your dashboard.</p><p><strong>Notes:</strong> {approval_notes}</p>"
                await send_email(to=updated_user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] Failed to send agent approval email: {email_error}")

        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error approving agent {agent_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/agents/{agent_id}/reject")
async def reject_agent(agent_id: str, request: Request, _=Depends(require_api_key)):
    """Reject an agent"""
    try:
        payload = await request.json() if request else {}
        rejection_reason = payload.get("rejection_reason", "Rejected by admin")
        
        update_data = {
            "verification_status": "rejected",
            "status": "inactive",
            "rejection_reason": rejection_reason,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": agent_id})
        
        # Send rejection email
        try:
            user_data = await db.select("users", filters={"id": agent_id})
            if user_data:
                user = user_data[0]
                subject = "An update on your Home & Own agent application"
                html_content = f"<p>Hi {user.get('first_name')},</p><p>Thank you for your application to Home & Own as an agent. After careful review, we regret to inform you that your application has been rejected.</p><p><strong>Reason:</strong> {rejection_reason}</p>"
                await send_email(to=user.get('email'), subject=subject, html=html_content)
        except Exception as email_error:
            print(f"[ADMIN] Failed to send agent rejection email: {email_error}")
        
        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error rejecting agent {agent_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/agents/earnings")
async def get_agent_earnings(_=Depends(require_api_key)):
    """Get agent earnings summary"""
    try:
        # Get all agents
        agents = await db.select("users", filters={"user_type": "agent"}) or []
        
        # Get all commissions
        commissions = await db.select("commissions") or []
        
        # Calculate earnings for each agent
        earnings = []
        for agent in agents:
            agent_commissions = [c for c in commissions if c.get('agent_id') == agent['id']]
            total_earnings = sum(c.get('amount', 0) for c in agent_commissions)
            pending = sum(c.get('amount', 0) for c in agent_commissions if c.get('status') == 'pending')
            paid = sum(c.get('amount', 0) for c in agent_commissions if c.get('status') == 'paid')
            
            earnings.append({
                "agent_id": agent['id'],
                "agent_name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                "email": agent.get('email'),
                "total_earnings": total_earnings,
                "pending": pending,
                "paid": paid,
                "commission_count": len(agent_commissions)
            })
        
        return earnings
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting agent earnings: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/agents/commissions")
async def get_agent_commissions(_=Depends(require_api_key)):
    """Get all agent commissions"""
    try:
        commissions = await db.select("commissions") or []
        users = await db.select("users") or []
        
        # Build user map
        user_map = {user['id']: f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() for user in users}
        
        # Add agent names to commissions
        for commission in commissions:
            agent_id = commission.get('agent_id')
            commission['agent_name'] = user_map.get(agent_id, 'Unknown') if agent_id else 'Unassigned'
        
        return commissions
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting agent commissions: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/agents/{agent_id}/commissions")
async def get_agent_commissions_detail(agent_id: str, _=Depends(require_api_key)):
    """Get commissions for a specific agent"""
    try:
        commissions = await db.select("commissions", filters={"agent_id": agent_id}) or []
        return commissions
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting agent commissions {agent_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/agents/{agent_id}/commission/set-rate")
async def set_agent_commission_rate(agent_id: str, request: Request, _=Depends(require_api_key)):
    """Set commission rate for an agent"""
    try:
        payload = await request.json()
        commission_rate = payload.get("commission_rate")
        
        if commission_rate is None:
            raise HTTPException(status_code=400, detail="commission_rate is required")
        
        # Update agent's commission rate
        update_data = {
            "commission_rate": commission_rate,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": agent_id})
        
        return {"success": True, "commission_rate": commission_rate, "agent_id": agent_id}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error setting commission rate for agent {agent_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/bookings/{booking_id}/commission/pay")
async def pay_commission(booking_id: str, request: Request, _=Depends(require_api_key)):
    """Mark a commission as paid for a booking"""
    try:
        payload = await request.json() if request else {}
        
        # Update commission status
        update_data = {
            "status": "paid",
            "paid_at": dt.datetime.utcnow().isoformat(),
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        # Find commission by booking_id
        filters = {"booking_id": booking_id}
        result = await db.update("commissions", update_data, filters)
        
        return {"success": True, "message": "Commission marked as paid", "booking_id": booking_id}
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error paying commission for booking {booking_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/inquiries/{inquiry_id}/agent-response")
async def agent_response_to_inquiry(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Add agent response to an inquiry"""
    try:
        payload = await request.json()
        response_text = payload.get("response")
        agent_id = payload.get("agent_id")
        
        if not response_text:
            raise HTTPException(status_code=400, detail="response is required")
        
        # Update inquiry with agent response
        update_data = {
            "agent_response": response_text,
            "agent_id": agent_id,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("inquiries", update_data, {"id": inquiry_id})
        
        return {"success": True, "message": "Agent response added", "inquiry_id": inquiry_id}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error adding agent response to inquiry {inquiry_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/analytics")
async def get_analytics(_=Depends(require_api_key), range: str = "7d"):
    """Get analytics data"""
    try:
        # Parse range
        range_map = {
            "1d": 1,
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365
        }
        days = range_map.get(range, 7)
        
        # Calculate date range
        end_date = dt.datetime.utcnow()
        start_date = end_date - dt.timedelta(days=days)
        
        # Get statistics
        users = await db.admin_select("users")
        properties = await db.admin_select("properties")
        bookings = await db.admin_select("bookings")
        inquiries = await db.admin_select("inquiries")
        
        # Filter data by date range
        start_str = start_date.isoformat()
        end_str = end_date.isoformat()
        
        filtered_users = [u for u in users if u.get('created_at', '') >= start_str and u.get('created_at', '') <= end_str] if users else []
        filtered_properties = [p for p in properties if p.get('created_at', '') >= start_str and p.get('created_at', '') <= end_str] if properties else []
        filtered_bookings = [b for b in bookings if b.get('created_at', '') >= start_str and b.get('created_at', '') <= end_str] if bookings else []
        filtered_inquiries = [i for i in inquiries if i.get('created_at', '') >= start_str and i.get('created_at', '') <= end_str] if inquiries else []
        
        analytics = {
            "range": range,
            "start_date": start_str,
            "end_date": end_str,
            "total_users": len(users) if users else 0,
            "new_users": len(filtered_users),
            "total_properties": len(properties) if properties else 0,
            "new_properties": len(filtered_properties),
            "total_bookings": len(bookings) if bookings else 0,
            "new_bookings": len(filtered_bookings),
            "total_inquiries": len(inquiries) if inquiries else 0,
            "new_inquiries": len(filtered_inquiries),
        }
        
        return analytics
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting analytics: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

# Additional missing routes
@router.post("/users/{user_id}/profile")
async def update_user_profile(user_id: str, request: Request, _=Depends(require_api_key)):
    """Update user profile data"""
    try:
        payload = await request.json()
        payload["updated_at"] = dt.datetime.utcnow().isoformat()
        return await db.update("users", payload, {"id": user_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/bank")
async def update_user_bank(user_id: str, request: Request, _=Depends(require_api_key)):
    """Update user bank details"""
    try:
        payload = await request.json()
        update_data = {
            "bank_account_number": payload.get("bank_account_number"),
            "ifsc_code": payload.get("ifsc_code"),
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        return await db.update("users", update_data, {"id": user_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/verify-bank")
async def verify_user_bank(user_id: str, _=Depends(require_api_key)):
    """Verify user bank account"""
    try:
        update_data = {
            "bank_verified": True,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        return await db.update("users", update_data, {"id": user_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/verify-status")
async def update_verification_status(user_id: str, request: Request, _=Depends(require_api_key)):
    """Update user verification status"""
    try:
        payload = await request.json()
        status = payload.get("status")
        update_data = {
            "verification_status": status,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        return await db.update("users", update_data, {"id": user_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inquiries/{inquiry_id}/assign-agent")
async def assign_agent_to_inquiry(inquiry_id: str, request: Request, _=Depends(require_api_key)):
    """Assign an agent to an inquiry"""
    try:
        payload = await request.json()
        agent_id = payload.get("agent_id")
        status = payload.get("status", "pending")
        assigned_at = payload.get("assigned_at")
        expires_at = payload.get("expires_at")
        notes = payload.get("notes")
        
        update_data = {
            "agent_id": agent_id,
            "status": status,
            "assigned_at": assigned_at,
            "expires_at": expires_at,
            "notes": notes,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        return await db.update("inquiries", update_data, {"id": inquiry_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/{document_id}/approve")
async def approve_document(document_id: str, _=Depends(require_api_key)):
    """Approve a document"""
    try:
        print(f"[ADMIN] Approving document {document_id}")
        update_data = {
            "status": "approved",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("documents", update_data, {"id": document_id})
        print(f"[ADMIN] Document approval result: {result}")
        
        # Verify the update worked
        if result and len(result) > 0:
            updated_doc = result[0]
            print(f"[ADMIN] Document {document_id} approved successfully, status: {updated_doc.get('status')}")
            return {"success": True, "document": updated_doc}
        else:
            print(f"[ADMIN] Warning: Document update returned no results")
            # Try to fetch the document to see if it exists
            docs = await db.admin_select("documents", filters={"id": document_id})
            if not docs:
                raise HTTPException(status_code=404, detail="Document not found")
            raise HTTPException(status_code=500, detail="Failed to update document")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error approving document: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to approve document: {str(e)}")

@router.post("/documents/{document_id}/reject")
async def reject_document(document_id: str, request: Request, _=Depends(require_api_key)):
    """Reject a document"""
    try:
        payload = await request.json() if request else {}
        reason = payload.get("reason", "")
        print(f"[ADMIN] Rejecting document {document_id} with reason: {reason}")
        
        update_data = {
            "status": "rejected",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        if reason:
            update_data["rejection_reason"] = reason
        
        result = await db.update("documents", update_data, {"id": document_id})
        print(f"[ADMIN] Document rejection result: {result}")
        
        # Verify the update worked
        if result and len(result) > 0:
            updated_doc = result[0]
            print(f"[ADMIN] Document {document_id} rejected successfully, status: {updated_doc.get('status')}")
            return {"success": True, "document": updated_doc}
        else:
            print(f"[ADMIN] Warning: Document update returned no results")
            # Try to fetch the document to see if it exists
            docs = await db.admin_select("documents", filters={"id": document_id})
            if not docs:
                raise HTTPException(status_code=404, detail="Document not found")
            raise HTTPException(status_code=500, detail="Failed to update document")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error rejecting document: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to reject document: {str(e)}")

@router.get("/notifications")
async def get_notifications(_=Depends(require_api_key), user_id: str = None):
    """Get notifications for a user"""
    try:
        filters = {"user_id": user_id} if user_id else {}
        notifications = await db.select("notifications", filters=filters) or []
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/property-assignments/{property_id}/tracking")
async def get_property_assignment_tracking(property_id: str, _=Depends(require_api_key)):
    """Get complete tracking information for a property's agent assignment process"""
    try:
        from ..services.sequential_agent_notification import SequentialAgentNotificationService
        
        tracking = await SequentialAgentNotificationService.get_assignment_tracking(property_id)
        
        if not tracking or tracking.get("error"):
            raise HTTPException(
                status_code=404,
                detail=tracking.get("error", "Tracking information not found")
            )
        
        return tracking
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting assignment tracking: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/property-assignments/queue")
async def get_all_assignment_queues(_=Depends(require_api_key), status: Optional[str] = None):
    """Get all property assignment queues (for admin dashboard)"""
    try:
        filters = {}
        if status:
            filters["status"] = status
        
        queues = await db.admin_select("property_assignment_queue", filters=filters) or []
        
        # Enrich with property and agent details
        enriched_queues = []
        for queue in queues:
            property_id = queue.get("property_id")
            property_data = None
            if property_id:
                properties = await db.select("properties", filters={"id": property_id})
                property_data = properties[0] if properties else None
            
            current_agent_id = queue.get("current_agent_id")
            current_agent_data = None
            if current_agent_id:
                agents = await db.select("users", filters={"id": current_agent_id})
                current_agent_data = agents[0] if agents else None
            
            final_agent_id = queue.get("final_agent_id")
            final_agent_data = None
            if final_agent_id:
                agents = await db.select("users", filters={"id": final_agent_id})
                final_agent_data = agents[0] if agents else None
            
            enriched_queues.append({
                **queue,
                "property": property_data,
                "current_agent": current_agent_data,
                "final_agent": final_agent_data
            })
        
        return enriched_queues
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting assignment queues: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/property-assignments/unassigned")
async def get_unassigned_properties(_=Depends(require_api_key)):
    """Get all properties that are unassigned (no agent assigned)"""
    try:
        # Get properties with no agent assigned
        properties = await db.admin_select("properties", filters={
            "agent_id": None
        }) or []
        
        # Also check properties that have expired queues
        expired_queues = await db.admin_select("property_assignment_queue", filters={
            "status": "expired"
        }) or []
        
        expired_property_ids = [q.get("property_id") for q in expired_queues]
        
        # Get properties from expired queues
        expired_properties = []
        for property_id in expired_property_ids:
            props = await db.select("properties", filters={"id": property_id})
            if props:
                expired_properties.append(props[0])
        
        return {
            "unassigned_without_queue": properties,
            "unassigned_expired_queue": expired_properties,
            "total_unassigned": len(properties) + len(expired_properties)
        }
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting unassigned properties: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/properties/{property_id}/comprehensive-stats")
async def get_property_comprehensive_stats(property_id: str, _=Depends(require_api_key)):
    """Get comprehensive statistics for a property including inquiries, bookings, agent, views"""
    try:
        # Get property
        properties = await db.select("properties", filters={"id": property_id})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = properties[0]
        
        # Get inquiries
        inquiries = await db.select("inquiries", filters={"property_id": property_id}) or []
        
        # Get bookings
        bookings = await db.select("bookings", filters={"property_id": property_id}) or []
        
        # Get assigned agent
        assigned_agent = None
        agent_id = property_data.get("agent_id") or property_data.get("assigned_agent_id")
        if agent_id:
            agents = await db.select("users", filters={"id": agent_id})
            if agents:
                agent = agents[0]
                assigned_agent = {
                    "id": agent.get("id"),
                    "name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                    "email": agent.get("email"),
                    "phone": agent.get("phone_number"),
                    "assignments_count": 0,  # Count of properties assigned to this agent
                    "inquiries_count": 0,  # Count of inquiries for this agent's properties
                    "bookings_count": 0  # Count of bookings for this agent's properties
                }
                # Get agent's total assignments
                agent_properties = await db.select("properties", filters={
                    "$or": [{"agent_id": agent_id}, {"assigned_agent_id": agent_id}]
                }) or []
                assigned_agent["assignments_count"] = len(agent_properties)
                
                # Get agent's total inquiries and bookings
                agent_property_ids = [p.get("id") for p in agent_properties]
                if agent_property_ids:
                    agent_inquiries = await db.select("inquiries", filters={
                        "property_id": {"in": agent_property_ids}
                    }) or []
                    agent_bookings = await db.select("bookings", filters={
                        "property_id": {"in": agent_property_ids}
                    }) or []
                    assigned_agent["inquiries_count"] = len(agent_inquiries)
                    assigned_agent["bookings_count"] = len(agent_bookings)
        
        # Get property owner
        owner = None
        owner_id = property_data.get("owner_id") or property_data.get("added_by")
        if owner_id:
            owners = await db.select("users", filters={"id": owner_id})
            if owners:
                owner = {
                    "id": owners[0].get("id"),
                    "name": f"{owners[0].get('first_name', '')} {owners[0].get('last_name', '')}".strip(),
                    "email": owners[0].get("email"),
                    "phone": owners[0].get("phone_number")
                }
        
        # Calculate stats
        stats = {
            "total_inquiries": len(inquiries),
            "new_inquiries": len([i for i in inquiries if i.get("status") == "new"]),
            "responded_inquiries": len([i for i in inquiries if i.get("status") in ["responded", "contacted"]]),
            "total_bookings": len(bookings),
            "pending_bookings": len([b for b in bookings if b.get("status") == "pending"]),
            "confirmed_bookings": len([b for b in bookings if b.get("status") == "confirmed"]),
            "completed_bookings": len([b for b in bookings if b.get("status") == "completed"]),
            "conversion_rate": round((len(bookings) / max(len(inquiries), 1)) * 100, 2),
            "has_assigned_agent": agent_id is not None,
            "assigned_agent": assigned_agent,
            "property_owner": owner,
            "property_status": property_data.get("status"),
            "property_verified": property_data.get("verified"),
            "created_at": property_data.get("created_at"),
            "updated_at": property_data.get("updated_at")
        }
        
        return {
            "success": True,
            "property_id": property_id,
            "property_title": property_data.get("title"),
            "stats": stats,
            "inquiries": inquiries[:10],  # Last 10 inquiries
            "bookings": bookings[:10]  # Last 10 bookings
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ADMIN] Error getting property comprehensive stats: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notifications/{notification_id}/mark-read")
async def mark_notification_read(notification_id: str, _=Depends(require_api_key)):
    """Mark a notification as read"""
    try:
        update_data = {
            "read": True,
            "read_at": dt.datetime.utcnow().isoformat(),
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        return await db.update("notifications", update_data, {"id": notification_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))