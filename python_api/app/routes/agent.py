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
        print(f"[AGENT] Agent ID (user_id): {user_id}")
        
        # Get agent's ASSIGNED properties only (not properties they just own)
        # Agents should only see properties where they are assigned as the agent
        # 1. agent_id - legacy assignment field
        # 2. assigned_agent_id - current assignment field
        # NOTE: We do NOT include owner_id - agents should only see assigned properties
        print(f"[AGENT] Querying ASSIGNED properties only for stats")
        print(f"[AGENT] OR conditions: agent_id={user_id} OR assigned_agent_id={user_id}")
        import asyncio
        try:
            properties_list = await asyncio.wait_for(
                db.select(
                    "properties", 
                    filters={
                        "or": [
                            {"agent_id": user_id},
                            {"assigned_agent_id": user_id}
                        ]
                    },
                    limit=100,  # Reduced from 1000 to 100 for performance
                    order_by="created_at",
                    ascending=False
                ),
                timeout=2.0  # 2 second timeout
            )
            properties_list = properties_list or []
            print(f"[AGENT] OR query returned {len(properties_list)} ASSIGNED properties for stats")
            
            # Log sample property IDs for debugging
            if properties_list:
                sample_ids = [p.get("id", "N/A")[:8] for p in properties_list[:3]]
                print(f"[AGENT] Sample property IDs: {sample_ids}")
                # Log assignment details for first property
                first_prop = properties_list[0]
                print(f"[AGENT] First property assignment - agent_id: {first_prop.get('agent_id')}, assigned_agent_id: {first_prop.get('assigned_agent_id')}")
        except asyncio.TimeoutError:
            print(f"[AGENT] Properties query timeout for user: {user_id}")
            properties_list = []
        except Exception as or_error:
            print(f"[AGENT] OR query failed, using separate queries: {or_error}")
            # Fallback to separate queries - ONLY assigned properties
            try:
                properties_agent_id, properties_assigned_id = await asyncio.wait_for(
                    asyncio.gather(
                        db.select("properties", filters={"agent_id": user_id}, limit=100),
                        db.select("properties", filters={"assigned_agent_id": user_id}, limit=100),
                        return_exceptions=True
                    ),
                    timeout=2.0
                )
                if isinstance(properties_agent_id, Exception):
                    properties_agent_id = []
                if isinstance(properties_assigned_id, Exception):
                    properties_assigned_id = []
            except asyncio.TimeoutError:
                print(f"[AGENT] Fallback queries timeout for user: {user_id}")
                properties_agent_id = []
                properties_assigned_id = []
            
            # Combine only assigned properties (NOT owner_id)
            all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
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
                inquiries_by_property = await asyncio.wait_for(
                    db.select("inquiries", filters={"property_id": {"in": property_ids}}, limit=200, order_by="created_at", ascending=False),
                    timeout=2.0
                )
            else:
                inquiries_by_property = []
            
            # Get inquiries by direct agent assignment (from inquiries.assigned_agent_id) with timeout
            try:
                inquiries_by_agent = await asyncio.wait_for(
                    db.select("inquiries", filters={"assigned_agent_id": user_id}, limit=200, order_by="created_at", ascending=False),
                    timeout=1.5  # 1.5 second timeout for faster response
                )
            except asyncio.TimeoutError:
                print(f"[AGENT] Inquiries by agent query timeout")
                inquiries_by_agent = []
            except Exception as agent_inq_error:
                print(f"[AGENT] Error fetching inquiries by agent: {agent_inq_error}")
                inquiries_by_agent = []
            
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
            print(f"[AGENT] Full traceback:")
            print(traceback.format_exc())
            # Fallback to property-based only
            try:
                if property_ids and len(property_ids) > 0:
                    inquiries = await db.select("inquiries", filters={"property_id": {"in": property_ids}})
                    inquiries_list = inquiries or []
                    total_inquiries = len(inquiries_list)
                    new_inquiries = len([i for i in inquiries_list if i.get("status") == "new"])
                    responded_inquiries = len([i for i in inquiries_list if i.get("status") == "responded"])
                else:
                    inquiries_list = []
                    total_inquiries = 0
                    new_inquiries = 0
                    responded_inquiries = 0
            except Exception as fallback_error:
                print(f"[AGENT] Fallback inquiry query also failed: {fallback_error}")
                inquiries_list = []
                total_inquiries = 0
                new_inquiries = 0
                responded_inquiries = 0
        
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
            print(f"[AGENT] Full traceback:")
            print(traceback.format_exc())
            # Fallback to property-based only
            try:
                if property_ids and len(property_ids) > 0:
                    import asyncio
                    bookings = await asyncio.wait_for(
                        db.select("bookings", filters={"property_id": {"in": property_ids}}, limit=200, order_by="created_at", ascending=False),
                        timeout=2.0
                    )
                    bookings_list = bookings or []
                    total_bookings = len(bookings_list)
                    pending_bookings = len([b for b in bookings_list if b.get("status") == "pending"])
                    confirmed_bookings = len([b for b in bookings_list if b.get("status") == "confirmed"])
                    completed_bookings = len([b for b in bookings_list if b.get("status") == "completed"])
                else:
                    bookings_list = []
                    total_bookings = 0
                    pending_bookings = 0
                    confirmed_bookings = 0
                    completed_bookings = 0
            except Exception as fallback_error:
                print(f"[AGENT] Fallback booking query also failed: {fallback_error}")
                bookings_list = []
                total_bookings = 0
                pending_bookings = 0
                confirmed_bookings = 0
                completed_bookings = 0
        
        # Calculate response rate
        response_rate = 0
        if total_inquiries > 0:
            response_rate = round((responded_inquiries / total_inquiries) * 100, 2)
        
        # Calculate conversion rate
        conversion_rate = 0
        if total_inquiries > 0:
            conversion_rate = round((total_bookings / total_inquiries) * 100, 2)
        
        # Calculate earnings and commissions from bookings
        total_earnings = 0
        monthly_commission = 0
        try:
            # Get commissions for this agent
            commissions = await db.select("commissions", filters={"agent_id": user_id}) or []
            total_earnings = sum(c.get('amount', 0) or 0 for c in commissions)
            
            # Calculate monthly commission (last 30 days)
            thirty_days_ago = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=30)).isoformat()
            monthly_commissions = [
                c for c in commissions 
                if c.get('created_at') and c.get('created_at') >= thirty_days_ago
            ]
            monthly_commission = sum(c.get('amount', 0) or 0 for c in monthly_commissions)
        except Exception as e:
            print(f"[AGENT] Error calculating earnings: {e}")
            # Fallback: estimate from bookings
            total_earnings = confirmed_bookings * 15000  # Estimate 15k per booking
            monthly_commission = confirmed_bookings * 15000 / 12
        
        # Calculate customer rating (if available)
        customer_rating = 4.8  # Default, can be calculated from reviews if available
        
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
            "conversion_rate": conversion_rate,
            "total_earnings": total_earnings,
            "monthly_commission": monthly_commission,
            "customer_rating": customer_rating,
            "avg_response_time": "< 2 hours"  # Can be calculated from inquiry response times
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
        print(f"[AGENT] Agent ID (user_id): {user_id}")
        
        # Get agent's property IDs using OR query
        # Check all possible fields where agent might be assigned
        print(f"[AGENT] Querying properties for inquiries with OR filter")
        # Get only ASSIGNED properties (not properties they just own)
        print(f"[AGENT] OR conditions: agent_id={user_id} OR assigned_agent_id={user_id}")
        try:
            all_properties = await db.select(
                "properties", 
                filters={
                    "or": [
                        {"agent_id": user_id},
                        {"assigned_agent_id": user_id}
                    ]
                },
                limit=100  # Reduced from 1000 to 100 for performance
            )
            all_properties = all_properties or []
            property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
            print(f"[AGENT] OR query returned {len(property_ids)} ASSIGNED property IDs for inquiries")
            if property_ids:
                print(f"[AGENT] Sample property IDs: {[pid[:8] for pid in property_ids[:3]]}")
        except Exception as or_error:
            print(f"[AGENT] OR query failed, using separate queries: {or_error}")
            # Fallback to separate queries - ONLY assigned properties
            properties_agent_id = await db.select("properties", filters={"agent_id": user_id}, limit=100)
            properties_assigned_id = await db.select("properties", filters={"assigned_agent_id": user_id}, limit=100)
            
            # Combine only assigned properties (NOT owner_id)
            all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
            property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties for inquiries")
        if len(property_ids) > 0:
            print(f"[AGENT] Sample property IDs: {[pid[:8] if pid else 'N/A' for pid in property_ids[:3]]}")
        
        # Build filters - check both property assignments AND direct agent assignments in inquiries table
        # According to schema: inquiries table has assigned_agent_id field
        inquiries_list = []
        try:
            # Get inquiries by property - use individual queries if "in" filter fails
            inquiries_by_property = []
            if property_ids and len(property_ids) > 0:
                print(f"[AGENT] Fetching inquiries for {len(property_ids)} properties")
                try:
                    inquiries_by_property = await asyncio.wait_for(
                        db.select("inquiries", filters={"property_id": {"in": property_ids}}, limit=min(limit or 100, 200), order_by="created_at", ascending=False),
                        timeout=1.5  # 1.5 second timeout for faster response
                    )
                    print(f"[AGENT] Found {len(inquiries_by_property or [])} inquiries by property")
                except asyncio.TimeoutError:
                    print(f"[AGENT] Inquiries query timeout")
                    inquiries_by_property = []
                except Exception as in_error:
                    print(f"[AGENT] 'in' filter failed for inquiries: {in_error}")
                    inquiries_by_property = []
                    # Deduplicate
                    seen_ids = set()
                    unique_inquiries = []
                    for inquiry in inquiries_by_property:
                        inquiry_id = inquiry.get("id")
                        if inquiry_id and inquiry_id not in seen_ids:
                            seen_ids.add(inquiry_id)
                            unique_inquiries.append(inquiry)
                    inquiries_by_property = unique_inquiries
                    print(f"[AGENT] Found {len(inquiries_by_property)} inquiries by property (fallback method)")
            else:
                print(f"[AGENT] No property IDs, skipping property-based inquiry query")
            
            # Get inquiries by direct agent assignment (from inquiries.assigned_agent_id)
            # Also check if there's an agent_id field in inquiries table
            print(f"[AGENT] Fetching inquiries assigned directly to agent: {user_id}")
            import asyncio
            try:
                inquiries_by_agent = await asyncio.wait_for(
                    db.select("inquiries", filters={"assigned_agent_id": user_id}, limit=min(limit or 100, 200), order_by="created_at", ascending=False),
                    timeout=1.5  # 1.5 second timeout for faster response
                )
            except asyncio.TimeoutError:
                print(f"[AGENT] Inquiries by agent query timeout")
                inquiries_by_agent = []
            except Exception as agent_inq_error:
                print(f"[AGENT] Error fetching inquiries by agent: {agent_inq_error}")
                inquiries_by_agent = []
            print(f"[AGENT] Found {len(inquiries_by_agent or [])} inquiries by assigned_agent_id")
            
            # Also check agent_id field if it exists (for backward compatibility)
            try:
                inquiries_by_agent_id = await db.select("inquiries", filters={"agent_id": user_id}, limit=limit or 100)
                if inquiries_by_agent_id:
                    print(f"[AGENT] Found {len(inquiries_by_agent_id)} inquiries by agent_id")
                    # Merge with existing inquiries_by_agent
                    all_agent_inquiries = (inquiries_by_agent or []) + inquiries_by_agent_id
                    seen_ids = set()
                    inquiries_by_agent = []
                    for inquiry in all_agent_inquiries:
                        inquiry_id = inquiry.get("id")
                        if inquiry_id and inquiry_id not in seen_ids:
                            seen_ids.add(inquiry_id)
                            inquiries_by_agent.append(inquiry)
                    print(f"[AGENT] Total unique inquiries by agent assignment: {len(inquiries_by_agent)}")
            except Exception as agent_id_error:
                print(f"[AGENT] Note: agent_id field may not exist in inquiries table: {agent_id_error}")
            
            # Combine and deduplicate
            all_inquiries = (inquiries_by_property or []) + (inquiries_by_agent or [])
            seen_ids = set()
            for inquiry in all_inquiries:
                inquiry_id = inquiry.get("id")
                if inquiry_id and inquiry_id not in seen_ids:
                    seen_ids.add(inquiry_id)
                    inquiries_list.append(inquiry)
            
            print(f"[AGENT] Total unique inquiries after deduplication: {len(inquiries_list)}")
            
            # Apply status filter if provided
            if status:
                before_status = len(inquiries_list)
                inquiries_list = [i for i in inquiries_list if i.get("status") == status]
                print(f"[AGENT] After status filter ({status}): {len(inquiries_list)} (was {before_status})")
            
            # Apply property_id filter if provided
            if property_id:
                before_prop = len(inquiries_list)
                inquiries_list = [i for i in inquiries_list if i.get("property_id") == property_id]
                print(f"[AGENT] After property_id filter: {len(inquiries_list)} (was {before_prop})")
            
            # Apply limit
            if limit and limit > 0:
                before_limit = len(inquiries_list)
                inquiries_list = inquiries_list[:limit]
                print(f"[AGENT] After limit ({limit}): {len(inquiries_list)} (was {before_limit})")
                
        except Exception as e:
            print(f"[AGENT] Error with complex inquiry query: {e}")
            print(f"[AGENT] Full traceback:")
            import traceback
            print(traceback.format_exc())
            # Fallback to simple property-based query
            try:
                if property_ids and len(property_ids) > 0:
                    filters = {"property_id": {"in": property_ids}}
                    if property_id:
                        filters["property_id"] = property_id
                    if status:
                        filters["status"] = status
                    inquiries = await db.select("inquiries", filters=filters, limit=limit or 100)
                    inquiries_list = inquiries or []
                    print(f"[AGENT] Fallback query returned {len(inquiries_list)} inquiries")
                else:
                    # Try direct agent assignment only
                    inquiries = await db.select("inquiries", filters={"assigned_agent_id": user_id}, limit=limit or 100)
                    inquiries_list = inquiries or []
                    print(f"[AGENT] Fallback direct assignment query returned {len(inquiries_list)} inquiries")
            except Exception as fallback_error:
                print(f"[AGENT] Fallback query also failed: {fallback_error}")
                inquiries_list = []
        
        # Enhance inquiries with property and user details - BATCH FETCH to avoid N+1 queries
        enhanced_inquiries = []
        
        # Collect all unique IDs for batch fetching
        property_ids = list(set([inquiry.get("property_id") for inquiry in inquiries_list if inquiry.get("property_id")]))
        user_ids = list(set([inquiry.get("user_id") for inquiry in inquiries_list if inquiry.get("user_id")]))
        
        # Batch fetch all properties and users in parallel with timeout
        import asyncio
        properties_map = {}
        users_map = {}
        
        try:
            tasks = []
            if property_ids:
                tasks.append(db.select("properties", filters={"id": {"in": property_ids}}, limit=len(property_ids)))
            if user_ids:
                tasks.append(db.select("users", filters={"id": {"in": user_ids}}, limit=len(user_ids)))
            
            if tasks:
                results = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=1.5  # 1.5 second timeout for faster response
                )
                
                if property_ids:
                    properties_all = results[0] if not isinstance(results[0], Exception) else []
                    properties_map = {p.get("id"): p for p in properties_all if p.get("id")}
                
                if user_ids:
                    users_all = results[1] if not isinstance(results[1], Exception) else []
                    users_map = {u.get("id"): u for u in users_all if u.get("id")}
        except asyncio.TimeoutError:
            print(f"[AGENT] Batch fetch timeout for inquiries enhancement")
        except Exception as batch_error:
            print(f"[AGENT] Batch fetch error: {batch_error}")
        
        # Now enhance inquiries using the batch-fetched data
        for inquiry in inquiries_list:
            prop_id = inquiry.get("property_id")
            user_id_inquiry = inquiry.get("user_id")
            
            # Get property details from map
            property_info = properties_map.get(prop_id, {})
            
            # Get user details from map
            user_info = users_map.get(user_id_inquiry, {}) if user_id_inquiry else {}
            
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
        
        print(f"[AGENT] Returning {len(enhanced_inquiries)} inquiries")
        print(f"[AGENT] Inquiry breakdown - by property: {len(inquiries_by_property or [])}, by agent assignment: {len(inquiries_by_agent or [])}")
        
        # Ensure response format matches frontend expectations
        response = {
            "success": True, 
            "inquiries": enhanced_inquiries, 
            "total": len(enhanced_inquiries)
        }
        
        print(f"[AGENT] Final response - success: {response['success']}, total: {response['total']}, inquiries array length: {len(response['inquiries'])}")
        
        return response
        
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
        print(f"[AGENT] Agent ID (user_id): {user_id}")
        
        # Get agent's property IDs using OR query
        # Check all possible fields where agent might be assigned
        print(f"[AGENT] Querying properties for bookings with OR filter")
        # Get only ASSIGNED properties (not properties they just own)
        print(f"[AGENT] OR conditions: agent_id={user_id} OR assigned_agent_id={user_id}")
        import asyncio
        try:
            all_properties = await asyncio.wait_for(
                db.select(
                    "properties", 
                    filters={
                        "or": [
                            {"agent_id": user_id},
                            {"assigned_agent_id": user_id}
                        ]
                    },
                    limit=100,  # Reduced from 1000 to 100 for performance
                    order_by="created_at",
                    ascending=False
                ),
                timeout=2.0  # 2 second timeout
            )
            all_properties = all_properties or []
            property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
            print(f"[AGENT] OR query returned {len(property_ids)} ASSIGNED property IDs for bookings")
            if property_ids:
                print(f"[AGENT] Sample property IDs: {[pid[:8] for pid in property_ids[:3]]}")
        except asyncio.TimeoutError:
            print(f"[AGENT] Properties query timeout for bookings")
            property_ids = []
        except Exception as or_error:
            print(f"[AGENT] OR query failed, using separate queries: {or_error}")
            # Fallback to separate queries - ONLY assigned properties with timeout
            try:
                properties_agent_id, properties_assigned_id = await asyncio.wait_for(
                    asyncio.gather(
                        db.select("properties", filters={"agent_id": user_id}, limit=100),
                        db.select("properties", filters={"assigned_agent_id": user_id}, limit=100),
                        return_exceptions=True
                    ),
                    timeout=2.0
                )
                if isinstance(properties_agent_id, Exception):
                    properties_agent_id = []
                if isinstance(properties_assigned_id, Exception):
                    properties_assigned_id = []
            except asyncio.TimeoutError:
                print(f"[AGENT] Fallback queries timeout for bookings")
                properties_agent_id = []
                properties_assigned_id = []
            
            # Combine only assigned properties (NOT owner_id)
            all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
            property_ids = list(set([p.get("id") for p in all_properties if p.get("id")]))
        
        print(f"[AGENT] Found {len(property_ids)} assigned properties for bookings")
        if len(property_ids) > 0:
            print(f"[AGENT] Sample property IDs: {[pid[:8] if pid else 'N/A' for pid in property_ids[:3]]}")
        
        # Build filters - check both property assignments AND direct agent assignments in bookings table
        # According to schema: bookings table has agent_id field
        booking_filters = []
        
        # Bookings for agent's assigned properties with timeout
        bookings_by_property = []
        if property_ids:
            try:
                bookings_by_property = await asyncio.wait_for(
                    db.select("bookings", filters={"property_id": {"in": property_ids}}, limit=min(limit or 100, 200), order_by="created_at", ascending=False),
                    timeout=1.5  # 1.5 second timeout for faster response
                )
            except asyncio.TimeoutError:
                print(f"[AGENT] Bookings query timeout")
                bookings_by_property = []
            except Exception as in_error:
                print(f"[AGENT] 'in' filter failed for bookings: {in_error}")
                bookings_by_property = []
                # Deduplicate
                seen_ids = set()
                unique_bookings = []
                for booking in bookings_by_property:
                    booking_id = booking.get("id")
                    if booking_id and booking_id not in seen_ids:
                        seen_ids.add(booking_id)
                        unique_bookings.append(booking)
                bookings_by_property = unique_bookings
        
        # Bookings directly assigned to this agent (from bookings.agent_id) with timeout
        print(f"[AGENT] Fetching bookings assigned directly to agent: {user_id}")
        try:
            bookings_by_agent = await asyncio.wait_for(
                db.select("bookings", filters={"agent_id": user_id}, limit=min(limit or 100, 200), order_by="created_at", ascending=False),
                timeout=2.0  # 2 second timeout
            )
        except asyncio.TimeoutError:
            print(f"[AGENT] Bookings by agent query timeout")
            bookings_by_agent = []
        except Exception as agent_book_error:
            print(f"[AGENT] Error fetching bookings by agent: {agent_book_error}")
            bookings_by_agent = []
        print(f"[AGENT] Found {len(bookings_by_agent or [])} bookings by agent_id")
        
        # Log sample booking IDs for debugging
        if bookings_by_agent:
            sample_booking_ids = [b.get("id", "N/A")[:8] for b in bookings_by_agent[:3]]
            print(f"[AGENT] Sample booking IDs: {sample_booking_ids}")
        
        # Combine bookings from properties and direct agent assignment
        all_bookings = (bookings_by_property or []) + (bookings_by_agent or [])
        seen_ids = set()
        bookings_list = []
        for booking in all_bookings:
            booking_id = booking.get("id")
            if booking_id and booking_id not in seen_ids:
                seen_ids.add(booking_id)
                bookings_list.append(booking)
        
        print(f"[AGENT] Combined {len(bookings_list)} total bookings (property-based: {len(bookings_by_property or [])}, agent-based: {len(bookings_by_agent or [])})")
        
        # Apply additional filters
        if property_id:
            bookings_list = [b for b in bookings_list if b.get("property_id") == property_id]
        if status:
            bookings_list = [b for b in bookings_list if b.get("status") == status]
        
        # Bookings are already fetched and filtered above, now enhance with property and user details
        try:
            # Apply limit if provided
            if limit and limit > 0:
                before_limit = len(bookings_list)
                bookings_list = bookings_list[:limit]
                print(f"[AGENT] After limit ({limit}): {len(bookings_list)} (was {before_limit})")
                
        except Exception as e:
            print(f"[AGENT] Error with complex booking query: {e}")
            print(f"[AGENT] Full traceback:")
            import traceback
            print(traceback.format_exc())
            # Fallback to simple property-based query
            try:
                if property_ids and len(property_ids) > 0:
                    filters = {"property_id": {"in": property_ids}}
                    if property_id:
                        filters["property_id"] = property_id
                    if status:
                        filters["status"] = status
                    bookings = await db.select("bookings", filters=filters, limit=limit or 100)
                    bookings_list = bookings or []
                    print(f"[AGENT] Fallback query returned {len(bookings_list)} bookings")
                else:
                    # Try direct agent assignment only
                    bookings = await db.select("bookings", filters={"agent_id": user_id}, limit=limit or 100)
                    bookings_list = bookings or []
                    print(f"[AGENT] Fallback direct assignment query returned {len(bookings_list)} bookings")
            except Exception as fallback_error:
                print(f"[AGENT] Fallback query also failed: {fallback_error}")
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
        
        print(f"[AGENT] Returning {len(enhanced_bookings)} bookings")
        print(f"[AGENT] Booking breakdown - by property: {len(bookings_by_property or [])}, by agent assignment: {len(bookings_by_agent or [])}")
        
        # Ensure response format matches frontend expectations
        response = {
            "success": True, 
            "bookings": enhanced_bookings, 
            "total": len(enhanced_bookings)
        }
        
        print(f"[AGENT] Final response - success: {response['success']}, total: {response['total']}, bookings array length: {len(response['bookings'])}")
        
        return response
        
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
        print(f"[AGENT] Agent ID (user_id): {user_id}")
        
        # Get agent's ASSIGNED properties only (not properties they just own)
        # Agents should only see properties where they are assigned as the agent
        # 1. agent_id - legacy field for assignment
        # 2. assigned_agent_id - current field for assignment
        # NOTE: We do NOT include owner_id - agents should only see assigned properties, not properties they own
        print(f"[AGENT] Querying ASSIGNED properties only: agent_id={user_id} OR assigned_agent_id={user_id}")
        
        import asyncio
        try:
            # Use OR query to get all assigned properties in one call with timeout
            unique_properties = await asyncio.wait_for(
                db.select(
                    "properties", 
                    filters={
                        "or": [
                            {"agent_id": user_id},
                            {"assigned_agent_id": user_id}
                        ]
                    },
                    limit=min(limit or 100, 200),  # Reduced limit for performance
                    offset=offset,
                    order_by="created_at",
                    ascending=False
                ),
                timeout=2.0  # 2 second timeout
            )
            unique_properties = unique_properties or []
            print(f"[AGENT] OR query returned {len(unique_properties)} ASSIGNED properties")
            
            # Log assignment breakdown for debugging
            if unique_properties:
                agent_id_count = len([p for p in unique_properties if p.get("agent_id") == user_id])
                assigned_agent_id_count = len([p for p in unique_properties if p.get("assigned_agent_id") == user_id])
                print(f"[AGENT] Property assignment breakdown - agent_id: {agent_id_count}, assigned_agent_id: {assigned_agent_id_count}")
                sample_ids = [p.get("id", "N/A")[:8] for p in unique_properties[:3]]
                print(f"[AGENT] Sample property IDs: {sample_ids}")
        except asyncio.TimeoutError:
            print(f"[AGENT] Properties query timeout for user: {user_id}")
            unique_properties = []
        except Exception as or_error:
            print(f"[AGENT] OR query failed, falling back to separate queries: {or_error}")
            # Fallback to separate queries - ONLY assigned properties with timeout
            try:
                properties_agent_id, properties_assigned_id = await asyncio.wait_for(
                    asyncio.gather(
                        db.select("properties", filters={"agent_id": user_id}, limit=min(limit or 100, 200), offset=offset, order_by="created_at", ascending=False),
                        db.select("properties", filters={"assigned_agent_id": user_id}, limit=min(limit or 100, 200), offset=offset, order_by="created_at", ascending=False),
                        return_exceptions=True
                    ),
                    timeout=2.0
                )
                if isinstance(properties_agent_id, Exception):
                    properties_agent_id = []
                if isinstance(properties_assigned_id, Exception):
                    properties_assigned_id = []
            except asyncio.TimeoutError:
                print(f"[AGENT] Fallback queries timeout for user: {user_id}")
                properties_agent_id = []
                properties_assigned_id = []
            
            print(f"[AGENT] Properties with agent_id: {len(properties_agent_id or [])}")
            print(f"[AGENT] Properties with assigned_agent_id: {len(properties_assigned_id or [])}")
            
            # Combine only assigned properties (NOT owner_id)
            all_properties = (properties_agent_id or []) + (properties_assigned_id or [])
            unique_properties = []
            seen_ids = set()
            
            for prop in all_properties:
                prop_id = prop.get("id")
                if prop_id and prop_id not in seen_ids:
                    seen_ids.add(prop_id)
                    unique_properties.append(prop)
        
        print(f"[AGENT] Found {len(unique_properties)} total unique assigned properties")
        if len(unique_properties) > 0:
            print(f"[AGENT] Sample property IDs: {[p.get('id')[:8] if p.get('id') else 'N/A' for p in unique_properties[:3]]}")
            # Debug: Show assignment details for first property
            first_prop = unique_properties[0]
            print(f"[AGENT] First property - agent_id: {first_prop.get('agent_id')}, assigned_agent_id: {first_prop.get('assigned_agent_id')}, owner_id: {first_prop.get('owner_id')}")
        
        # Apply status filter if provided
        if status:
            unique_properties = [p for p in unique_properties if p.get("status") == status]
        
        # Apply limit and offset
        # If limit is very high (>= 1000), return all properties without pagination
        if limit and limit >= 1000:
            paginated_properties = unique_properties
            print(f"[AGENT] Returning all {len(paginated_properties)} properties (limit >= 1000, no pagination)")
        else:
            start_idx = offset or 0
            end_idx = start_idx + (limit or 20)
            paginated_properties = unique_properties[start_idx:end_idx]
            print(f"[AGENT] Returning {len(paginated_properties)} properties (paginated from {len(unique_properties)} total)")
        if unique_properties:
            agent_id_count = len([p for p in unique_properties if p.get("agent_id") == user_id])
            assigned_agent_id_count = len([p for p in unique_properties if p.get("assigned_agent_id") == user_id])
            print(f"[AGENT] Property assignment breakdown - agent_id: {agent_id_count}, assigned_agent_id: {assigned_agent_id_count}")
        
        response = {"success": True, "properties": paginated_properties, "total": len(unique_properties)}
        print(f"[AGENT] Final response - success: {response['success']}, total: {response['total']}, properties array length: {len(response['properties'])}")
        
        return response
        
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
