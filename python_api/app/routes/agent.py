from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from ..db.supabase_client import db
from ..core.security import get_current_user_claims
import datetime as dt
import traceback
import uuid

router = APIRouter()

@router.get("/dashboard/stats")
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
        
        # Get agent's assigned properties - check all assignment fields
        # 1. agent_id - legacy field for assignment
        # 2. assigned_agent_id - current field for assignment  
        # 3. owner_id - properties owned/created by the agent
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        properties_owned = await db.select("properties", filters={"owner_id": user_id})
        
        # Combine all lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or []) + (properties_owned or [])
        unique_properties = []
        seen_ids = set()
        
        for prop in all_properties:
            prop_id = prop.get("id")
            if prop_id and prop_id not in seen_ids:
                seen_ids.add(prop_id)
                unique_properties.append(prop)
        
        properties_list = unique_properties
        print(f"[AGENT] Found {len(properties_list)} total properties (assigned + owned)")
        
        # Calculate stats
        total_properties = len(properties_list)
        active_properties = len([p for p in properties_list if p.get("status") == "active"])
        pending_properties = len([p for p in properties_list if p.get("status") == "pending"])
        
        # Get inquiries for agent's properties - check both property assignments AND direct agent assignments
        property_ids = [p.get("id") for p in properties_list]
        total_inquiries = 0
        new_inquiries = 0
        responded_inquiries = 0
        
        try:
            # Get inquiries by property
            if property_ids:
                inquiries_by_property = await db.select("inquiries", filters={"property_id": {"in": property_ids}})
            else:
                inquiries_by_property = []
            
            # Get inquiries by direct agent assignment (from inquiries.assigned_agent_id)
            inquiries_by_agent = await db.select("inquiries", filters={"assigned_agent_id": user_id})
            
            # Combine and deduplicate
            all_inquiries = (inquiries_by_property or []) + (inquiries_by_agent or [])
            seen_ids = set()
            inquiries_list = []
            for inquiry in all_inquiries:
                inquiry_id = inquiry.get("id")
                if inquiry_id and inquiry_id not in seen_ids:
                    seen_ids.add(inquiry_id)
                    inquiries_list.append(inquiry)
            
            total_inquiries = len(inquiries_list)
            new_inquiries = len([i for i in inquiries_list if i.get("status") == "new"])
            responded_inquiries = len([i for i in inquiries_list if i.get("status") == "responded"])
        except Exception as e:
            print(f"[AGENT] Error fetching inquiries for stats: {e}")
            # Fallback to property-based only
        if property_ids:
            inquiries = await db.select("inquiries", filters={"property_id": {"in": property_ids}})
            inquiries_list = inquiries or []
            total_inquiries = len(inquiries_list)
            new_inquiries = len([i for i in inquiries_list if i.get("status") == "new"])
            responded_inquiries = len([i for i in inquiries_list if i.get("status") == "responded"])
        
        # Get bookings for agent's properties - check both property assignments AND direct agent assignments
        total_bookings = 0
        pending_bookings = 0
        confirmed_bookings = 0
        completed_bookings = 0
        
        try:
            # Get bookings by property
            if property_ids:
                bookings_by_property = await db.select("bookings", filters={"property_id": {"in": property_ids}})
            else:
                bookings_by_property = []
            
            # Get bookings by direct agent assignment (from bookings.agent_id)
            bookings_by_agent = await db.select("bookings", filters={"agent_id": user_id})
            
            # Combine and deduplicate
            all_bookings = (bookings_by_property or []) + (bookings_by_agent or [])
            seen_ids = set()
            bookings_list = []
            for booking in all_bookings:
                booking_id = booking.get("id")
                if booking_id and booking_id not in seen_ids:
                    seen_ids.add(booking_id)
                    bookings_list.append(booking)
            
            total_bookings = len(bookings_list)
            pending_bookings = len([b for b in bookings_list if b.get("status") == "pending"])
            confirmed_bookings = len([b for b in bookings_list if b.get("status") == "confirmed"])
            completed_bookings = len([b for b in bookings_list if b.get("status") == "completed"])
        except Exception as e:
            print(f"[AGENT] Error fetching bookings for stats: {e}")
            # Fallback to property-based only
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

