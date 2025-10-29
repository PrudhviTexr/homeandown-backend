from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from ..db.supabase_client import db
from ..core.security import get_current_user_claims
import datetime as dt
import traceback
import uuid

router = APIRouter()

@router.get("/agent/dashboard/stats")
async def get_agent_dashboard_stats(request: Request):
    """Get comprehensive agent dashboard statistics"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[AGENT] Fetching dashboard stats for user: {user_id}")
        
        # Get agent's assigned properties
        properties = await db.select("properties", filters={"agent_id": user_id})
        properties_list = properties or []
        
        # Calculate stats
        total_properties = len(properties_list)
        active_properties = len([p for p in properties_list if p.get("status") == "active"])
        pending_properties = len([p for p in properties_list if p.get("status") == "pending"])
        
        # Get inquiries for agent's properties
        property_ids = [p.get("id") for p in properties_list]
        total_inquiries = 0
        new_inquiries = 0
        responded_inquiries = 0
        
        if property_ids:
            inquiries = await db.select("inquiries", filters={"property_id": {"in": property_ids}})
            inquiries_list = inquiries or []
            total_inquiries = len(inquiries_list)
            new_inquiries = len([i for i in inquiries_list if i.get("status") == "new"])
            responded_inquiries = len([i for i in inquiries_list if i.get("status") == "responded"])
        
        # Get bookings for agent's properties
        total_bookings = 0
        pending_bookings = 0
        confirmed_bookings = 0
        completed_bookings = 0
        
        if property_ids:
            bookings = await db.select("bookings", filters={"property_id": {"in": property_ids}})
            bookings_list = bookings or []
            total_bookings = len(bookings_list)
            pending_bookings = len([b for b in bookings_list if b.get("status") == "pending"])
            confirmed_bookings = len([b for b in bookings_list if b.get("status") == "confirmed"])
            completed_bookings = len([b for b in bookings_list if b.get("status") == "completed"])
        
        # Calculate response rate
        response_rate = 0
        if total_inquiries > 0:
            response_rate = round((responded_inquiries / total_inquiries) * 100, 2)
        
        # Calculate conversion rate
        conversion_rate = 0
        if total_inquiries > 0:
            conversion_rate = round((total_bookings / total_inquiries) * 100, 2)
        
        stats = {
            "total_properties": total_properties,
            "active_properties": active_properties,
            "pending_properties": pending_properties,
            "total_inquiries": total_inquiries,
            "new_inquiries": new_inquiries,
            "responded_inquiries": responded_inquiries,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "response_rate": response_rate,
            "conversion_rate": conversion_rate
        }
        
        print(f"[AGENT] Dashboard stats calculated: {stats}")
        return {"success": True, "stats": stats}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Dashboard stats error: {e}")
        print(f"[AGENT] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")

@router.get("/agent/inquiries")
async def get_agent_inquiries(
    request: Request,
    property_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get inquiries for agent's assigned properties"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[AGENT] Fetching inquiries for user: {user_id}")
        
        # Get agent's assigned property IDs - check both agent_id and assigned_agent_id
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        
        # Combine both lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
        property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties")
        
        if not property_ids:
            return {"success": True, "inquiries": [], "total": 0}
        
        # Build filters
        filters = {"property_id": {"in": property_ids}}
        if property_id:
            filters["property_id"] = property_id
        if status:
            filters["status"] = status
        
        # Get inquiries
        inquiries = await db.select("inquiries", filters=filters, limit=limit)
        inquiries_list = inquiries or []
        
        # Enhance inquiries with property and user details
        enhanced_inquiries = []
        for inquiry in inquiries_list:
            prop_id = inquiry.get("property_id")
            user_id_inquiry = inquiry.get("user_id")
            
            # Get property details
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            # Get user details
            user_info = {}
            if user_id_inquiry:
                user_data = await db.select("users", filters={"id": user_id_inquiry})
                user_info = user_data[0] if user_data else {}
            
            enhanced_inquiry = {
                **inquiry,
                "property": property_info,
                "user": user_info
            }
            enhanced_inquiries.append(enhanced_inquiry)
        
        print(f"[AGENT] Found {len(enhanced_inquiries)} inquiries")
        return {"success": True, "inquiries": enhanced_inquiries, "total": len(enhanced_inquiries)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Get inquiries error: {e}")
        print(f"[AGENT] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")

@router.get("/agent/bookings")
async def get_agent_bookings(
    request: Request,
    property_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get bookings for agent's assigned properties"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[AGENT] Fetching bookings for user: {user_id}")
        
        # Get agent's assigned property IDs - check both agent_id and assigned_agent_id
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        
        # Combine both lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
        property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties")
        
        if not property_ids:
            return {"success": True, "bookings": [], "total": 0}
        
        # Build filters
        filters = {"property_id": {"in": property_ids}}
        if property_id:
            filters["property_id"] = property_id
        if status:
            filters["status"] = status
        
        # Get bookings
        bookings = await db.select("bookings", filters=filters, limit=limit)
        bookings_list = bookings or []
        
        # Enhance bookings with property and user details
        enhanced_bookings = []
        for booking in bookings_list:
            prop_id = booking.get("property_id")
            user_id_booking = booking.get("user_id")
            
            # Get property details
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            # Get user details
            user_info = {}
            if user_id_booking:
                user_data = await db.select("users", filters={"id": user_id_booking})
                user_info = user_data[0] if user_data else {}
            
            enhanced_booking = {
                **booking,
                "property": property_info,
                "user": user_info
            }
            enhanced_bookings.append(enhanced_booking)
        
        print(f"[AGENT] Found {len(enhanced_bookings)} bookings")
        return {"success": True, "bookings": enhanced_bookings, "total": len(enhanced_bookings)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Get bookings error: {e}")
        print(f"[AGENT] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.get("/agent/properties")
async def get_agent_properties(
    request: Request,
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get properties assigned to the agent"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[AGENT] Fetching properties for user: {user_id}")
        
        # Get agent's assigned properties - check both agent_id and assigned_agent_id
        # Only show verified properties for agents
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id, "verified": True})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id, "verified": True})
        
        # Combine both lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
        unique_properties = []
        seen_ids = set()
        
        for prop in all_properties:
            prop_id = prop.get("id")
            if prop_id and prop_id not in seen_ids:
                seen_ids.add(prop_id)
                unique_properties.append(prop)
        
        print(f"[AGENT] Found {len(unique_properties)} assigned properties")
        
        # Apply status filter if provided
        if status:
            unique_properties = [p for p in unique_properties if p.get("status") == status]
        
        # Apply limit and offset
        start_idx = offset or 0
        end_idx = start_idx + (limit or 20)
        paginated_properties = unique_properties[start_idx:end_idx]
        
        return {"success": True, "properties": paginated_properties, "total": len(unique_properties)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Get properties error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch properties: {str(e)}")

@router.get("/agent/pending-assignments")
async def get_pending_property_assignments(request: Request):
    """Get pending property assignment notifications for the agent"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[AGENT] Fetching pending assignments for user: {user_id}")
        
        # Get pending notifications for this agent
        notifications = await db.select("agent_property_notifications", filters={
            "agent_id": user_id,
            "status": "pending"
        })
        
        notifications_list = notifications or []
        
        # Enhance with property details
        enhanced_notifications = []
        for notification in notifications_list:
            property_id = notification.get("property_id")
            property_data = None
            
            if property_id:
                properties = await db.select("properties", filters={"id": property_id})
                if properties:
                    property_data = properties[0]
            
            enhanced_notifications.append({
                **notification,
                "property": property_data
            })
        
        # Sort by sent_at descending (most recent first)
        enhanced_notifications.sort(
            key=lambda x: x.get("sent_at", ""), 
            reverse=True
        )
        
        print(f"[AGENT] Found {len(enhanced_notifications)} pending assignments")
        return {"success": True, "notifications": enhanced_notifications, "total": len(enhanced_notifications)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Get pending assignments error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending assignments: {str(e)}")
