from fastapi import APIRouter, HTTPException, Depends, Request
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
            "verified": True, "status": "verified", "updated_at": dt.datetime.utcnow().isoformat()
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
                        await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send property approval email: {email_error}")

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
                        await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
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
                        await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
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
                await send_email(to_email=agent.get('email'), subject=subject, html_content=html_content)
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

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, _=Depends(require_api_key)):
    try:
        update_data = {
            "verification_status": "verified", "status": "active",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": user_id})

        # Send approval email
        try:
            user_data = await db.select("users", filters={"id": user_id})
            if user_data:
                user = user_data[0]
                subject = "Your Home & Own account has been approved"
                html_content = f"<p>Hi {user.get('first_name')},</p><p>Congratulations! Your {user.get('user_type')} account on Home & Own has been approved.</p><p>You can now log in and access your dashboard.</p>"
                await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
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
                await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
        except Exception as email_error:
            print(f"[ADMIN] !!! Failed to send rejection email: {email_error}")
        
        return result
    except Exception as e:
        import traceback
        print(f"[ADMIN] !!! Error rejecting user {user_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/documents")
async def list_documents(_=Depends(require_api_key)):
    try:
        return await db.admin_select("documents") or []
    except Exception as e:
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
    """Approve an agent"""
    try:
        payload = await request.json() if request else {}
        approval_notes = payload.get("approval_notes", "Agent approved by admin")
        
        update_data = {
            "verification_status": "verified",
            "status": "active",
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        result = await db.update("users", update_data, {"id": agent_id})

        # Send approval email
        try:
            user_data = await db.select("users", filters={"id": agent_id})
            if user_data:
                user = user_data[0]
                subject = "Your Home & Own agent account has been approved"
                html_content = f"<p>Hi {user.get('first_name')},</p><p>Congratulations! Your agent account on Home & Own has been approved.</p><p>You can now log in and access your dashboard.</p><p><strong>Notes:</strong> {approval_notes}</p>"
                await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
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
                await send_email(to_email=user.get('email'), subject=subject, html_content=html_content)
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