@router.get("/profile")
async def get_agent_profile(request: Request):
    """Get the current agent's full profile, including license and documents."""
    try:
        claims = get_current_user_claims(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        print(f"[AGENT] Fetching full profile for user: {user_id}")

        # Get agent's user data
        users = await db.select("users", filters={"id": user_id})
        if not users:
            raise HTTPException(status_code=404, detail="Agent profile not found")
        
        agent_data = users[0]

        # Get agent's documents
        documents = await db.select("documents", filters={"entity_id": user_id}) or []
        
        # Add public URLs to documents
        for doc in documents:
            file_path = doc.get("file_path")
            if file_path:
                try:
                    # Check if file_path is already a full URL (starts with http)
                    if file_path.startswith('http://') or file_path.startswith('https://'):
                        # It's already a full URL, use it directly
                        doc['public_url'] = file_path
                    else:
                        # It's just a path, generate the public URL
                        public_url = db.supabase_client.storage.from_("documents").get_public_url(file_path)
                        doc['public_url'] = public_url
                except Exception as e:
                    print(f"Error generating public url for {file_path}: {e}")
                    doc['public_url'] = None
        
        # Combine into a single response
        full_profile = {
            "user": agent_data,
            "documents": documents
        }
        
        return full_profile

    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Get profile error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="An error occurred while fetching agent profile.")

