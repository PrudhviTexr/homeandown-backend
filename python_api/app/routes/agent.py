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
        
        # Get agent's assigned property IDs
        properties = await db.select("properties", filters={"agent_id": user_id})
        property_ids = [p.get("id") for p in (properties or [])]
        
        if not property_ids:
            return {"success": True, "inquiries": [], "total": 0}
        
        # Build filters
        filters = {"property_id": {"in": property_ids}}
        if property_id:
            filters["property_id"] = property_id
        if status:
            filters["status"] = status
        
        # Get inquiries
        inquiries = await db.select("inquiries", filters=filters, limit=limit, offset=offset)
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
        
        # Get agent's assigned property IDs
        properties = await db.select("properties", filters={"agent_id": user_id})
        property_ids = [p.get("id") for p in (properties or [])]
        
        if not property_ids:
            return {"success": True, "bookings": [], "total": 0}
        
        # Build filters
        filters = {"property_id": {"in": property_ids}}
        if property_id:
            filters["property_id"] = property_id
        if status:
            filters["status"] = status
        
        # Get bookings
        bookings = await db.select("bookings", filters=filters, limit=limit, offset=offset)
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
