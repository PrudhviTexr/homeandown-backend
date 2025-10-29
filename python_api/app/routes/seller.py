from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from ..db.supabase_client import db
from ..core.security import get_current_user_claims
import datetime as dt
import traceback
import uuid

router = APIRouter()

@router.get("/seller/dashboard/stats")
async def get_seller_dashboard_stats(request: Request):
    """Get comprehensive seller dashboard statistics"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[SELLER] Fetching dashboard stats for user: {user_id}")
        
        # Get seller's properties
        properties = await db.select("properties", filters={"added_by": user_id})
        properties_list = properties or []
        
        # Calculate stats
        total_properties = len(properties_list)
        active_properties = len([p for p in properties_list if p.get("status") == "active"])
        pending_properties = len([p for p in properties_list if p.get("status") == "pending"])
        verified_properties = len([p for p in properties_list if p.get("verified") == True])
        
        # Get inquiries for seller's properties
        property_ids = [p.get("id") for p in properties_list]
        total_inquiries = 0
        total_views = 0
        
        if property_ids:
            inquiries = await db.select("inquiries", filters={"property_id": {"in": property_ids}})
            total_inquiries = len(inquiries or [])
            
            # Calculate total views (mock for now - will be implemented with analytics)
            total_views = sum(p.get("views_count", 0) for p in properties_list)
        
        # Get bookings for seller's properties
        total_bookings = 0
        if property_ids:
            bookings = await db.select("bookings", filters={"property_id": {"in": property_ids}})
            total_bookings = len(bookings or [])
        
        # Calculate earnings (mock calculation)
        monthly_earnings = active_properties * 5000  # Placeholder calculation
        
        # Response rate calculation
        response_rate = 0
        if total_views > 0:
            response_rate = round((total_inquiries / total_views) * 100, 2)
        
        stats = {
            "total_properties": total_properties,
            "active_properties": active_properties,
            "pending_properties": pending_properties,
            "verified_properties": verified_properties,
            "total_views": total_views,
            "total_inquiries": total_inquiries,
            "total_bookings": total_bookings,
            "monthly_earnings": monthly_earnings,
            "response_rate": response_rate,
            "conversion_rate": round((total_bookings / max(total_inquiries, 1)) * 100, 2)
        }
        
        print(f"[SELLER] Dashboard stats calculated: {stats}")
        return {"success": True, "stats": stats}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Dashboard stats error: {e}")
        print(f"[SELLER] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")

@router.get("/seller/properties")
async def get_seller_properties(
    request: Request,
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get seller's properties with detailed information"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[SELLER] Fetching properties for user: {user_id}")
        
        # Build filters
        filters = {"added_by": user_id}
        if status:
            filters["status"] = status
        
        # Get properties
        properties = await db.select("properties", filters=filters, limit=limit, offset=offset)
        properties_list = properties or []
        
        # Enhance properties with additional data
        enhanced_properties = []
        for property_data in properties_list:
            property_id = property_data.get("id")
            
            # Get inquiries count
            inquiries = await db.select("inquiries", filters={"property_id": property_id})
            inquiries_count = len(inquiries or [])
            
            # Get bookings count
            bookings = await db.select("bookings", filters={"property_id": property_id})
            bookings_count = len(bookings or [])
            
            # Get views count (mock for now)
            views_count = property_data.get("views_count", 0)
            
            # Get assigned agent details
            assigned_agent = None
            agent_id = property_data.get("agent_id") or property_data.get("assigned_agent_id")
            if agent_id:
                try:
                    agents = await db.select("users", filters={"id": agent_id})
                    if agents:
                        agent = agents[0]
                        assigned_agent = {
                            "id": agent.get("id"),
                            "name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                            "email": agent.get("email"),
                            "phone": agent.get("phone_number"),
                            "assigned_at": property_data.get("assigned_at")  # If we track this
                        }
                except Exception as agent_error:
                    print(f"[SELLER] Error fetching agent details: {agent_error}")
            
            # Get property images
            property_images = []
            try:
                image_docs = await db.select("documents", filters={
                    "entity_type": "property",
                    "entity_id": property_id
                })
                if image_docs:
                    property_images = [doc.get("file_path") for doc in image_docs if doc.get("file_path")]
            except Exception as img_error:
                print(f"[SELLER] Error fetching property images: {img_error}")
            
            enhanced_property = {
                **property_data,
                "inquiries_count": inquiries_count,
                "bookings_count": bookings_count,
                "views_count": views_count,
                "last_inquiry_date": inquiries[0].get("created_at") if inquiries else None,
                "last_booking_date": bookings[0].get("created_at") if bookings else None,
                "assigned_agent": assigned_agent,
                "images": property_images  # Include images
            }
            
            enhanced_properties.append(enhanced_property)
        
        print(f"[SELLER] Found {len(enhanced_properties)} properties")
        return {"success": True, "properties": enhanced_properties, "total": len(enhanced_properties)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Get properties error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch properties: {str(e)}")

@router.get("/seller/inquiries")
async def get_seller_inquiries(
    request: Request,
    property_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get inquiries for seller's properties"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[SELLER] Fetching inquiries for user: {user_id}")
        
        # Get seller's property IDs
        properties = await db.select("properties", filters={"added_by": user_id})
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
        
        # Enhance inquiries with property details
        enhanced_inquiries = []
        for inquiry in inquiries_list:
            prop_id = inquiry.get("property_id")
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            enhanced_inquiry = {
                **inquiry,
                "property": property_info
            }
            enhanced_inquiries.append(enhanced_inquiry)
        
        print(f"[SELLER] Found {len(enhanced_inquiries)} inquiries")
        return {"success": True, "inquiries": enhanced_inquiries, "total": len(enhanced_inquiries)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Get inquiries error: {e}")
        print(f"[SELLER] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch inquiries: {str(e)}")

@router.get("/seller/bookings")
async def get_seller_bookings(
    request: Request,
    property_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get bookings for seller's properties"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[SELLER] Fetching bookings for user: {user_id}")
        
        # Get seller's property IDs
        properties = await db.select("properties", filters={"added_by": user_id})
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
        
        # Enhance bookings with property details
        enhanced_bookings = []
        for booking in bookings_list:
            prop_id = booking.get("property_id")
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            enhanced_booking = {
                **booking,
                "property": property_info
            }
            enhanced_bookings.append(enhanced_booking)
        
        print(f"[SELLER] Found {len(enhanced_bookings)} bookings")
        return {"success": True, "bookings": enhanced_bookings, "total": len(enhanced_bookings)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Get bookings error: {e}")
        print(f"[SELLER] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.get("/seller/bookings")
async def get_seller_bookings(
    request: Request,
    property_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(20),
    offset: Optional[int] = Query(0)
):
    """Get bookings for seller's properties"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"[SELLER] Fetching bookings for user: {user_id}")
        
        # Get seller's property IDs
        properties = await db.select("properties", filters={"added_by": user_id})
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
        
        # Enhance bookings with property and user details, filter out sold properties
        enhanced_bookings = []
        for booking in bookings_list:
            prop_id = booking.get("property_id")
            user_id_booking = booking.get("user_id")
            
            # Get property details
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            # Skip bookings for sold properties
            prop_status = (property_info.get('status') or '').lower().strip()
            if prop_status == 'sold':
                print(f"[SELLER] Skipping booking for sold property: {prop_id}")
                continue
            
            # Get user details
            user_data = await db.select("users", filters={"id": user_id_booking})
            user_info = user_data[0] if user_data else {}
            
            enhanced_booking = {
                **booking,
                "property": property_info,
                "user": user_info
            }
            enhanced_bookings.append(enhanced_booking)
        
        print(f"[SELLER] Found {len(enhanced_bookings)} bookings")
        return {"success": True, "bookings": enhanced_bookings, "total": len(enhanced_bookings)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Get bookings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@router.post("/seller/bookings/{booking_id}/update-status")
async def update_booking_status(
    booking_id: str,
    request: Request
):
    """Update booking status (confirm, cancel, reschedule)"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get request data
        data = await request.json()
        new_status = data.get("status")
        new_date = data.get("tour_date")
        notes = data.get("notes", "")
        
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        print(f"[SELLER] Updating booking {booking_id} status to {new_status}")
        
        # Verify booking belongs to seller
        booking_data = await db.select("bookings", filters={"id": booking_id})
        if not booking_data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = booking_data[0]
        property_id = booking.get("property_id")
        
        # Check if property belongs to seller
        property_data = await db.select("properties", filters={"id": property_id, "added_by": user_id})
        if not property_data:
            raise HTTPException(status_code=403, detail="Not authorized to update this booking")
        
        # Update booking
        update_data = {
            "status": new_status,
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        if new_date:
            update_data["tour_date"] = new_date
        
        if notes:
            update_data["notes"] = notes
        
        await db.update("bookings", update_data, {"id": booking_id})
        
        print(f"[SELLER] Booking {booking_id} updated successfully")
        return {"success": True, "message": f"Booking status updated to {new_status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Update booking status error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update booking status: {str(e)}")

@router.post("/seller/inquiries/{inquiry_id}/respond")
async def respond_to_inquiry(
    inquiry_id: str,
    request: Request
):
    """Respond to an inquiry"""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get request data
        data = await request.json()
        response_message = data.get("message")
        
        if not response_message:
            raise HTTPException(status_code=400, detail="Response message is required")
        
        print(f"[SELLER] Responding to inquiry {inquiry_id}")
        
        # Verify inquiry belongs to seller's property
        inquiry_data = await db.select("inquiries", filters={"id": inquiry_id})
        if not inquiry_data:
            raise HTTPException(status_code=404, detail="Inquiry not found")
        
        inquiry = inquiry_data[0]
        property_id = inquiry.get("property_id")
        
        # Check if property belongs to seller
        property_data = await db.select("properties", filters={"id": property_id, "added_by": user_id})
        if not property_data:
            raise HTTPException(status_code=403, detail="Not authorized to respond to this inquiry")
        
        # Update inquiry with response
        update_data = {
            "status": "responded",
            "response_message": response_message,
            "responded_at": dt.datetime.utcnow().isoformat(),
            "updated_at": dt.datetime.utcnow().isoformat()
        }
        
        await db.update("inquiries", update_data, {"id": inquiry_id})
        
        print(f"[SELLER] Inquiry {inquiry_id} responded successfully")
        return {"success": True, "message": "Response sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SELLER] Respond to inquiry error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to respond to inquiry: {str(e)}")