@router.get("/inquiries")
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
        
        # Get agent's property IDs - check agent_id, assigned_agent_id, and owner_id
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        properties_owned = await db.select("properties", filters={"owner_id": user_id})
        
        # Combine all lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or []) + (properties_owned or [])
        property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties")
        
        # Build filters - check both property assignments AND direct agent assignments in inquiries table
        # According to schema: inquiries table has assigned_agent_id field
        try:
            # Get inquiries by property
            if property_ids:
                inquiries_by_property = await db.select("inquiries", filters={"property_id": {"in": property_ids}}, limit=limit)
            else:
                inquiries_by_property = []
            
            # Get inquiries by direct agent assignment (from inquiries.assigned_agent_id)
            inquiries_by_agent = await db.select("inquiries", filters={"assigned_agent_id": user_id}, limit=limit)
            
            # Combine and deduplicate
            all_inquiries = (inquiries_by_property or []) + (inquiries_by_agent or [])
            seen_ids = set()
            inquiries_list = []
            for inquiry in all_inquiries:
                inquiry_id = inquiry.get("id")
                if inquiry_id and inquiry_id not in seen_ids:
                    seen_ids.add(inquiry_id)
                    inquiries_list.append(inquiry)
            
            # Apply status filter if provided
            if status:
                inquiries_list = [i for i in inquiries_list if i.get("status") == status]
            
            # Apply property_id filter if provided
            if property_id:
                inquiries_list = [i for i in inquiries_list if i.get("property_id") == property_id]
            
            # Apply limit
            if limit:
                inquiries_list = inquiries_list[:limit]
                
        except Exception as e:
            print(f"[AGENT] Error with complex inquiry query, using simple approach: {e}")
            # Fallback to simple property-based query
            if property_ids:
                filters = {"property_id": {"in": property_ids}}
                if property_id:
                    filters["property_id"] = property_id
                if status:
                    filters["status"] = status
                inquiries = await db.select("inquiries", filters=filters, limit=limit)
                inquiries_list = inquiries or []
            else:
                inquiries_list = []
        
        # Enhance inquiries with property and user details
        enhanced_inquiries = []
        for inquiry in inquiries_list:
            prop_id = inquiry.get("property_id")
            user_id_inquiry = inquiry.get("user_id")
            
            # Get property details
            property_data = await db.select("properties", filters={"id": prop_id})
            property_info = property_data[0] if property_data else {}
            
            # Get user details from users table if user_id exists
            user_info = {}
            if user_id_inquiry:
                try:
                    user_data = await db.select("users", filters={"id": user_id_inquiry})
                    if user_data:
                        user_info = user_data[0]
                except Exception as user_error:
                    print(f"[AGENT] Error fetching user details: {user_error}")
            
            # Always include customer details from inquiry fields (name, email, phone)
            # These are the primary customer contact details
            customer_details = {
                "name": inquiry.get("name", ""),
                "email": inquiry.get("email", ""),
                "phone": inquiry.get("phone", ""),
                "first_name": user_info.get("first_name", inquiry.get("name", "").split()[0] if inquiry.get("name") else ""),
                "last_name": user_info.get("last_name", " ".join(inquiry.get("name", "").split()[1:]) if inquiry.get("name") and len(inquiry.get("name", "").split()) > 1 else ""),
                "phone_number": user_info.get("phone_number", inquiry.get("phone", "")),
                "user_id": user_id_inquiry
            }
            
            # Merge user info with customer details (user info takes precedence for additional fields)
            if user_info:
                customer_details.update({
                    "id": user_info.get("id"),
                    "user_type": user_info.get("user_type"),
                    "city": user_info.get("city"),
                    "state": user_info.get("state"),
                    "email_verified": user_info.get("email_verified"),
                })
            
            enhanced_inquiry = {
                **inquiry,
                "property": property_info,
                "user": customer_details  # Always include customer details
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

@router.get("/bookings")
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
        
        # Get agent's property IDs - check agent_id, assigned_agent_id, and owner_id
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        properties_owned = await db.select("properties", filters={"owner_id": user_id})
        
        # Combine all lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or []) + (properties_owned or [])
        property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties")
        
        # Build filters - check both property assignments AND direct agent assignments in bookings table
        # According to schema: bookings table has agent_id field
        booking_filters = []
        
        # Bookings for agent's assigned properties
        if property_ids:
            booking_filters.append({"property_id": {"in": property_ids}})
        
        # Bookings directly assigned to this agent (from bookings.agent_id)
        booking_filters.append({"agent_id": user_id})
        
        # Combine filters with OR logic
        if len(booking_filters) > 1:
            # Use OR filter if we have multiple conditions
            filters = {"or": booking_filters}
        elif len(booking_filters) == 1:
            filters = booking_filters[0]
        else:
            return {"success": True, "bookings": [], "total": 0}
        
        # Apply additional filters
        if property_id:
            if isinstance(filters, dict) and "or" in filters:
                filters["and"] = [{"property_id": property_id}]
            else:
                filters["property_id"] = property_id
        if status:
            if isinstance(filters, dict) and "or" in filters:
                if "and" not in filters:
                    filters["and"] = []
                filters["and"].append({"status": status})
            else:
                filters["status"] = status
        
        # Get bookings - try with OR filter first, fallback to separate queries
        try:
            if property_ids:
                # Get bookings by property
                bookings_by_property = await db.select("bookings", filters={"property_id": {"in": property_ids}}, limit=limit)
            else:
                bookings_by_property = []
            
            # Get bookings by direct agent assignment
            bookings_by_agent = await db.select("bookings", filters={"agent_id": user_id}, limit=limit)
            
            # Combine and deduplicate
            all_bookings = (bookings_by_property or []) + (bookings_by_agent or [])
            seen_ids = set()
            bookings_list = []
            for booking in all_bookings:
                booking_id = booking.get("id")
                if booking_id and booking_id not in seen_ids:
                    seen_ids.add(booking_id)
                    bookings_list.append(booking)
            
            # Apply status filter if provided
            if status:
                bookings_list = [b for b in bookings_list if b.get("status") == status]
            
            # Apply property_id filter if provided
            if property_id:
                bookings_list = [b for b in bookings_list if b.get("property_id") == property_id]
            
            # Apply limit
            if limit:
                bookings_list = bookings_list[:limit]
                
        except Exception as e:
            print(f"[AGENT] Error with complex booking query, using simple approach: {e}")
            # Fallback to simple property-based query
            if property_ids:
                filters = {"property_id": {"in": property_ids}}
                if property_id:
                    filters["property_id"] = property_id
                if status:
                    filters["status"] = status
                bookings = await db.select("bookings", filters=filters, limit=limit)
                bookings_list = bookings or []
            else:
                bookings_list = []
        
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
                print(f"[AGENT] Skipping booking for sold property: {prop_id}")
                continue
            
            # Get user details
            user_info = {}
            if user_id_booking:
                user_data = await db.select("users", filters={"id": user_id_booking})
                user_info = user_data[0] if user_data else {}
            
            # Include customer information from booking fields if user not found
            # This handles cases where booking was made by non-registered users
            customer_info = {
                "name": booking.get("name") or f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip() or "Guest",
                "email": booking.get("email") or user_info.get("email") or "N/A",
                "phone": booking.get("phone") or user_info.get("phone_number") or "N/A",
                "user_id": user_id_booking,
                "user_type": user_info.get("user_type") if user_info else None
            }
            
            enhanced_booking = {
                **booking,
                "property": property_info,
                "user": user_info,
                "customer": customer_info  # Add clear customer info
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

@router.get("/properties")
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
        
        # Get agent's properties - check:
        # 1. agent_id - legacy field for assignment
        # 2. assigned_agent_id - current field for assignment  
        # 3. owner_id - properties owned/created by the agent
        # Show all properties (not just verified) so agent can see pending/active properties
        properties_agent_id = await db.select("properties", filters={"agent_id": user_id})
        properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id})
        properties_owned = await db.select("properties", filters={"owner_id": user_id})  # Show all owned properties
        
        # Combine all lists and remove duplicates
        all_properties = (properties_agent_id or []) + (properties_assigned_id or []) + (properties_owned or [])
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

@router.get("/property-assignments/{notification_id}")
async def get_property_assignment_details(
    notification_id: str, 
    request: Request,
    token: Optional[str] = Query(None)
):
    """Get details of a specific property assignment notification (token-based, no login required)"""
    try:
        # Get notification details
        notifications = await db.select("agent_property_notifications", filters={"id": notification_id})
        if not notifications:
            raise HTTPException(status_code=404, detail="Assignment notification not found")
        
        notification = notifications[0]
        
        # Verify secure token (allows access without login)
        if token:
            # Token-based authentication (from email link)
            stored_token = notification.get("secure_token")
            if not stored_token or stored_token != token:
                raise HTTPException(status_code=403, detail="Invalid or expired token")
        else:
            # Fall back to regular authentication (if agent is logged in)
            claims = get_current_user_claims(request)
            if not claims:
                raise HTTPException(status_code=401, detail="Authentication required. Please use the link from your email.")
            
            user_id = claims.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid authentication")
            
            # Verify this notification is for the current agent
            if notification.get("agent_id") != user_id:
                raise HTTPException(status_code=403, detail="You don't have permission to view this assignment")
        
        # Get property details
        property_id = notification.get("property_id")
        properties = await db.select("properties", filters={"id": property_id})
        
        return {
            "success": True,
            "notification": notification,
            "property": properties[0] if properties else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Error fetching assignment details: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/property-assignments/{notification_id}/accept")
async def accept_property_assignment(
    notification_id: str,
    request: Request,
    token: Optional[str] = Query(None)
):
    """Accept a property assignment (token-based, no login required)"""
    try:
        # Get notification to extract agent_id
        notifications = await db.select("agent_property_notifications", filters={"id": notification_id})
        if not notifications:
            raise HTTPException(status_code=404, detail="Assignment notification not found")
        
        notification = notifications[0]
        agent_id = notification.get("agent_id")
        
        # Verify secure token (allows access without login)
        if token:
            # Token-based authentication (from email link)
            stored_token = notification.get("secure_token")
            if not stored_token or stored_token != token:
                raise HTTPException(status_code=403, detail="Invalid or expired token. Please use the link from your email.")
        else:
            # Fall back to regular authentication (if agent is logged in)
            claims = get_current_user_claims(request)
            if not claims:
                raise HTTPException(status_code=401, detail="Authentication required. Please use the link from your email.")
            
            user_id = claims.get("sub")
            if not user_id or user_id != agent_id:
                raise HTTPException(status_code=403, detail="You don't have permission to accept this assignment")
        
        print(f"[AGENT] Agent {agent_id} accepting assignment {notification_id}")
        
        # Call the sequential notification service to handle acceptance
        from ..services.sequential_agent_notification import SequentialAgentNotificationService
        result = await SequentialAgentNotificationService.accept_assignment(notification_id, agent_id)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Error accepting assignment: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/property-assignments/{notification_id}/reject")
async def reject_property_assignment(
    notification_id: str,
    request: Request,
    token: Optional[str] = Query(None)
):
    """Reject a property assignment (token-based, no login required)"""
    try:
        # Get notification to extract agent_id
        notifications = await db.select("agent_property_notifications", filters={"id": notification_id})
        if not notifications:
            raise HTTPException(status_code=404, detail="Assignment notification not found")
        
        notification = notifications[0]
        agent_id = notification.get("agent_id")
        
        # Verify secure token (allows access without login)
        if token:
            # Token-based authentication (from email link)
            stored_token = notification.get("secure_token")
            if not stored_token or stored_token != token:
                raise HTTPException(status_code=403, detail="Invalid or expired token. Please use the link from your email.")
        else:
            # Fall back to regular authentication (if agent is logged in)
            claims = get_current_user_claims(request)
            if not claims:
                raise HTTPException(status_code=401, detail="Authentication required. Please use the link from your email.")
            
            user_id = claims.get("sub")
            if not user_id or user_id != agent_id:
                raise HTTPException(status_code=403, detail="You don't have permission to reject this assignment")
        
        payload = await request.json()
        reason = payload.get("reason", "No reason provided")
        
        print(f"[AGENT] Agent {agent_id} rejecting assignment {notification_id}, reason: {reason}")
        
        # Call the sequential notification service to handle rejection
        from ..services.sequential_agent_notification import SequentialAgentNotificationService
        result = await SequentialAgentNotificationService.reject_assignment(notification_id, agent_id, reason)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT] Error rejecting assignment: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending-assignments")
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
