from fastapi import APIRouter, HTTPException, Query, Depends, Request
from typing import Optional, Any
from ..db.supabase_client import db
from ..core.security import require_admin_or_api_key, require_api_key
from ..core.cache import cache
import traceback
import uuid
import datetime as dt
import hashlib
import json
from fastapi import Request

router = APIRouter()


def _format_property_pricing(property_data: dict) -> dict:
    """
    Format property pricing based on pricing_display_mode.
    Returns a dict with display_text and calculation_info.
    Uses Indian numbering system for all prices (e.g., ₹12,34,567).
    """
    pricing_mode = property_data.get('pricing_display_mode', 'fixed')
    listing_type = property_data.get('listing_type', 'SALE')
    
    # Helper function to format with Indian commas and 2 decimal places
    def format_indian(num: float) -> str:
        """Format number with Indian comma style and 2 decimal places (paisa)"""
        if num is None:
            return '0.00'
        # Format with 2 decimal places
        formatted_num = f'{num:.2f}'
        # Split into integer and decimal parts
        parts = formatted_num.split('.')
        integer_part = parts[0]
        decimal_part = parts[1] if len(parts) > 1 else '00'
        
        # Indian numbering: last 3 digits, then groups of 2
        if len(integer_part) <= 3:
            return f'{integer_part}.{decimal_part}'
        
        last_three = integer_part[-3:]
        rest = integer_part[:-3]
        if rest:
            # Group rest by 2 from right
            rest_reversed = rest[::-1]
            rest_grouped = ','.join(rest_reversed[i:i+2] for i in range(0, len(rest_reversed), 2))
            rest_final = rest_grouped[::-1]
            return f'{rest_final},{last_three}.{decimal_part}'
        return f'{last_three}.{decimal_part}'
    
    # For rent properties
    if listing_type == 'RENT':
        monthly_rent = property_data.get('monthly_rent')
        if monthly_rent:
            return {
                'display_text': f'₹{format_indian(monthly_rent)}/month',
                'display_mode': 'fixed',
                'value': monthly_rent,
                'unit': 'month'
            }
        return {
            'display_text': 'Price on request',
            'display_mode': 'fixed',
            'value': None
        }
    
    # For sale properties
    if pricing_mode == 'starting_from':
        # New property/apartment: "Starting from ₹X/sqft"
        price_per_unit = property_data.get('starting_price_per_unit')
        unit_type = property_data.get('pricing_unit_type', 'sqft')
        
        if price_per_unit:
            unit_label = 'sqft' if unit_type == 'sqft' else 'sqyd'
            return {
                'display_text': f'Starting from ₹{format_indian(price_per_unit)}/{unit_label}',
                'display_mode': 'starting_from',
                'value': price_per_unit,
                'unit': unit_label,
                'unit_type': unit_type,
                'description': f'Buy any size. Price calculated per {unit_label}.'
            }
        # Fallback to rate_per_sqft if starting_price_per_unit not set
        price_per_unit = property_data.get('rate_per_sqft')
        if price_per_unit:
            return {
                'display_text': f'Starting from ₹{format_indian(price_per_unit)}/sqft',
                'display_mode': 'starting_from',
                'value': price_per_unit,
                'unit': 'sqft',
                'unit_type': 'sqft',
                'description': 'Buy any size. Price calculated per sqft.'
            }
    
    elif pricing_mode == 'per_unit':
        # Lot: "₹X/sqyd - buy 1, 2, 3... sq yards"
        price_per_unit = property_data.get('starting_price_per_unit')
        unit_type = property_data.get('pricing_unit_type', 'sqyd')
        
        if price_per_unit:
            unit_label = 'sqyd' if unit_type == 'sqyd' else 'sqft'
            # Generate example calculations for 1, 2, 3 units
            examples = []
            for qty in [1, 2, 3, 5]:
                total_price = price_per_unit * qty
                examples.append({
                    'quantity': qty,
                    'unit': unit_label,
                    'total_price': total_price,
                    'display': f'{qty} {unit_label} = ₹{format_indian(total_price)}'
                })

            return {
                'display_text': f'₹{format_indian(price_per_unit)}/{unit_label}',
                'display_mode': 'per_unit',
                'value': price_per_unit,
                'unit': unit_label,
                'unit_type': unit_type,
                'description': f'Buy any quantity (1, 2, 3... {unit_label}s). Price calculated per {unit_label}.',
                'examples': examples
            }
        # Fallback to rate_per_sqyd if starting_price_per_unit not set
        price_per_unit = property_data.get('rate_per_sqyd')
        if price_per_unit:
            examples = []
            for qty in [1, 2, 3, 5]:
                total_price = price_per_unit * qty
                examples.append({
                    'quantity': qty,
                    'unit': 'sqyd',
                    'total_price': total_price,
                    'display': f'{qty} sqyd = ₹{format_indian(total_price)}'
                })
            return {
                'display_text': f'₹{format_indian(price_per_unit)}/sqyd',
                'display_mode': 'per_unit',
                'value': price_per_unit,
                'unit': 'sqyd',
                'unit_type': 'sqyd',
                'description': 'Buy any quantity (1, 2, 3... sq yards). Price calculated per sqyd.',
                'examples': examples
            }
    
    # Default: fixed pricing
    price = property_data.get('price')
    if price:
        return {
            'display_text': f'₹{format_indian(price)}',
            'display_mode': 'fixed',
            'value': price
        }
    
    return {
        'display_text': 'Price on request',
        'display_mode': 'fixed',
        'value': None
    }

@router.get("")
@router.get("/")
async def get_properties(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    mandal: Optional[str] = Query(None),
    property_type: Optional[str] = Query(None),
    listing_type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rent: Optional[float] = Query(None),
    max_rent: Optional[float] = Query(None),
    featured: Optional[bool] = Query(None),
    status: Optional[str] = Query("active"),
    commercial_subtype: Optional[str] = Query(None),
    land_type: Optional[str] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    bedrooms: Optional[int] = Query(None),
    bathrooms: Optional[int] = Query(None),
    furnishing_status: Optional[str] = Query(None),
    facing: Optional[str] = Query(None),
    owner_id: Optional[str] = Query(None),
    added_by: Optional[str] = Query(None),
    limit: Optional[int] = Query(50, ge=1, le=1000),  # Default 50 for faster initial load, max 1000 for buyers
    offset: Optional[int] = Query(0, ge=0)
):
    import time
    start_time = time.time()
    
    try:
        print(f"\n[PROPERTIES] GET /properties request received")
        if owner_id:
            print(f"[PROPERTIES] Owner ID query: {owner_id}")
        if added_by:
            print(f"[PROPERTIES] Added by query: {added_by}")

        # Build base filters for server-side query
        # Only show approved (verified=true) and active properties to public
        # Admin endpoints can show all properties via /api/admin/properties
        base_filters = {}
        if status:
            base_filters['status'] = status
        else:
            # Default to active status for public listings
            base_filters['status'] = 'active'
        
        # For public endpoints, only show verified properties
        # This ensures approved properties appear in property list and home page
        base_filters['verified'] = True
        
        if featured is not None:
            base_filters['featured'] = featured
        if owner_id:
            base_filters['owner_id'] = owner_id
            # For owner_id queries, reduce limit to improve performance
            if limit > 100:
                limit = 100
        if added_by:
            base_filters['added_by'] = added_by
            # For added_by queries, reduce limit to improve performance
            if limit > 100:
                limit = 100
        if mandal:
            base_filters['mandal'] = mandal
        if property_type:
            # Handle multiple property types (comma-separated)
            if ',' in property_type:
                # For multiple types, we'll filter after fetching
                property_types = [pt.strip() for pt in property_type.split(',')]
                print(f"[PROPERTIES] Multiple property types requested: {property_types}")
            else:
                base_filters['property_type'] = property_type
        if listing_type:
            base_filters['listing_type'] = listing_type
        if commercial_subtype:
            base_filters['commercial_subtype'] = commercial_subtype
        if land_type:
            base_filters['land_type'] = land_type
        if facing:
            base_filters['facing'] = facing

        # Add simple filters to base_filters for database-level filtering
        if bedrooms is not None:
            base_filters['bedrooms'] = bedrooms
        if bathrooms is not None:
            base_filters['bathrooms'] = bathrooms
        if furnishing_status:
            base_filters['furnishing_status'] = furnishing_status
        if city:
            base_filters['city'] = city
        if state:
            base_filters['state'] = state
        # Note: Price/rent/area range filters will be applied client-side after fetching
        # This is more efficient than complex DB queries for ranges

        print(f"[PROPERTIES] Querying database with filters: {base_filters}, limit={limit}, offset={offset}")

        # Create cache key from filters and pagination (safe serialization)
        cache_key = None
        try:
            # Create a safe string representation of filters for cache key
            filter_str = str(sorted(base_filters.items())) if base_filters else ""
            cache_key = f"properties:{hashlib.md5((filter_str + str(limit) + str(offset) + str(min_price) + str(max_price) + str(min_rent) + str(max_rent) + str(min_area) + str(max_area) + str(property_type)).encode()).hexdigest()}"
            
            # Check cache (only for first page to avoid stale pagination)
            if offset == 0:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    print(f"[PROPERTIES] Returning cached result for key: {cache_key[:20]}...")
                    return cached_result
        except Exception as cache_error:
            print(f"[PROPERTIES] ⚠️ Cache key creation failed (continuing without cache): {cache_error}")
            cache_key = None

        # Fetch properties from database with pagination - filter at DB level for performance
        # Add timeout to prevent hanging
        import asyncio
        db_start = time.time()
        try:
            properties = await asyncio.wait_for(
                db.select(
                    "properties", 
                    filters=base_filters,
                    limit=limit,
                    offset=offset,
                    order_by="created_at",
                    ascending=False
                ),
                timeout=1.5  # Reduced to 1.5 seconds for faster failure
            )
        except asyncio.TimeoutError:
            db_elapsed = (time.time() - db_start) * 1000
            print(f"[PROPERTIES] Database timeout after {db_elapsed:.0f}ms - returning cached or empty result")
            # Return cached result if available, otherwise empty
            if cache_key and offset == 0:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    total_elapsed = (time.time() - start_time) * 1000
                    print(f"[PROPERTIES] Returning cached result ({total_elapsed:.0f}ms)")
                    return cached_result
            return []
        
        db_elapsed = (time.time() - db_start) * 1000
        print(f"[PROPERTIES] Database query completed in {db_elapsed:.0f}ms")
        
        if not properties:
            print("[PROPERTIES] No properties found in database with filters:", base_filters)
            return []

        print(f"[PROPERTIES] Found {len(properties)} properties in database (paginated)")

        # Apply price/rent/area range filters client-side (efficient for paginated results)
        if min_price is not None or max_price is not None:
            initial_count = len(properties)
            properties = [p for p in properties if 
                (min_price is None or (p.get('price') and p.get('price') >= min_price)) and
                (max_price is None or (p.get('price') and p.get('price') <= max_price))]
            if len(properties) < initial_count:
                print(f"[PROPERTIES] Price filter: {initial_count} -> {len(properties)} properties")
        
        if min_rent is not None or max_rent is not None:
            initial_count = len(properties)
            properties = [p for p in properties if 
                (min_rent is None or (p.get('monthly_rent') and p.get('monthly_rent') >= min_rent)) and
                (max_rent is None or (p.get('monthly_rent') and p.get('monthly_rent') <= max_rent))]
            if len(properties) < initial_count:
                print(f"[PROPERTIES] Rent filter: {initial_count} -> {len(properties)} properties")
        
        if min_area is not None or max_area is not None:
            initial_count = len(properties)
            properties = [p for p in properties if 
                (min_area is None or (p.get('area_sqft') and p.get('area_sqft') >= min_area)) and
                (max_area is None or (p.get('area_sqft') and p.get('area_sqft') <= max_area))]
            if len(properties) < initial_count:
                print(f"[PROPERTIES] Area filter: {initial_count} -> {len(properties)} properties")

        # Filter by multiple property types if requested
        if property_type and ',' in property_type:
            property_types = [pt.strip() for pt in property_type.split(',')]
            properties = [prop for prop in properties if prop.get('property_type') in property_types]
            print(f"[PROPERTIES] Filtered to {len(properties)} properties matching types: {property_types}")

        # Get unique cities for debugging
        cities_in_db = set()
        for prop in properties:
            if prop.get('city'):
                cities_in_db.add(prop['city'])
        print(f"[PROPERTIES] Cities in database: {sorted(cities_in_db)}")

        # Apply client-side filters that can't be done server-side
        filtered_properties = []
        for prop in properties:
            enhanced_prop = dict(prop)  # Make a copy to avoid modifying original
            
            # Handle PostgreSQL array fields - these are already arrays, don't parse as JSON
            array_fields = ['images', 'amenities', 'room_images', 'gated_community_features']
            for field in array_fields:
                if enhanced_prop.get(field) is None:
                    enhanced_prop[field] = []
                elif isinstance(enhanced_prop.get(field), str):
                    # If it's a string, it might be a JSON string representation
                    try:
                        import json
                        parsed = json.loads(enhanced_prop[field])
                        enhanced_prop[field] = parsed if isinstance(parsed, list) else []
                    except (json.JSONDecodeError, TypeError):
                        enhanced_prop[field] = []
                # If it's already a list/array, keep it as is
            
            # Handle JSONB fields that might be stored as strings
            jsonb_fields = ['sections', 'nearby_highlights']
            for field in jsonb_fields:
                if isinstance(enhanced_prop.get(field), str):
                    try:
                        import json
                        enhanced_prop[field] = json.loads(enhanced_prop[field])
                    except (json.JSONDecodeError, TypeError):
                        enhanced_prop[field] = []
                elif enhanced_prop.get(field) is None:
                    enhanced_prop[field] = []

            # Apply price filters
            price = enhanced_prop.get('price', 0)
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
            if min_rent is not None and price < min_rent:
                continue
            if max_rent is not None and price > max_rent:
                continue

            # Apply area filters
            area_sqft = enhanced_prop.get('area_sqft', 0)
            if min_area is not None and area_sqft < min_area:
                continue
            if max_area is not None and area_sqft > max_area:
                continue

            # Apply bedroom/bathroom filters
            if bedrooms is not None:
                prop_bedrooms = enhanced_prop.get('bedrooms')
                if prop_bedrooms is None or prop_bedrooms < bedrooms:
                    continue

            if bathrooms is not None:
                prop_bathrooms = enhanced_prop.get('bathrooms')
                if prop_bathrooms is None or prop_bathrooms < bathrooms:
                    continue

            # Apply city filter (case-insensitive)
            if city:
                prop_city = enhanced_prop.get('city', '').lower().strip()
                city_filter = city.lower().strip()
                if prop_city != city_filter:
                    # Try partial matching
                    if city_filter not in prop_city and prop_city not in city_filter:
                        print(f"[PROPERTIES] City filter failed: '{city}' != '{enhanced_prop['city']}'")
                        continue

            # Apply state filter (case-insensitive)
            if state:
                prop_state = enhanced_prop.get('state', '').lower().strip()
                state_filter = state.lower().strip()
                if prop_state != state_filter:
                    # Try partial matching
                    if state_filter not in prop_state and prop_state not in state_filter:
                        print(f"[PROPERTIES] State filter failed: '{state}' != '{enhanced_prop['state']}'")
                        continue

            # Apply furnishing status filter
            if furnishing_status:
                prop_furnishing = enhanced_prop.get('furnishing_status', '').lower().strip()
                furnishing_filter = furnishing_status.lower().strip()
                if prop_furnishing != furnishing_filter:
                    # Try partial matching
                    if furnishing_filter not in prop_furnishing and prop_furnishing not in furnishing_filter:
                        print(f"[PROPERTIES] Furnishing filter failed: '{furnishing_status}' != '{enhanced_prop['furnishing_status']}'")
                        continue

            # FILTER OUT SOLD PROPERTIES - don't show sold properties to buyers
            prop_status = enhanced_prop.get('status', '').lower().strip()
            if prop_status == 'sold':
                print(f"[PROPERTIES] Skipping sold property: {enhanced_prop.get('id', 'unknown')}")
                continue

            # Property passed all filters
            filtered_properties.append(enhanced_prop)

        # Batch fetch all images for properties that don't have them (optimize N+1 query problem)
        property_ids_needing_images = [prop.get('id') for prop in filtered_properties 
                                      if not prop.get('images') or len(prop.get('images', [])) == 0]
        
        if property_ids_needing_images:
            try:
                # Fetch all images in one query instead of per-property
                all_image_docs = await db.select("documents", filters={
                    "entity_type": "property",
                    "entity_id": {"in": property_ids_needing_images}
                })
                
                # Group images by property_id
                images_by_property = {}
                for doc in all_image_docs or []:
                    prop_id = doc.get('entity_id')
                    file_type = doc.get('file_type', '')
                    if prop_id and file_type.startswith('image/'):
                        if prop_id not in images_by_property:
                            images_by_property[prop_id] = []
                        # Use 'url' if available, otherwise fallback to 'file_path'
                        image_url = doc.get('url') or doc.get('file_path')
                        if image_url:
                            images_by_property[prop_id].append(image_url)
                
                # Assign images to properties
                for prop in filtered_properties:
                    if not prop.get('images') or len(prop.get('images', [])) == 0:
                        prop_id = prop.get('id')
                        if prop_id in images_by_property:
                            prop['images'] = images_by_property[prop_id]
            except Exception as img_err:
                print(f"[PROPERTIES] Failed to batch fetch images: {img_err}")
        
        # Add formatted pricing display to each property (single loop)
        for prop in filtered_properties:
            prop['formatted_pricing'] = _format_property_pricing(prop)

        print(f"[PROPERTIES] Returning {len(filtered_properties)} filtered properties")
        
        # Cache the result (only for first page to avoid stale pagination)
        try:
            if offset == 0 and cache_key:
                cache.set(cache_key, filtered_properties, ttl=300)  # Cache for 5 minutes
        except Exception as cache_error:
            print(f"[PROPERTIES] ⚠️ Cache set failed (continuing): {cache_error}")
        
        total_elapsed = (time.time() - start_time) * 1000
        print(f"[PROPERTIES] Total request time: {total_elapsed:.0f}ms ({len(filtered_properties)} properties)")
        
        return filtered_properties

    except Exception as e:
        print(f"[PROPERTIES] Error fetching properties: {e}")
        print(f"[PROPERTIES] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching properties: {str(e)}")

@router.post("")
@router.post("/")
async def create_property(request: Request):
    try:
        # Parse JSON body from request
        try:
            property_data = await request.json()
        except Exception as json_error:
            print(f"[PROPERTIES] Failed to parse JSON body: {json_error}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        print(f"[PROPERTIES] Creating new property")
        print(f"[PROPERTIES] Received data keys: {list(property_data.keys())}")
        print(f"[PROPERTIES] Property data sample: title={property_data.get('title')}, type={property_data.get('property_type')}")
        
        # Try to get user_id from authentication if available
        # Whoever creates the property is the owner (owner_id and added_by)
        user_id = None
        user_type = None
        if request:
            try:
                from ..core.security import get_current_user_claims
                claims = get_current_user_claims(request)
                if claims:
                    user_id = claims.get("sub")
                    print(f"[PROPERTIES] Found authenticated user creating property: {user_id}")
                    
                    # Get user type to determine if agent is creating property
                    try:
                        users = await db.select("users", filters={"id": user_id})
                        if users:
                            user_type = users[0].get("user_type", "").lower()
                            print(f"[PROPERTIES] User type: {user_type}")
                    except Exception as user_error:
                        print(f"[PROPERTIES] Could not fetch user type: {user_error}")
                    
                    # Set owner_id, seller_id, and added_by based on user type
                    # CRITICAL: 
                    # - Seller uploads: seller becomes owner (owner_id = seller_id = user_id)
                    # - Agent uploads: agent becomes owner by default (owner_id = user_id), unless owner details provided
                    # - Admin uploads: can assign owner_id and assigned_agent_id from form
                    
                    if user_type == 'seller':
                        # Seller creates property: seller is the owner
                        if not property_data.get('owner_id'):
                            property_data['owner_id'] = user_id
                        property_data['seller_id'] = user_id  # Set seller_id for seller-created properties
                        if not property_data.get('added_by'):
                            property_data['added_by'] = user_id
                        print(f"[PROPERTIES] Seller creating property - set owner_id={property_data.get('owner_id')}, seller_id={user_id}")
                    
                    elif user_type == 'agent':
                        # Agent creates property: agent is the owner by default
                        # Only if owner details (name, email, phone) are provided, use those instead
                        if property_data.get('owner_name') or property_data.get('owner_email') or property_data.get('owner_phone'):
                            # Agent is creating property on behalf of someone else
                            # owner_id will be set to null or provided owner_id, owner details stored in nested object
                            print(f"[PROPERTIES] Agent creating property on behalf of owner: name={property_data.get('owner_name')}, email={property_data.get('owner_email')}, phone={property_data.get('owner_phone')}")
                            # Don't set owner_id here - let it be null or use provided owner_id
                        else:
                            # Agent is creating property for themselves - agent is the owner
                            if not property_data.get('owner_id'):
                                property_data['owner_id'] = user_id
                            print(f"[PROPERTIES] Agent creating property for themselves - set owner_id={user_id}")
                        
                        # Always set assigned_agent_id to the logged-in agent
                        property_data['assigned_agent_id'] = user_id
                        property_data['agent_id'] = user_id  # Also set legacy agent_id field
                        if not property_data.get('added_by'):
                            property_data['added_by'] = user_id
                        print(f"[PROPERTIES] Agent creating property - set assigned_agent_id={user_id}")
                    
                    elif user_type == 'admin':
                        # Admin creates property: can assign owner_id and assigned_agent_id from form
                        # If owner_id not provided, only set it if user_id is a valid UUID
                        # For dev-admin (id: 'dev-admin'), don't set owner_id - it must be provided from form
                        if not property_data.get('owner_id'):
                            # Check if user_id is a valid UUID
                            try:
                                uuid.UUID(user_id)
                                property_data['owner_id'] = user_id
                                print(f"[PROPERTIES] Admin creating property - using admin user ID as owner_id: {user_id}")
                            except (ValueError, TypeError):
                                print(f"[PROPERTIES] ⚠️ Admin user_id is not a valid UUID: {user_id} - owner_id must be provided from form")
                                # Don't set owner_id - it must be provided from the form or will be null
                        
                        # Only set added_by if user_id is a valid UUID
                        if not property_data.get('added_by'):
                            try:
                                uuid.UUID(user_id)
                                property_data['added_by'] = user_id
                            except (ValueError, TypeError):
                                print(f"[PROPERTIES] ⚠️ Cannot set added_by with invalid UUID: {user_id}")
                                # Don't set added_by if user_id is not a valid UUID
                        
                        # assigned_agent_id can be set from form by admin
                        if property_data.get('assigned_agent_id'):
                            property_data['agent_id'] = property_data.get('assigned_agent_id')
                        print(f"[PROPERTIES] Admin creating property - owner_id={property_data.get('owner_id')}, assigned_agent_id={property_data.get('assigned_agent_id')}")
                    
                    else:
                        # Buyer or other user types: user becomes owner
                        # Check if user_id is a valid UUID before using it
                        try:
                            uuid.UUID(user_id)
                            if not property_data.get('owner_id'):
                                property_data['owner_id'] = user_id
                            if not property_data.get('added_by'):
                                property_data['added_by'] = user_id
                            print(f"[PROPERTIES] {user_type} creating property - set owner_id={property_data.get('owner_id')}, added_by={user_id}")
                        except (ValueError, TypeError):
                            print(f"[PROPERTIES] ⚠️ User ID is not a valid UUID: {user_id} - cannot set owner_id or added_by")
                            # Don't set owner_id or added_by if user_id is not a valid UUID
            except Exception as auth_error:
                print(f"[PROPERTIES] Could not extract user from request: {auth_error}")
                # Continue without user_id if auth fails
        
        # Validate that owner_id is provided if it's required
        # For dev-admin or other cases where owner_id might not be set, check if it's required
        if not property_data.get('owner_id'):
            print(f"[PROPERTIES] ⚠️ WARNING: owner_id is not set. Property may fail if owner_id is required in database.")
            # Try to find a default owner or raise an error
            # For now, we'll allow it to be None and let the database handle it
            # If the database requires it, the insert will fail with a clear error
        
        # Generate unique ID
        property_id = str(uuid.uuid4())
        property_data['id'] = property_id
        
        # CRITICAL: Remove empty custom_id from frontend (if any) - we always generate our own
        # This prevents conflicts with existing properties that have empty custom_id
        if 'custom_id' in property_data and (not property_data.get('custom_id') or property_data.get('custom_id') == '' or property_data.get('custom_id') is None):
            del property_data['custom_id']
            print(f"[PROPERTIES] Removed empty/null custom_id from frontend data")
        
        # Generate custom_id for property (required, must be unique)
        # Always generate a new one for new properties (never reuse frontend's custom_id)
        try:
            from ..services.admin_service import generate_property_custom_id
            custom_id = await generate_property_custom_id()
            property_data['custom_id'] = custom_id
            print(f"[PROPERTIES] Generated custom_id for property: {custom_id}")
        except Exception as cid_error:
            print(f"[PROPERTIES] Failed to generate custom_id: {cid_error}")
            # Fallback: use timestamp-based custom_id to ensure uniqueness
            import time
            property_data['custom_id'] = f"PROP{int(time.time() * 1000) % 100000000:08d}"
            print(f"[PROPERTIES] Using fallback custom_id: {property_data['custom_id']}")
        
        # Set timestamps
        now = dt.datetime.now(dt.timezone.utc).isoformat()
        property_data['created_at'] = now
        property_data['updated_at'] = now
        
        # Ensure required fields with defaults - properties require admin approval
        property_data.setdefault('status', 'pending')  # Pending until admin approves
        property_data.setdefault('featured', False)
        property_data.setdefault('verified', False)  # Must be verified by admin before showing
        property_data.setdefault('priority', 0)
        
        # CRITICAL: Force verified to False for new properties (admin approval required)
        property_data['verified'] = False
        print(f"[PROPERTIES] Property will require admin approval: status={property_data['status']}, verified={property_data['verified']}")
        
        # Handle required fields - set to 'NA' if empty
        # Note: area_sqft is not required for new_property, new_apartment, and lot types
        property_type = property_data.get('property_type', 'independent_house').lower()
        area_not_required_types = ['new_property', 'new_apartment', 'lot']
        is_area_not_required = property_type in area_not_required_types
        
        required_fields = {
            'address': 'NA',
            'city': 'NA', 
            'state': 'NA',
            'zip_code': 'NA',
            'listing_type': 'SALE',
            'property_type': 'independent_house'
        }
        
        # Only require area_sqft for property types that need it
        # CRITICAL: Database requires area_sqft to be NOT NULL, so set to 0 for property types that don't require area input
        if not is_area_not_required:
            required_fields['area_sqft'] = 0  # Must be numeric, not null
        else:
            # For new_property, new_apartment, and lot, set area_sqft to 0 (not None) since DB requires NOT NULL
            # These property types don't require area input from user, but DB constraint requires a value
            if 'area_sqft' not in property_data or property_data['area_sqft'] is None or property_data['area_sqft'] == '':
                property_data['area_sqft'] = 0  # Set to 0 instead of None to satisfy NOT NULL constraint
                property_data['area_sqyd'] = 0  # Set to 0 instead of None
                property_data['area_acres'] = 0.0  # Set to 0.0 instead of None
                print(f"[PROPERTIES] Area fields set to 0 for {property_type} (area not required but DB requires NOT NULL)")
        
        for field, default_value in required_fields.items():
            if field not in property_data or property_data[field] is None or property_data[field] == '':
                property_data[field] = default_value
                print(f"[PROPERTIES] Set required field {field} to default: {default_value}")
        
        # Convert numeric fields and handle 'NA' values
        numeric_fields = [
            'price', 'monthly_rent', 'security_deposit', 'maintenance_charges',
            'rate_per_sqft', 'rate_per_sqyd', 'area_sqft', 'area_sqyd', 'area_acres',
            'carpet_area_sqft', 'built_up_area_sqft', 'plot_area_sqft', 'plot_area_sqyd',
            'latitude', 'longitude', 'bedrooms', 'bathrooms', 'balconies',
            'total_floors', 'floor', 'parking_spaces', 'floor_count',
            # New pricing fields for new_property and lot types
            'starting_price_per_unit'
        ]
        
        for field in numeric_fields:
            if field in property_data:
                value = property_data[field]
                if value is None or value == '' or value == 'NA':
                    # For area fields, check if area is required for this property type
                    if field in ['area_sqft', 'area_sqyd', 'area_acres']:
                        # CRITICAL: Database requires area_sqft to be NOT NULL, so always set to 0 if None/empty
                        # For property types that don't require area input (new_property, new_apartment, lot),
                        # we still need to set area_sqft to 0 (not None) to satisfy the DB constraint
                        if field == 'area_sqft':
                            property_data[field] = 0  # Always set to 0 for NOT NULL constraint
                        elif field == 'area_sqyd':
                            property_data[field] = 0 if is_area_not_required else None
                        elif field == 'area_acres':
                            property_data[field] = 0.0 if is_area_not_required else None
                        else:
                            property_data[field] = None
                    else:
                        property_data[field] = None
                else:
                    try:
                        if field in ['bedrooms', 'bathrooms', 'balconies', 'total_floors', 'floor', 'parking_spaces', 'floor_count']:
                            property_data[field] = int(float(value)) if value else None
                        else:
                            property_data[field] = float(value) if value else None
                    except (ValueError, TypeError):
                        # For area fields, check if area is required for this property type
                        if field in ['area_sqft', 'area_sqyd', 'area_acres']:
                            # CRITICAL: Database requires area_sqft to be NOT NULL, so always set to 0 if invalid
                            # For property types that don't require area input (new_property, new_apartment, lot),
                            # we still need to set area_sqft to 0 (not None) to satisfy the DB constraint
                            if field == 'area_sqft':
                                property_data[field] = 0  # Always set to 0 for NOT NULL constraint
                            elif field == 'area_sqyd':
                                property_data[field] = 0 if is_area_not_required else None
                            elif field == 'area_acres':
                                property_data[field] = 0.0 if is_area_not_required else None
                            else:
                                property_data[field] = None
                        else:
                            property_data[field] = None
                        print(f"[PROPERTIES] Invalid numeric value for {field}: {value}, set to {'None' if (field in ['area_sqft', 'area_sqyd', 'area_acres'] and is_area_not_required) else ('0' if field == 'area_sqft' else 'None')}")
        
        # Handle boolean fields
        boolean_fields = [
            'private_garden', 'private_driveway', 'road_access', 'boundary_fencing',
            'water_availability', 'electricity_availability', 'corner_plot', 'visitor_parking'
        ]
        
        for field in boolean_fields:
            if field in property_data:
                value = property_data[field]
                if isinstance(value, str):
                    property_data[field] = value.lower() in ['true', '1', 'yes', 'on']
                elif value is None or value == '' or value == 'NA':
                    property_data[field] = False
        
        # Handle coordinates - convert to float if provided, set to None if invalid
        if 'latitude' in property_data:
            lat_value = property_data['latitude']
            if lat_value is None or lat_value == '' or lat_value == 'NA' or lat_value == 'null' or lat_value == 'undefined':
                property_data['latitude'] = None
            else:
                try:
                    # Convert to float if it's a string
                    if isinstance(lat_value, str):
                        lat_value = float(lat_value)
                    elif isinstance(lat_value, (int, float)):
                        lat_value = float(lat_value)
                    else:
                        property_data['latitude'] = None
                        print(f"[PROPERTIES] Invalid latitude type: {type(lat_value)}, value: {lat_value}")
                        lat_value = None
                    
                    # Validate latitude range if conversion succeeded
                    if lat_value is not None:
                        if -90 <= lat_value <= 90:
                            property_data['latitude'] = lat_value
                            print(f"[PROPERTIES] Set latitude: {lat_value}")
                        else:
                            print(f"[PROPERTIES] Latitude out of range: {lat_value}, setting to None")
                            property_data['latitude'] = None
                except (ValueError, TypeError) as e:
                    print(f"[PROPERTIES] Error converting latitude to float: {e}, value: {lat_value}")
                    property_data['latitude'] = None
        
        if 'longitude' in property_data:
            lng_value = property_data['longitude']
            if lng_value is None or lng_value == '' or lng_value == 'NA' or lng_value == 'null' or lng_value == 'undefined':
                property_data['longitude'] = None
            else:
                try:
                    # Convert to float if it's a string
                    if isinstance(lng_value, str):
                        lng_value = float(lng_value)
                    elif isinstance(lng_value, (int, float)):
                        lng_value = float(lng_value)
                    else:
                        property_data['longitude'] = None
                        print(f"[PROPERTIES] Invalid longitude type: {type(lng_value)}, value: {lng_value}")
                        lng_value = None
                    
                    # Validate longitude range if conversion succeeded
                    if lng_value is not None:
                        if -180 <= lng_value <= 180:
                            property_data['longitude'] = lng_value
                            print(f"[PROPERTIES] Set longitude: {lng_value}")
                        else:
                            print(f"[PROPERTIES] Longitude out of range: {lng_value}, setting to None")
                            property_data['longitude'] = None
                except (ValueError, TypeError) as e:
                    print(f"[PROPERTIES] Error converting longitude to float: {e}, value: {lng_value}")
                    property_data['longitude'] = None
        
        # Auto-populate location fields from zipcode (suggested values, editable)
        if property_data.get('zip_code'):
            try:
                from ..services.location_service import LocationService
                location_data = await LocationService.get_pincode_location_data(property_data['zip_code'])

                if location_data.get('auto_populated'):
                    suggested_fields = location_data.get('suggested_fields', {})

                    # Auto-populate empty fields with suggested values (but allow editing)
                    # DO NOT set coordinates from pincode - coordinates come ONLY from map picker
                    if not property_data.get('state'):
                        property_data['state'] = suggested_fields.get('state')
                    if not property_data.get('district'):
                        property_data['district'] = suggested_fields.get('district')
                    if not property_data.get('mandal'):
                        property_data['mandal'] = suggested_fields.get('mandal')
                    if not property_data.get('city'):
                        property_data['city'] = suggested_fields.get('city')
                    if not property_data.get('address'):
                        property_data['address'] = suggested_fields.get('address')

                    # DO NOT auto-set coordinates from pincode
                    # Coordinates must be set by user via map picker interaction

                    print(f"[PROPERTIES] Auto-populated suggested location fields from zipcode {property_data['zip_code']}")
                    print(f"[PROPERTIES] Suggested Location: {suggested_fields.get('city')}, {suggested_fields.get('district')}, {suggested_fields.get('state')}")
                    print(f"[PROPERTIES] Suggested Address: {suggested_fields.get('address')}")
            except Exception as location_error:
                print(f"[PROPERTIES] Failed to auto-populate location from zipcode: {location_error}")
                # Don't fail property creation if zipcode lookup fails
                # Just log the error and continue
        
        # DO NOT set default coordinates - coordinates must come from map picker
        # If coordinates are missing, they will be None (user must set via map)
        if property_data.get('latitude') is None or property_data.get('longitude') is None:
            print(f"[PROPERTIES] Coordinates not set - user must set via map picker")
        
        # Remove sections from property_data as it's handled separately
        sections_data = property_data.pop('sections', None)
        
        # Handle JSON fields that exist in the database - keep as native arrays for Supabase
        json_fields = ['images', 'amenities', 'room_images', 'gated_community_features']
        for field in json_fields:
            if field in property_data:
                value = property_data[field]
                if isinstance(value, (list, dict)):
                    # Keep as-is, Supabase handles native arrays
                    pass
                elif value is None or value == '' or value == 'NA':
                    property_data[field] = []
                elif isinstance(value, str) and value not in ['[]', '{}']:
                    # Try to parse as JSON
                    try:
                        import json
                        property_data[field] = json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        property_data[field] = [value] if value else []
        
        # Handle string fields with DB constraints - set to NULL if empty
        # These fields have CHECK constraints in DB and cannot be 'NA'
        constrained_fields = ['commercial_subtype', 'facing', 'land_type', 'community_type']
        
        for field in constrained_fields:
            if field in property_data:
                value = property_data[field]
                if value is None or value == '' or value == 'NA':
                    property_data[field] = None
        
        # Handle other string fields - set to NULL if empty (better than 'NA')
        string_fields = [
            'bhk_config', 'plot_dimensions', 'soil_type', 'water_source', 'apartment_type',
            'legal_status', 'rera_status', 'rera_number',
            'nearby_business_hubs', 'nearby_transport', 'furnishing_status',
            'district', 'mandal', 'state_id', 'district_id', 'mandal_id',
            # New pricing fields for new_property and lot types
            'pricing_display_mode', 'pricing_unit_type'
        ]
        
        for field in string_fields:
            if field in property_data:
                value = property_data[field]
                if value is None or value == '' or value == 'NA':
                    property_data[field] = None
        
        # Auto-set pricing_display_mode and related fields based on property_type
        property_type = property_data.get('property_type', '').lower()
        if property_type == 'new_property' or property_type == 'new_apartment':
            # New property/apartment: "Starting from ₹X/sqft"
            if not property_data.get('pricing_display_mode'):
                property_data['pricing_display_mode'] = 'starting_from'
            if not property_data.get('pricing_unit_type'):
                property_data['pricing_unit_type'] = 'sqft'
            # If starting_price_per_unit is provided, use it; otherwise use rate_per_sqft
            if property_data.get('starting_price_per_unit') is None and property_data.get('rate_per_sqft'):
                property_data['starting_price_per_unit'] = property_data.get('rate_per_sqft')
        elif property_type == 'lot':
            # Lot: "₹X/sqyd - buy 1, 2, 3... sq yards"
            if not property_data.get('pricing_display_mode'):
                property_data['pricing_display_mode'] = 'per_unit'
            if not property_data.get('pricing_unit_type'):
                property_data['pricing_unit_type'] = 'sqyd'
            # If starting_price_per_unit is provided, use it; otherwise use rate_per_sqyd
            if property_data.get('starting_price_per_unit') is None and property_data.get('rate_per_sqyd'):
                property_data['starting_price_per_unit'] = property_data.get('rate_per_sqyd')
        else:
            # Default: fixed pricing
            if not property_data.get('pricing_display_mode'):
                property_data['pricing_display_mode'] = 'fixed'
        
        # Handle date fields
        date_fields = ['available_from', 'possession_date']
        for field in date_fields:
            if field in property_data:
                value = property_data[field]
                if value is None or value == '' or value == 'NA':
                    property_data[field] = None
                else:
                    try:
                        # Convert to ISO format if it's a string
                        if isinstance(value, str):
                            from datetime import datetime
                            parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            property_data[field] = parsed_date.isoformat()
                    except (ValueError, TypeError):
                        property_data[field] = None
        
        # Handle special fields that don't exist in database schema
        # Map UI fields to database fields
        field_mapping = {
            'lift_available': 'lift_available',  # Map to existing field if it exists
            'power_backup': 'power_backup',
            'washrooms': 'bathrooms',  # Map washrooms to bathrooms
            'management_type': 'community_type',  # Map management_type to community_type
            'parking_spaces': 'parking_slots',  # Map parking_spaces to parking_slots
            'total_floors_building': 'total_floors',  # Map total_floors_building to total_floors
            'floor_number': 'floor',  # Map floor_number to floor
            'balconies_count': 'balconies',  # Map balconies_count to balconies
            'built_up_area': 'built_up_area_sqft',  # Map built_up_area to built_up_area_sqft
            'carpet_area': 'carpet_area_sqft',  # Map carpet_area to carpet_area_sqft
            'plot_area': 'plot_area_sqft',  # Map plot_area to plot_area_sqft
            'rate_per_sqft_value': 'rate_per_sqft',  # Map rate_per_sqft_value to rate_per_sqft
            'rate_per_sqyd_value': 'rate_per_sqyd',  # Map rate_per_sqyd_value to rate_per_sqyd
            'maintenance_charges_value': 'maintenance_charges',  # Map maintenance_charges_value to maintenance_charges
            'security_deposit_value': 'security_deposit',  # Map security_deposit_value to security_deposit
            'monthly_rent_value': 'monthly_rent',  # Map monthly_rent_value to monthly_rent
            'price_value': 'price',  # Map price_value to price
            'area_sqft_value': 'area_sqft',  # Map area_sqft_value to area_sqft
            'area_sqyd_value': 'area_sqyd',  # Map area_sqyd_value to area_sqyd
            'area_acres_value': 'area_acres',  # Map area_acres_value to area_acres
            'bedrooms_count': 'bedrooms',  # Map bedrooms_count to bedrooms
            'bathrooms_count': 'bathrooms',  # Map bathrooms_count to bathrooms
            'total_floors_count': 'total_floors',  # Map total_floors_count to total_floors
            'available_floor_number': 'available_floor',  # Map available_floor_number to available_floor
            'parking_slots_count': 'parking_slots',  # Map parking_slots_count to parking_slots
            'floor_count_value': 'floor_count',  # Map floor_count_value to floor_count
            'floor_value': 'floor',  # Map floor_value to floor
        }
        
        # Apply field mapping
        for ui_field, db_field in field_mapping.items():
            if ui_field in property_data and ui_field != db_field:
                # CRITICAL: For area_sqft, don't overwrite if it's already set (we set it to 0 for special property types)
                if db_field == 'area_sqft' and property_data.get('area_sqft') is not None and property_data.get('area_sqft') != '':
                    # Don't overwrite area_sqft if it's already set (we set it to 0 for special property types)
                    print(f"[PROPERTIES] Skipping mapping {ui_field} -> {db_field} (area_sqft already set to {property_data.get('area_sqft')})")
                elif db_field not in property_data:  # Only map if target field doesn't exist
                    property_data[db_field] = property_data[ui_field]
                del property_data[ui_field]
                print(f"[PROPERTIES] Mapped field {ui_field} -> {db_field}")
        
        # Remove fields that don't exist in the database
        # CRITICAL: owner_name, owner_email, owner_phone don't exist in properties table
        # These are stored in the nested 'owner' object for reference, but must be removed before insert
        # The owner's email should be fetched from the users table via owner_id relationship
        fields_to_remove = [
            'country', 'lift_available', 'power_backup', 'washrooms', 'management_type',
            'parking_spaces', 'total_floors_building', 'floor_number', 'balconies_count',
            'built_up_area', 'carpet_area', 'plot_area', 'rate_per_sqft_value',
            'rate_per_sqyd_value', 'rate_per_acre',  # CRITICAL: rate_per_acre doesn't exist in DB
            'maintenance_charges_value', 'security_deposit_value',
            'monthly_rent_value', 'price_value', 'area_sqft_value', 'area_sqyd_value',
            'area_acres_value', 'bedrooms_count', 'bathrooms_count', 'total_floors_count',
            'available_floor_number', 'parking_slots_count', 'floor_count_value', 'floor_value',
            'form_data', 'images_data', 'sections_data', 'ui_fields', 'db_fields',
            # CRITICAL: Remove city_id as it doesn't exist in the database schema
            'city_id',
            # CRITICAL: Remove owner_email, owner_name, owner_phone - these don't exist in properties table
            # Owner details are stored in nested 'owner' object for reference only, not in database
            'owner_email', 'owner_name', 'owner_phone'
        ]
        
        for field in fields_to_remove:
            if field in property_data:
                del property_data[field]
                print(f"[PROPERTIES] Removed unsupported field: {field}")
        
        # CRITICAL: Remove custom_id from frontend if it's empty (we'll generate our own)
        # This prevents frontend from sending empty custom_id which would conflict with existing empty custom_id
        if 'custom_id' in property_data and (not property_data.get('custom_id') or property_data.get('custom_id') == ''):
            del property_data['custom_id']
            print(f"[PROPERTIES] Removed empty custom_id from frontend - will generate new one")
        
        # CRITICAL: Ensure custom_id is set and not empty (required for unique constraint)
        if not property_data.get('custom_id') or property_data.get('custom_id') == '' or property_data.get('custom_id') is None:
            try:
                from ..services.admin_service import generate_property_custom_id
                custom_id = await generate_property_custom_id()
                property_data['custom_id'] = custom_id
                print(f"[PROPERTIES] Generated custom_id for property (before insert): {custom_id}")
            except Exception as cid_error:
                print(f"[PROPERTIES] Failed to generate custom_id before insert: {cid_error}")
                # Fallback: use UUID-based custom_id to ensure uniqueness
                import time
                property_data['custom_id'] = f"PROP{int(time.time() * 1000) % 100000000:08d}"
                print(f"[PROPERTIES] Using fallback custom_id before insert: {property_data['custom_id']}")
        
        # CRITICAL: Validate and remove invalid UUID fields before database insert
        # UUID fields that must be valid UUIDs or None
        uuid_fields = ['owner_id', 'seller_id', 'assigned_agent_id', 'agent_id', 'added_by']
        for field in uuid_fields:
            if field in property_data and property_data[field] is not None:
                try:
                    # Try to validate as UUID
                    uuid.UUID(str(property_data[field]))
                except (ValueError, TypeError):
                    # Invalid UUID - remove it or set to None
                    print(f"[PROPERTIES] ⚠️ Invalid UUID for {field}: {property_data[field]} - removing it")
                    if field == 'added_by':
                        # added_by can be None, but other fields should be removed
                        property_data[field] = None
                    else:
                        del property_data[field]
        
        # CRITICAL: Handle area fields based on area_unit
        # Only keep the relevant area field based on area_unit, remove others
        area_unit = property_data.get('area_unit', 'sqft')
        
        if area_unit == 'sqft':
            # For sqft: ensure area_sqft exists, remove area_sqyd and area_acres
            if 'area_sqyd' in property_data:
                del property_data['area_sqyd']
            if 'area_acres' in property_data:
                del property_data['area_acres']
            # Ensure area_sqft is set
            if 'area_sqft' not in property_data or property_data.get('area_sqft') is None or property_data.get('area_sqft') == '':
                property_data['area_sqft'] = 0
                print(f"[PROPERTIES] ⚠️ Set area_sqft to 0 (was missing/None/empty)")
        elif area_unit == 'sqyd':
            # For sqyd: ensure area_sqyd exists, remove area_sqft and area_acres
            if 'area_sqft' in property_data:
                # Convert area_sqyd to area_sqft for database (1 sqyd = 9 sqft)
                area_sqyd = property_data.get('area_sqyd', 0)
                try:
                    area_sqyd_float = float(area_sqyd) if area_sqyd else 0
                    property_data['area_sqft'] = area_sqyd_float * 9  # Convert to sqft
                    print(f"[PROPERTIES] Converted {area_sqyd_float} sqyd to {property_data['area_sqft']} sqft")
                except (ValueError, TypeError):
                    property_data['area_sqft'] = 0
                del property_data['area_sqyd']
            if 'area_acres' in property_data:
                del property_data['area_acres']
        elif area_unit == 'acres':
            # For acres: convert to area_sqft (1 acre = 43560 sqft), remove area_sqyd
            if 'area_acres' in property_data:
                area_acres = property_data.get('area_acres', 0)
                try:
                    area_acres_float = float(area_acres) if area_acres else 0
                    property_data['area_sqft'] = area_acres_float * 43560  # Convert to sqft
                    print(f"[PROPERTIES] Converted {area_acres_float} acres to {property_data['area_sqft']} sqft")
                except (ValueError, TypeError):
                    property_data['area_sqft'] = 0
                del property_data['area_acres']
            if 'area_sqyd' in property_data:
                del property_data['area_sqyd']
        
        # CRITICAL: Final safety check - ensure area_sqft is never None (database requires NOT NULL)
        # This MUST be the last check before database insert
        if 'area_sqft' not in property_data or property_data.get('area_sqft') is None or property_data.get('area_sqft') == '':
            property_data['area_sqft'] = 0
            print(f"[PROPERTIES] ⚠️ Final safety check: Set area_sqft to 0 (was missing/None/empty)")
        
        # Ensure area_sqft is a number, not a string or None
        if isinstance(property_data.get('area_sqft'), str):
            try:
                property_data['area_sqft'] = float(property_data['area_sqft'])
            except (ValueError, TypeError):
                property_data['area_sqft'] = 0
                print(f"[PROPERTIES] ⚠️ Converted area_sqft string to 0 (invalid value)")
        elif property_data.get('area_sqft') is None:
            property_data['area_sqft'] = 0
            print(f"[PROPERTIES] ⚠️ Final safety check: Set area_sqft to 0 (was None after string check)")
        
        # ABSOLUTE FINAL CHECK: Ensure area_sqft exists and is a number (not None)
        try:
            area_value = property_data.get('area_sqft', 0)
            if area_value is None or area_value == '':
                area_value = 0
            property_data['area_sqft'] = float(area_value)
        except (ValueError, TypeError):
            property_data['area_sqft'] = 0.0
            print(f"[PROPERTIES] ⚠️ ABSOLUTE FINAL: Set area_sqft to 0.0 (conversion failed)")
        
        print(f"[PROPERTIES] Final property data keys: {list(property_data.keys())}")
        print(f"[PROPERTIES] Required fields check:")
        print(f"  - area_sqft: {property_data.get('area_sqft')} (type: {type(property_data.get('area_sqft')).__name__})")
        print(f"  - address: {property_data.get('address')}")
        print(f"  - city: {property_data.get('city')}")
        print(f"  - state: {property_data.get('state')}")
        print(f"  - zip_code: {property_data.get('zip_code')}")
        print(f"  - listing_type: {property_data.get('listing_type')}")
        print(f"  - property_type: {property_data.get('property_type')}")
        print(f"[PROPERTIES] Coordinates and Images check:")
        print(f"  - latitude: {property_data.get('latitude')} (type: {type(property_data.get('latitude')).__name__})")
        print(f"  - longitude: {property_data.get('longitude')} (type: {type(property_data.get('longitude')).__name__})")
        print(f"  - images: {property_data.get('images')} (count: {len(property_data.get('images', []))})")
        print(f"  - amenities: {property_data.get('amenities')} (count: {len(property_data.get('amenities', []))})")
        
        # Insert property
        try:
            # ONE MORE CHECK: Ensure area_sqft is definitely set before insert
            if 'area_sqft' not in property_data or property_data['area_sqft'] is None:
                property_data['area_sqft'] = 0.0
                print(f"[PROPERTIES] ⚠️ PRE-INSERT CHECK: Set area_sqft to 0.0 before database insert")
            
            # CRITICAL FINAL CHECK: Ensure custom_id is set and not empty before insert
            # This is the absolute last check before database insert
            if not property_data.get('custom_id') or property_data.get('custom_id') == '' or property_data.get('custom_id') is None:
                print(f"[PROPERTIES] ⚠️ CRITICAL: custom_id is empty before insert! Generating now...")
                try:
                    from ..services.admin_service import generate_property_custom_id
                    custom_id = await generate_property_custom_id()
                    property_data['custom_id'] = custom_id
                    print(f"[PROPERTIES] ✅ Generated custom_id at final check: {custom_id}")
                except Exception as cid_error:
                    print(f"[PROPERTIES] ⚠️ Failed to generate custom_id at final check: {cid_error}")
                    # Fallback: use timestamp-based ID to ensure uniqueness
                    import time
                    property_data['custom_id'] = f"PROP{int(time.time() * 1000) % 100000000:08d}"
                    print(f"[PROPERTIES] ✅ Using fallback custom_id at final check: {property_data['custom_id']}")
            else:
                print(f"[PROPERTIES] ✅ custom_id is set: {property_data.get('custom_id')}")
            
            print(f"[PROPERTIES] Attempting to insert property into database...")
            print(f"[PROPERTIES] Property ID: {property_id}")
            print(f"[PROPERTIES] Custom ID: {property_data.get('custom_id')}")
            print(f"[PROPERTIES] Title: {property_data.get('title')}")
            
            result = await db.insert("properties", property_data)
            print(f"[PROPERTIES] ✅ Database insert successful! Result: {result}")
            print(f"[PROPERTIES] Property created successfully with ID: {property_id}")
            
            # Verify the property was saved correctly
            try:
                saved_property = await db.select("properties", filters={"id": property_id})
                if saved_property and len(saved_property) > 0:
                    prop = saved_property[0]
                    print(f"[PROPERTIES] ✅ VERIFICATION - Property saved to database:")
                    print(f"  - Title: {prop.get('title')}")
                    print(f"  - Coordinates: lat={prop.get('latitude')}, lng={prop.get('longitude')}")
                    print(f"  - Images: {len(prop.get('images', []))} images")
                    print(f"  - Location: {prop.get('city')}, {prop.get('state')}")
                    print(f"  - Status: {prop.get('status')}")
                else:
                    print(f"[PROPERTIES] ❌ WARNING: Property not found after creation!")
                    print(f"[PROPERTIES] Attempted to find property with ID: {property_id}")
            except Exception as verify_error:
                print(f"[PROPERTIES] ❌ Error verifying saved property: {verify_error}")
                import traceback
                print(traceback.format_exc())
                # Don't fail the request if verification fails - property might still be saved
        except Exception as insert_error:
            print(f"[PROPERTIES] ❌ Database insert failed: {insert_error}")
            import traceback
            print(f"[PROPERTIES] Full traceback:")
            print(traceback.format_exc())
            print(f"[PROPERTIES] Property data that failed to insert:")
            for key, value in list(property_data.items())[:10]:  # Print first 10 fields
                print(f"  {key}: {value} (type: {type(value).__name__})")
            # Re-raise the error so it's caught by the outer exception handler
            raise
        
        # Post-insert operations (only if insert succeeded)
        # Auto-assign agent if property doesn't have one
        if not property_data.get('agent_id'):
            try:
                from ..services.agent_assignment import AgentAssignmentService
                assignment_result = await AgentAssignmentService.assign_agent_to_property(property_id)
                if assignment_result.get('success'):
                    print(f"[PROPERTIES] Agent assigned: {assignment_result.get('message')}")
                else:
                    print(f"[PROPERTIES] Agent assignment failed: {assignment_result.get('error')}")
            except Exception as agent_error:
                print(f"[PROPERTIES] Agent assignment error: {agent_error}")
        
        # Handle sections separately if provided
        if sections_data is not None:
            if isinstance(sections_data, str):
                import json
                sections_data = json.loads(sections_data)
            
            if sections_data and sections_data != []:
                to_insert = []
                for i, section in enumerate(sections_data):
                    section_data = {
                        'id': str(uuid.uuid4()),
                        'property_id': property_id,
                        'title': section.get('title', f'Section {i+1}'),
                        'content': section.get('content', ''),
                        'content_type': section.get('content_type', 'text'),
                        'sort_order': section.get('sort_order', i),
                        'created_at': now,
                        'updated_at': now
                    }
                    to_insert.append(section_data)
                
                if to_insert:
                    for section_data in to_insert:
                        await db.insert("property_sections", section_data)
                    print(f"[PROPERTIES] Added {len(to_insert)} sections to property")
        
        # Send property submission email to user
        try:
            # Get user details for email
            user_data = await db.select("users", filters={"id": property_data.get('added_by')})
            if user_data:
                user = user_data[0]
                user_email = user.get('email')
                user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                
                if user_email:
                    email_html = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #2563eb;">Property Submitted Successfully!</h2>
                            <p>Hello {user_name},</p>
                            <p>Your property "<strong>{property_data.get('title', 'Property')}</strong>" has been submitted successfully and is now waiting for admin approval.</p>
                            
                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #374151;">Property Details:</h3>
                                <p><strong>Title:</strong> {property_data.get('title', 'N/A')}</p>
                                <p><strong>Type:</strong> {property_data.get('property_type', 'N/A').replace('_', ' ').title()}</p>
                                <p><strong>Listing Type:</strong> {property_data.get('listing_type', 'N/A')}</p>
                                <p><strong>Location:</strong> {property_data.get('city', 'N/A')}, {property_data.get('state', 'N/A')}</p>
                                <p><strong>Area:</strong> {property_data.get('area_sqft', 'N/A')} sq ft</p>
                                {f'<p><strong>Price:</strong> ₹{property_data.get("price", "N/A")}</p>' if property_data.get('listing_type') == 'SALE' and property_data.get('price') else ''}
                                {f'<p><strong>Monthly Rent:</strong> ₹{property_data.get("monthly_rent", "N/A")}</p>' if property_data.get('listing_type') == 'RENT' and property_data.get('monthly_rent') else ''}
                            </div>
                            
                            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #92400e;"><strong>Next Steps:</strong></p>
                                <ul style="margin: 10px 0 0 0; color: #92400e;">
                                    <li>Our admin team will review your property</li>
                                    <li>You'll receive an email once approved</li>
                                    <li>Your property will then be visible to buyers</li>
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
                        to=user_email,
                        subject=f"Property Submitted - {property_data.get('title', 'Property')} - Home & Own",
                        html=email_html
                    )
                    print(f"[PROPERTIES] Property submission email sent to user: {user_email}")
        except Exception as email_error:
            print(f"[PROPERTIES] Failed to send property submission email: {email_error}")
        
        # Send admin notification for new property submission
        try:
            from ..services.admin_notification_service import AdminNotificationService
            
            # Get user data for the property owner
            user_data = {}
            if property_data.get('added_by'):
                try:
                    users = await db.select("users", filters={"id": property_data.get('added_by')})
                    if users:
                        user_data = users[0]
                except Exception as user_error:
                    print(f"[PROPERTIES] Failed to get user data for admin notification: {user_error}")
            
            await AdminNotificationService.notify_property_submission(property_data, user_data)
            print(f"[PROPERTIES] Admin notification sent for new property: {property_data.get('title')}")
        except Exception as notify_error:
            print(f"[PROPERTIES] Failed to send admin notification: {notify_error}")
            # Don't fail property creation if notification fails
        
        return {"id": property_id, "message": "Property created successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Create property error: {e}")
        print(f"[PROPERTIES] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating property: {str(e)}")

@router.get("/{property_id_or_slug}")
async def get_property(property_id_or_slug: str, request: Request = None):
    try:
        print(f"[PROPERTIES] Fetching single property by ID or slug: {property_id_or_slug}")
        
        # Check if user is authenticated and is a buyer
        show_agent_info = False
        if request:
            try:
                from ..core.security import try_get_current_user_claims
                claims = try_get_current_user_claims(request)
                if claims:
                    user_id = claims.get("sub")
                    if user_id:
                        # Check if user is a buyer
                        users = await db.select("users", filters={"id": user_id})
                        if users:
                            user = users[0]
                            user_type = user.get("user_type", "").lower()
                            # Check active roles if available
                            try:
                                from ..services.user_role_service import UserRoleService
                                active_roles = await UserRoleService.get_active_user_roles(user_id)
                                is_buyer = "buyer" in active_roles or user_type == "buyer"
                            except Exception:
                                is_buyer = user_type == "buyer"
                            
                            if is_buyer:
                                show_agent_info = True
                                print(f"[PROPERTIES] Buyer authenticated - will show agent info if available")
            except Exception as auth_error:
                print(f"[PROPERTIES] Auth check failed (non-buyer or not logged in): {auth_error}")
                show_agent_info = False
        
        # First, try to fetch by ID (assuming it's a UUID)
        try:
            import uuid
            uuid.UUID(property_id_or_slug) # Check if it's a valid UUID
            properties = await db.select("properties", filters={"id": property_id_or_slug})
            if properties:
                property_data = dict(properties[0])
                return await _process_single_property(property_data, show_agent_info=show_agent_info)
        except ValueError:
            # It's not a UUID, so treat it as a slug
            pass

        # If not found by ID, search by slug using database query
        print(f"[PROPERTIES] Not a valid UUID. Searching by slug: {property_id_or_slug}")
        import re
        
        # Try to find by searching titles that might match the slug
        # First, try a direct search with the slug as a substring in title
        # This is much more efficient than fetching all properties
        search_term = property_id_or_slug.replace('-', ' ')
        properties_by_title = await db.select(
            "properties",
            filters={"status": "active"},
            limit=100  # Limit search to first 100 active properties
        )
        
        # Search through limited results for slug match
        for prop in properties_by_title:
            title = prop.get('title', '')
            if title:
                # Generate slug from title
                slug = title.lower()
                slug = re.sub(r'[^a-z0-9\s-]', '', slug) # Remove special chars
                slug = slug.strip()
                slug = re.sub(r'\s+', '-', slug) # Replace spaces with dashes
                slug = re.sub(r'-+', '-', slug) # Replace multiple dashes
                
                if slug == property_id_or_slug:
                    print(f"[PROPERTIES] Property found by slug: {prop.get('id')}")
                    return await _process_single_property(dict(prop), show_agent_info=show_agent_info)

        # If we reach here, no property was found by ID or slug
        raise HTTPException(status_code=404, detail="Property not found")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Get property error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching property: {str(e)}")

async def _process_single_property(property_data: dict, show_agent_info: bool = False):
    """Helper function to process and enrich a single property object."""
    # (The processing logic from the original get_property function will be moved here)
    # Handle array fields, JSONB fields, fetch owner, fetch sections, fetch images, etc.
    
    # Handle PostgreSQL array fields
    array_fields = ['images', 'amenities', 'room_images', 'gated_community_features']
    for field in array_fields:
        if property_data.get(field) is None:
            property_data[field] = []
        elif isinstance(property_data.get(field), str):
            try:
                import json
                parsed = json.loads(property_data[field])
                property_data[field] = parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                property_data[field] = []

    # Fetch owner details if available (for agent-created properties)
    # Owner details (owner_name, owner_email, owner_phone) are stored when agent creates property
    # CRITICAL: owner_email, owner_name, owner_phone are NOT database columns - they're stored in nested 'owner' object
    # If owner_email is not provided, use the registered user's email from owner_id
    if property_data.get('owner_name') or property_data.get('owner_email') or property_data.get('owner_phone'):
        # Use provided owner details
        property_data['owner'] = {
            'name': property_data.get('owner_name', ''),
            'email': property_data.get('owner_email', ''),
            'phone': property_data.get('owner_phone', '')
        }
        # If owner_email is empty but we have owner_id, fetch email from users table
        if not property_data.get('owner_email') and property_data.get('owner_id'):
            try:
                owners = await db.select("users", filters={"id": property_data.get('owner_id')})
                if owners:
                    owner = dict(owners[0])
                    property_data['owner']['email'] = owner.get('email', '')
                    print(f"[PROPERTIES] Using registered user's email for owner: {owner.get('email')}")
            except Exception as e:
                print(f"[PROPERTIES] Error fetching owner email: {e}")
    else:
        # Try to fetch owner from owner_id or added_by
        owner_id = property_data.get('owner_id') or property_data.get('added_by')
        if owner_id:
            try:
                owners = await db.select("users", filters={"id": owner_id})
                if owners:
                    owner = dict(owners[0])
                    property_data['owner'] = {
                        'id': owner.get('id'),
                        'first_name': owner.get('first_name'),
                        'last_name': owner.get('last_name'),
                        'name': f"{owner.get('first_name', '')} {owner.get('last_name', '')}".strip(),
                        'email': owner.get('email', ''),  # Use registered user's email
                        'phone_number': owner.get('phone_number') or owner.get('phone')
                    }
                    print(f"[PROPERTIES] Fetched owner details from registered user: {owner.get('email')}")
            except Exception as e:
                print(f"[PROPERTIES] Error fetching owner details: {e}")
                pass

    # Fetch seller details if seller_id is set (for seller-created properties)
    seller_id = property_data.get('seller_id')
    if seller_id:
        try:
            sellers = await db.select("users", filters={"id": seller_id})
            if sellers:
                seller = dict(sellers[0])
                property_data['seller'] = {
                    'id': seller.get('id'),
                    'first_name': seller.get('first_name'),
                    'last_name': seller.get('last_name'),
                    'name': f"{seller.get('first_name', '')} {seller.get('last_name', '')}".strip(),
                    'email': seller.get('email', ''),  # Use registered seller's email
                    'phone_number': seller.get('phone_number') or seller.get('phone')
                }
                print(f"[PROPERTIES] Seller info added: {property_data['seller']['name']} ({property_data['seller']['email']})")
        except Exception as e:
            print(f"[PROPERTIES] Error fetching seller details: {e}")
            pass

    # Fetch assigned agent details if available - ONLY for logged-in buyers
    agent_id = property_data.get("agent_id") or property_data.get("assigned_agent_id")
    if show_agent_info and agent_id:
        try:
            agents = await db.select("users", filters={"id": agent_id})
            if agents:
                agent = dict(agents[0])
                # Add agent name and phone number (for logged-in buyers only)
                property_data['agent'] = {
                    'id': agent.get('id'),
                    'name': f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                    'phone_number': agent.get('phone_number') or agent.get('phone'),
                }
                # Also keep full agent details for backward compatibility
                property_data['assigned_agent'] = {
                    'id': agent.get('id'),
                    'first_name': agent.get('first_name'),
                    'last_name': agent.get('last_name'),
                    'name': f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                    'email': agent.get('email'),
                    'phone_number': agent.get('phone_number') or agent.get('phone'),
                }
                print(f"[PROPERTIES] Agent info added for buyer: {property_data['agent']['name']}")
            else:
                print(f"[PROPERTIES] Agent ID {agent_id} not found in database")
        except Exception as e:
            print(f"[PROPERTIES] Error fetching agent info: {e}")
            pass # Ignore agent fetch errors
    else:
        if not show_agent_info:
            print(f"[PROPERTIES] Agent info not shown - user not authenticated as buyer")
        elif not agent_id:
            print(f"[PROPERTIES] Agent info not shown - property has no assigned agent")

    # Fetch images if empty
    if not property_data.get('images'):
        try:
            image_docs = await db.select("documents", filters={"entity_type": "property", "entity_id": property_data.get('id')})
            if image_docs:
                property_data['images'] = [doc.get('file_path') for doc in image_docs if doc.get('file_type', '').startswith('image/')]
        except Exception:
            pass # Ignore image fetch errors

    # Ensure coordinates
    if property_data.get('latitude') is None or property_data.get('longitude') is None:
        property_data['latitude'] = 17.3850
        property_data['longitude'] = 78.4867
    
    # Add formatted pricing display
    property_data['formatted_pricing'] = _format_property_pricing(property_data)
        
    return property_data


@router.put("/{property_id}")
@router.patch("/{property_id}")
async def update_property(property_id: str, update_data: dict):
    try:
        print(f"[PROPERTIES] Updating property: {property_id}")
        print(f"[PROPERTIES] Received update_data keys: {list(update_data.keys())}")
        
        # Debug: Print array fields specifically
        array_fields = ['images', 'amenities', 'room_images', 'gated_community_features']
        for field in array_fields:
            if field in update_data:
                print(f"[PROPERTIES] {field}: {update_data[field]} (type: {type(update_data[field])})")
        
        # Check if property exists
        existing_properties = await db.select("properties", filters={"id": property_id})
        if not existing_properties:
            print(f"[PROPERTIES] Property not found: {property_id}")
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Validate UUID fields before processing
        uuid_fields = ['owner_id', 'agent_id', 'added_by']
        for field in uuid_fields:
            if field in update_data and update_data[field]:
                value = update_data[field]
                # Check if it's a valid UUID
                if isinstance(value, str) and value:
                    # Skip if it's already None or empty
                    if value in ['', 'null', 'undefined', 'NA', 'homeandown']:
                        print(f"[PROPERTIES] Setting {field} to None for invalid value: {value}")
                        update_data[field] = None
                        continue
                    # Validate UUID format
                    try:
                        import uuid as uuid_lib
                        uuid_lib.UUID(value)
                    except (ValueError, AttributeError) as e:
                        print(f"[PROPERTIES] Invalid UUID for {field}: {value}, setting to None")
                        update_data[field] = None
        
        # Update timestamp
        update_data['updated_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
        
        # Handle coordinates - convert to float if provided, set to None if invalid
        if 'latitude' in update_data:
            lat_value = update_data['latitude']
            if lat_value is None or lat_value == '' or lat_value == 'NA' or lat_value == 'null' or lat_value == 'undefined':
                update_data['latitude'] = None
            else:
                try:
                    # Convert to float if it's a string
                    if isinstance(lat_value, str):
                        lat_value = float(lat_value)
                    elif isinstance(lat_value, (int, float)):
                        lat_value = float(lat_value)
                    else:
                        update_data['latitude'] = None
                        print(f"[PROPERTIES] Invalid latitude type in update: {type(lat_value)}, value: {lat_value}")
                    # Validate latitude range
                    if update_data['latitude'] is not None and -90 <= lat_value <= 90:
                        update_data['latitude'] = lat_value
                        print(f"[PROPERTIES] Updated latitude: {lat_value}")
                    elif update_data['latitude'] is not None:
                        print(f"[PROPERTIES] Latitude out of range in update: {lat_value}, setting to None")
                        update_data['latitude'] = None
                except (ValueError, TypeError) as e:
                    print(f"[PROPERTIES] Error converting latitude to float in update: {e}, value: {lat_value}")
                    update_data['latitude'] = None
        
        if 'longitude' in update_data:
            lng_value = update_data['longitude']
            if lng_value is None or lng_value == '' or lng_value == 'NA' or lng_value == 'null' or lng_value == 'undefined':
                update_data['longitude'] = None
            else:
                try:
                    # Convert to float if it's a string
                    if isinstance(lng_value, str):
                        lng_value = float(lng_value)
                    elif isinstance(lng_value, (int, float)):
                        lng_value = float(lng_value)
                    else:
                        update_data['longitude'] = None
                        print(f"[PROPERTIES] Invalid longitude type in update: {type(lng_value)}, value: {lng_value}")
                    # Validate longitude range
                    if update_data['longitude'] is not None and -180 <= lng_value <= 180:
                        update_data['longitude'] = lng_value
                        print(f"[PROPERTIES] Updated longitude: {lng_value}")
                    elif update_data['longitude'] is not None:
                        print(f"[PROPERTIES] Longitude out of range in update: {lng_value}, setting to None")
                        update_data['longitude'] = None
                except (ValueError, TypeError) as e:
                    print(f"[PROPERTIES] Error converting longitude to float in update: {e}, value: {lng_value}")
                    update_data['longitude'] = None
        
        # DO NOT set default coordinates - coordinates must come from map picker
        # If coordinates are missing, they will be None (user must set via map)
        if update_data.get('latitude') is None or update_data.get('longitude') is None:
            print(f"[PROPERTIES] Coordinates not set in update - user must set via map picker")
        
        # Remove sections from update_data as it's handled separately
        sections_data = update_data.pop('sections', None)
        
        # Auto-set pricing_display_mode and related fields based on property_type (if property_type is being updated)
        if 'property_type' in update_data:
            property_type = update_data.get('property_type', '').lower()
            if property_type == 'new_property' or property_type == 'new_apartment':
                # New property/apartment: "Starting from ₹X/sqft"
                if not update_data.get('pricing_display_mode'):
                    update_data['pricing_display_mode'] = 'starting_from'
                if not update_data.get('pricing_unit_type'):
                    update_data['pricing_unit_type'] = 'sqft'
                # If starting_price_per_unit is provided, use it; otherwise use rate_per_sqft
                if update_data.get('starting_price_per_unit') is None and update_data.get('rate_per_sqft'):
                    update_data['starting_price_per_unit'] = update_data.get('rate_per_sqft')
            elif property_type == 'lot':
                # Lot: "₹X/sqyd - buy 1, 2, 3... sq yards"
                if not update_data.get('pricing_display_mode'):
                    update_data['pricing_display_mode'] = 'per_unit'
                if not update_data.get('pricing_unit_type'):
                    update_data['pricing_unit_type'] = 'sqyd'
                # If starting_price_per_unit is provided, use it; otherwise use rate_per_sqyd
                if update_data.get('starting_price_per_unit') is None and update_data.get('rate_per_sqyd'):
                    update_data['starting_price_per_unit'] = update_data.get('rate_per_sqyd')
        
        # Define valid database columns for properties table (based on actual schema)
        valid_property_columns = {
            'id', 'custom_id', 'title', 'description', 'price', 'monthly_rent', 'security_deposit',
            'property_type', 'bedrooms', 'bathrooms', 'area_sqft', 'area_sqyd', 'area_acres', 'area_unit',  # Added area_unit
            'address', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'images', 'amenities', 
            'owner_id', 'status', 'featured', 'verified', 'listing_type', 'available_from', 'furnishing_status',
            'created_at', 'updated_at', 'district', 'mandal', 'room_images', 'maintenance_charges',
            'rate_per_sqft', 'rate_per_sqyd', 'carpet_area_sqft', 'built_up_area_sqft', 
            'plot_area_sqft', 'plot_area_sqyd', 'commercial_subtype', 'total_floors', 'available_floor', 
            'parking_slots', 'bhk_config', 'floor_count', 'facing', 'private_garden', 'private_driveway', 
            'plot_dimensions', 'land_type', 'soil_type', 'road_access', 'boundary_fencing', 
            'water_availability', 'electricity_availability', 'apartment_type', 'floor_number', 
            'total_floors_building', 'balconies', 'community_type', 'gated_community_features', 
            'visitor_parking', 'legal_status', 'rera_status', 'rera_number', 'video_url', 
            'virtual_tour_url', 'nearby_business_hubs', 'nearby_transport', 'agent_id', 'priority', 
            'possession_date', 'corner_plot', 'water_source', 'amenities_json', 'images_json', 
            'added_by', 'added_by_role', 'state_id', 'district_id', 'mandal_id', 'floor', 
            'lift_available', 'parking_spaces', 'assigned_agent_id', 'assignment_date', 
            'assignment_status', 'assignment_notes', 'transfer_reason', 'previous_agent_id', 'seller_id',
            # New pricing fields for new_property and lot types
            'pricing_display_mode', 'starting_price_per_unit', 'pricing_unit_type'
            # Note: city_id is NOT in the database schema, so it's not included here
        }
        
        # CRITICAL: Remove city_id from update_data as it doesn't exist in the database
        if 'city_id' in update_data:
            del update_data['city_id']
            print(f"[PROPERTIES] Removed city_id from update_data (doesn't exist in database schema)")
        
        # Filter update_data to only include valid database columns
        filtered_update_data = {}
        for key, value in update_data.items():
            if key in valid_property_columns:
                filtered_update_data[key] = value
                # Debug: Log area_unit specifically
                if key == 'area_unit':
                    print(f"[PROPERTIES] ✅ area_unit included in update: {value}")
            else:
                print(f"[PROPERTIES] Skipping invalid column '{key}' - not in database schema")
        
        # Handle array fields that exist in the database as PostgreSQL arrays (TEXT[])
        # These should be sent as native arrays, not JSON strings
        array_fields = ['images', 'amenities', 'room_images', 'gated_community_features']
        for field in array_fields:
            if field in filtered_update_data:
                value = filtered_update_data[field]
                print(f"[PROPERTIES] Processing {field}: {value} (type: {type(value)})")
                
                if isinstance(value, (list, dict)):
                    # Keep as native array for PostgreSQL array columns
                    # Don't convert to JSON string
                    filtered_update_data[field] = value
                    print(f"[PROPERTIES] {field} kept as array: {value}")
                elif isinstance(value, str):
                    # Handle string values
                    if value == '[]' or value == '{}' or value == '' or value == 'NA':
                        # Set empty array for empty/null values
                        filtered_update_data[field] = []
                        print(f"[PROPERTIES] {field} set to empty array")
                    else:
                        # Try to parse as JSON if it's a string
                        try:
                            import json
                            parsed_value = json.loads(value)
                            filtered_update_data[field] = parsed_value
                            print(f"[PROPERTIES] {field} parsed from JSON: {parsed_value}")
                        except (json.JSONDecodeError, TypeError):
                            # If parsing fails, treat as single item array
                            filtered_update_data[field] = [value] if value else []
                            print(f"[PROPERTIES] {field} treated as single item array: {[value] if value else []}")
                elif value is None:
                    # Set empty array for null values
                    filtered_update_data[field] = []
                    print(f"[PROPERTIES] {field} set to empty array for null")
                else:
                    # For any other type, try to convert to array
                    filtered_update_data[field] = [value] if value else []
                    print(f"[PROPERTIES] {field} converted to array: {[value] if value else []}")
        
        # Update property (only existing columns)
        try:
            # Debug: Print what we're sending to database
            print(f"[PROPERTIES] Sending to database:")
            for field in array_fields:
                if field in filtered_update_data:
                    print(f"[PROPERTIES] DB {field}: {filtered_update_data[field]} (type: {type(filtered_update_data[field])})")
            
            # Remove None values to avoid database issues
            clean_update_data = {k: v for k, v in filtered_update_data.items() if v is not None}
            
            result = await db.update("properties", clean_update_data, {"id": property_id})
            print(f"[PROPERTIES] Updating fields: {list(clean_update_data.keys())}")
            
            # Handle sections update separately if provided
            if sections_data is not None:
                if isinstance(sections_data, str):
                    import json
                    sections_data = json.loads(sections_data)
                
                if sections_data:
                    # Delete existing sections
                    await db.delete("property_sections", {"property_id": property_id})
                    
                    # Insert new sections
                    to_insert = []
                    now = dt.datetime.now(dt.timezone.utc).isoformat()
                    for i, section in enumerate(sections_data):
                        section_data = {
                            'id': str(uuid.uuid4()),
                            'property_id': property_id,
                            'title': section.get('title', f'Section {i+1}'),
                            'content': section.get('content', ''),
                            'content_type': section.get('content_type', 'text'),
                            'sort_order': section.get('sort_order', i),
                            'created_at': now,
                            'updated_at': now
                        }
                        to_insert.append(section_data)
                    
                    if to_insert:
                        for section_data in to_insert:
                            await db.insert("property_sections", section_data)
                        print(f"[PROPERTIES] Replaced {len(to_insert)} sections for property {property_id}")
                else:
                    # Clear all sections
                    await db.delete("property_sections", {"property_id": property_id})
            
            # After successful update, fetch and return the updated property with images
            try:
                updated_property = await db.select("properties", filters={"id": property_id})
                if updated_property:
                    property_data = dict(updated_property[0])
                    
                    # Ensure images are populated
                    if not property_data.get('images') or len(property_data.get('images', [])) == 0:
                        image_docs = await db.select("documents", filters={
                            "entity_type": "property",
                            "entity_id": property_id
                        })
                        
                        if image_docs:
                            image_urls = []
                            for doc in image_docs:
                                file_type = doc.get('file_type', '')
                                if file_type.startswith('image/'):
                                    # Use 'file_path' if available, otherwise fallback to 'url'
                                    image_url = doc.get('file_path') or doc.get('url')
                                    if image_url:
                                        image_urls.append(image_url)
                            
                            if image_urls:
                                property_data['images'] = image_urls
                                # Update the property record with the images array
                                await db.update("properties", {"images": image_urls}, {"id": property_id})
                    
                    # Add formatted pricing display
                    property_data['formatted_pricing'] = _format_property_pricing(property_data)
                    
                    print(f"[PROPERTIES] Property updated successfully: {property_id}")
                    return {
                        "message": "Property updated successfully",
                        "property": property_data
                    }
            except Exception as fetch_error:
                print(f"[PROPERTIES] Failed to fetch updated property: {fetch_error}")
            
            print(f"[PROPERTIES] Property updated successfully: {property_id}")
            return {"message": "Property updated successfully"}
            
        except Exception as update_error:
            print(f"[PROPERTIES] Property update failed: {property_id}")
            print(f"[PROPERTIES] Update error details: {str(update_error)}")
            raise HTTPException(status_code=500, detail=f"Failed to update property: {str(update_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Update property error: {e}")
        print(f"[PROPERTIES] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating property: {str(e)}")

@router.patch("/{property_id}/featured")
async def toggle_featured_property(property_id: str, data: dict, _=Depends(require_api_key)):
    """Toggle featured status of a property (requires API key)"""
    try:
        print(f"[PROPERTIES] Toggling featured status for property: {property_id}")
        
        # Check if property exists
        existing_properties = await db.select("properties", filters={"id": property_id})
        if not existing_properties:
            print(f"[PROPERTIES] Property not found: {property_id}")
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Get the featured value from request
        featured = data.get('featured', False)
        
        # Update property featured status
        await db.update("properties", {
            "featured": featured,
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }, {"id": property_id})
        
        print(f"[PROPERTIES] Property featured status updated to: {featured}")
        return {
            "success": True,
            "message": f"Property {'featured' if featured else 'unfeatured'} successfully",
            "featured": featured
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Toggle featured error: {e}")
        print(f"[PROPERTIES] Full traceback:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error toggling featured status: {str(e)}")

@router.delete("/{property_id}")
async def delete_property(property_id: str, request: Request, _=Depends(require_admin_or_api_key)):
    """
    Delete a property - REQUIRES API KEY AUTHENTICATION OR JWT AUTHENTICATION (admin only)
    This endpoint should only be called by admin users or authorized services.
    """
    try:
        print(f"[PROPERTIES] ⚠️ DELETE REQUEST for property: {property_id}")
        print(f"[PROPERTIES] ⚠️ This is a destructive operation - logging for audit trail")
        
        # Check if property exists and get its title
        existing_properties = await db.select("properties", filters={"id": property_id})
        if not existing_properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = existing_properties[0]
        property_title = property_data.get('title', 'Property')
        property_custom_id = property_data.get('custom_id', 'N/A')
        
        # LOG DELETION DETAILS FOR AUDIT
        print(f"[PROPERTIES] ⚠️ DELETING PROPERTY COMPLETELY:")
        print(f"  - ID: {property_id}")
        print(f"  - Custom ID: {property_custom_id}")
        print(f"  - Title: {property_title}")
        print(f"  - Owner ID: {property_data.get('owner_id')}")
        print(f"  - Status: {property_data.get('status')}")
        print(f"  - Created: {property_data.get('created_at')}")
        
        # Delete all related data to completely remove property from website
        
        # 1. Delete property sections
        try:
            await db.delete("property_sections", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property sections")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting sections (may not exist): {e}")
        
        # 2. Delete documents/images related to property
        try:
            # Delete with both filters - entity_type and entity_id
            docs_result = await db.delete("documents", {"entity_type": "property", "entity_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property documents/images: {docs_result}")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting documents (may not exist or table doesn't support multi-filter): {e}")
            # Try with just entity_id if multi-filter fails
            try:
                docs_result = await db.delete("documents", {"entity_id": property_id})
                print(f"[PROPERTIES] ✓ Deleted property documents/images (fallback): {docs_result}")
            except Exception as e2:
                print(f"[PROPERTIES] ⚠️ Fallback delete also failed: {e2}")
        
        # 3. Delete saved properties (favorites)
        try:
            await db.delete("saved_properties", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted saved properties (favorites)")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting saved properties: {e}")
        
        # 4. Delete inquiries (must be deleted before property due to foreign key)
        try:
            inquiries_result = await db.delete("inquiries", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted inquiries: {inquiries_result}")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting inquiries (may not exist): {e}")
            import traceback
            print(f"[PROPERTIES] Inquiries delete traceback: {traceback.format_exc()}")
        
        # 5. Delete bookings (must be deleted before property due to foreign key)
        try:
            bookings_result = await db.delete("bookings", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted bookings: {bookings_result}")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting bookings (may not exist): {e}")
            import traceback
            print(f"[PROPERTIES] Bookings delete traceback: {traceback.format_exc()}")
        
        # 6. Delete property views
        try:
            await db.delete("property_views", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property views")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting property views: {e}")
        
        # 7. Delete property viewings
        try:
            await db.delete("property_viewings", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property viewings")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting property viewings: {e}")
        
        # 9. Delete agent property notifications
        try:
            await db.delete("agent_property_notifications", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted agent property notifications")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting agent notifications: {e}")
        
        # 10. Delete property assignment queue
        try:
            await db.delete("property_assignment_queue", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property assignment queue")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting assignment queue: {e}")
        
        # 11. Delete maintenance requests
        try:
            await db.delete("maintenance_requests", {"property_id": property_id})
            print(f"[PROPERTIES] ✓ Deleted maintenance requests")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error deleting maintenance requests: {e}")
        
        # 12. Clear cache for this property
        try:
            # Clear all property-related cache entries
            if cache:
                cache.clear()  # Clear entire cache to ensure property is removed
                print(f"[PROPERTIES] ✓ Cleared cache")
            else:
                print(f"[PROPERTIES] ⚠️ Cache not available, skipping")
        except Exception as e:
            print(f"[PROPERTIES] ⚠️ Error clearing cache (non-critical): {e}")
            # Don't fail deletion if cache clearing fails
        
        # 13. Finally, delete the property itself
        try:
            delete_result = await db.delete("properties", {"id": property_id})
            print(f"[PROPERTIES] ✓ Deleted property record: {delete_result}")
            if not delete_result or (isinstance(delete_result, list) and len(delete_result) == 0):
                print(f"[PROPERTIES] ⚠️ Delete returned empty result - property may not exist or already deleted")
                # Don't fail if property doesn't exist - it's already deleted
        except Exception as prop_delete_error:
            error_msg = str(prop_delete_error)
            print(f"[PROPERTIES] ❌ Error deleting property record: {error_msg}")
            print(f"[PROPERTIES] Property delete error traceback: {traceback.format_exc()}")
            
            # Check if it's a foreign key constraint error
            error_lower = error_msg.lower()
            if "foreign key" in error_lower or "constraint" in error_lower:
                # Try to get more info about what's blocking deletion
                print(f"[PROPERTIES] Foreign key constraint detected. Checking related records...")
                try:
                    remaining_inquiries = await db.select("inquiries", filters={"property_id": property_id}, limit=1)
                    remaining_bookings = await db.select("bookings", filters={"property_id": property_id}, limit=1)
                    if remaining_inquiries:
                        print(f"[PROPERTIES] ⚠️ Still have {len(remaining_inquiries)} inquiries")
                    if remaining_bookings:
                        print(f"[PROPERTIES] ⚠️ Still have {len(remaining_bookings)} bookings")
                except Exception as check_error:
                    print(f"[PROPERTIES] Could not check remaining records: {check_error}")
                
                detail = "Cannot delete property: it has related records that must be deleted first. Please try again."
            elif "not found" in error_lower or "does not exist" in error_lower:
                detail = "Property not found or already deleted"
            else:
                detail = f"Failed to delete property: {error_msg}"
            
            raise HTTPException(status_code=500, detail=detail)
        
        print(f"[PROPERTIES] ⚠️ PROPERTY COMPLETELY DELETED FROM WEBSITE: {property_id} ({property_title})")
        return {
            "success": True, 
            "message": f"Property '{property_title}' and all related data completely removed from website",
            "deleted_items": [
                "property_sections",
                "documents/images",
                "saved_properties",
                "inquiries",
                "bookings",
                "property_views",
                "property_viewings",
                "agent_notifications",
                "assignment_queue",
                "maintenance_requests",
                "property_record"
            ]
        }
        
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions (they already have proper status codes)
        print(f"[PROPERTIES] HTTPException during delete: {http_exc.status_code} - {http_exc.detail}")
        raise
    except Exception as e:
        # Catch all other exceptions and return proper error response
        error_msg = str(e)
        print(f"[PROPERTIES] ❌ Delete property error: {error_msg}")
        print(f"[PROPERTIES] Full traceback:")
        print(traceback.format_exc())
        
        # Check for common database errors
        error_lower = error_msg.lower()
        if "foreign key" in error_lower or "constraint" in error_lower:
            detail = "Cannot delete property: it has related records that must be deleted first"
        elif "not found" in error_lower or "does not exist" in error_lower:
            detail = "Property not found or already deleted"
        else:
            detail = f"Error deleting property: {error_msg}"
        
        print(f"[PROPERTIES] Raising HTTPException with detail: {detail}")
        raise HTTPException(status_code=500, detail=detail)

@router.get("/{property_id}/images")
async def get_property_images(property_id: str):
    """Get all images for a property from documents table"""
    try:
        print(f"[PROPERTIES] Fetching images for property: {property_id}")
        
        # Check if property exists
        properties = await db.select("properties", filters={"id": property_id})
        if not properties:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Fetch images from documents table
        image_docs = await db.select("documents", filters={
            "entity_type": "property",
            "entity_id": property_id
        })
        
        images = []
        if image_docs:
            for doc in image_docs:
                file_type = doc.get('file_type', '')
                if file_type.startswith('image/'):
                    # Use 'file_path' if available, otherwise fallback to 'url'
                    image_url = doc.get('file_path') or doc.get('url')
                    if image_url:
                        images.append({
                            "id": doc.get('id'),
                            "url": image_url,
                            "name": doc.get('name'),
                            "file_type": doc.get('file_type'),
                            "file_size": doc.get('file_size'),
                            "created_at": doc.get('created_at')
                        })
        
        print(f"[PROPERTIES] Found {len(images)} images for property {property_id}")
        return {"images": images}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Get images error: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching images: {str(e)}")

@router.get("/{property_id}/contact")
async def get_property_contact(property_id: str, request: Request = None, user_role: str = Query(None)):
    """Get contact information for a property - returns agent information only for logged-in buyers"""
    try:
        print(f"[PROPERTIES] Getting contact info for property: {property_id}, role: {user_role}")
        
        # Check if user is authenticated and is a buyer
        is_authenticated_buyer = False
        if request:
            try:
                from ..core.security import try_get_current_user_claims
                claims = try_get_current_user_claims(request)
                if claims:
                    user_id = claims.get("sub")
                    if user_id:
                        users = await db.select("users", filters={"id": user_id})
                        if users:
                            user = users[0]
                            user_type = user.get("user_type", "").lower()
                            try:
                                from ..services.user_role_service import UserRoleService
                                active_roles = await UserRoleService.get_active_user_roles(user_id)
                                is_authenticated_buyer = "buyer" in active_roles or user_type == "buyer"
                            except Exception:
                                is_authenticated_buyer = user_type == "buyer"
            except Exception as auth_error:
                print(f"[PROPERTIES] Auth check failed: {auth_error}")
        
        if not is_authenticated_buyer:
            raise HTTPException(status_code=401, detail="Authentication required. Only logged-in buyers can view agent contact information.")
        
        # Check if property exists
        property = await db.select("properties", filters={"id": property_id})
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property = property[0]
        
        # Get agent information only (owner information removed from public API)
        agent_id = property.get("agent_id") or property.get("assigned_agent_id")
        if not agent_id:
            return {"message": "No agent assigned to this property"}
        
        agent = await db.select("users", filters={"id": agent_id})
        if agent:
            agent = agent[0]
            return {
                "name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}".strip(),
                "email": agent.get("email"),
                "phone": agent.get("phone_number") or agent.get("phone"),
                "user_type": agent.get("user_type")
            }
        
        return {"message": "Agent information not available"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Get contact error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get contact: {str(e)}")



@router.get("/zipcode/{zipcode}", tags=["properties"])
@router.get("/pincode/{zipcode}", tags=["properties"])  # Keep pincode for backward compatibility
async def get_zipcode_location(zipcode: str):
    """Get complete location data for a zipcode - auto-populates form fields"""
    try:
        print(f"[PROPERTIES] Fetching complete location data for zipcode: {zipcode}")
        
        from ..services.location_service import LocationService
        
        # Get complete location data including auto-population fields
        location_data = await LocationService.get_pincode_location_data(zipcode)
        
        if not location_data.get('auto_populated'):
            raise HTTPException(status_code=404, detail=f"No location data found for zipcode {zipcode}")
        
        print(f"[PROPERTIES] Successfully fetched complete location data for zipcode {zipcode}")
        return location_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Error fetching zipcode location: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch zipcode location: {str(e)}")

@router.get("/zipcode/{zipcode}/suggestions", tags=["properties"])
@router.get("/pincode/{zipcode}/suggestions", tags=["properties"])  # Keep pincode for backward compatibility
async def get_zipcode_suggestions(zipcode: str):
    """Get suggested field values for a zipcode - for form auto-population"""
    try:
        print(f"[PROPERTIES] Fetching suggestions for zipcode: {zipcode}")
        
        from ..services.location_service import LocationService
        
        # Get complete location data
        location_data = await LocationService.get_pincode_location_data(zipcode)
        
        if not location_data.get('auto_populated'):
            raise HTTPException(status_code=404, detail=f"No location data found for zipcode {zipcode}")
        
        # Return only the suggested fields for easy frontend integration
        coordinates = location_data.get('coordinates')
        suggested_fields = location_data.get('suggested_fields', {})
        
        # Ensure coordinates are available in multiple places for frontend compatibility
        suggestions = {
            "zipcode": zipcode,
            "pincode": zipcode,  # Keep for backward compatibility
            "suggestions": suggested_fields,
            "map_data": {
                "coordinates": coordinates,
                "latitude": coordinates[0] if coordinates else suggested_fields.get('latitude'),
                "longitude": coordinates[1] if coordinates else suggested_fields.get('longitude'),
                "map_bounds": location_data.get('map_bounds')
            },
            "editable": True,
            "message": "These are suggested values. All fields can be edited."
        }
        
        print(f"[PROPERTIES] Returning coordinates in suggestions: lat={suggested_fields.get('latitude')}, lng={suggested_fields.get('longitude')}")
        print(f"[PROPERTIES] Returning coordinates in map_data: {coordinates}")
        
        print(f"[PROPERTIES] Successfully fetched suggestions for zipcode {zipcode}")
        return suggestions
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Error fetching zipcode suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch zipcode suggestions: {str(e)}")

@router.post("/geocode/address", tags=["properties"])
async def geocode_address(address_data: dict):
    """Geocode an address string to get coordinates and location details using Google Maps"""
    try:
        address = address_data.get("address")
        if not address:
            raise HTTPException(status_code=400, detail="Address is required")
        
        from ..services.google_maps_service import GoogleMapsService
        
        location_data = GoogleMapsService.geocode_address(address)
        
        if not location_data:
            raise HTTPException(status_code=404, detail="Could not geocode the address")
        
        return {
            "success": True,
            "location": location_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Error geocoding address: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to geocode address: {str(e)}")

@router.post("/geocode/reverse", tags=["properties"])
async def reverse_geocode(coordinate_data: dict):
    """Reverse geocode coordinates to get address information using OpenStreetMap (free)"""
    try:
        lat = coordinate_data.get("latitude")
        lng = coordinate_data.get("longitude")
        
        if lat is None or lng is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude are required")
        
        # Use OpenStreetMap for reverse geocoding (free)
        from ..services.location_service import LocationService
        
        location_data = await LocationService._reverse_geocode_coordinates(float(lat), float(lng))
        
        if not location_data:
            raise HTTPException(status_code=404, detail="Could not reverse geocode the coordinates")
        
        return {
            "success": True,
            "location": location_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Error reverse geocoding: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reverse geocode: {str(e)}")

@router.get("/places/autocomplete", tags=["properties"])
async def get_place_autocomplete(
    input_text: str = Query(..., description="Text input for autocomplete"),
    country: str = Query("in", description="Country code (default: in for India)")
):
    """Get place autocomplete suggestions using Google Places API"""
    try:
        from ..services.google_maps_service import GoogleMapsService
        
        suggestions = GoogleMapsService.get_place_autocomplete(input_text, country)
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"[PROPERTIES] Error getting autocomplete: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get autocomplete: {str(e)}")

@router.get("/places/{place_id}", tags=["properties"])
async def get_place_details(place_id: str):
    """Get detailed information about a place using Google Places API"""
    try:
        from ..services.google_maps_service import GoogleMapsService
        
        place_data = GoogleMapsService.get_place_details(place_id)
        
        if not place_data:
            raise HTTPException(status_code=404, detail="Place not found")
        
        return {
            "success": True,
            "place": place_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROPERTIES] Error getting place details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get place details: {str(e)}")

@router.get("/filters/options", tags=["properties"])
async def get_filter_options():
    """Get distinct filter values from database for search filters"""
    try:
        print(f"[PROPERTIES] Fetching filter options from database")
        
        # Get all active properties
        properties = await db.admin_select("properties", filters={"status": "active"})
        
        if not properties:
            print(f"[PROPERTIES] No properties found")
            return {
                "property_types": [],
                "states": [],
                "cities": [],
                "furnishing_statuses": [],
                "facing_directions": [],
                "commercial_subtypes": [],
                "land_types": []
            }
        
        # Extract distinct values
        property_types = sorted(list(set([p.get('property_type') for p in properties if p.get('property_type')])))
        states = sorted(list(set([p.get('state') for p in properties if p.get('state')])))
        cities = sorted(list(set([p.get('city') for p in properties if p.get('city')])))
        furnishing_statuses = sorted(list(set([p.get('furnishing_status') for p in properties if p.get('furnishing_status')])))
        facing_directions = sorted(list(set([p.get('facing') for p in properties if p.get('facing')])))
        commercial_subtypes = sorted(list(set([p.get('commercial_subtype') for p in properties if p.get('commercial_subtype')])))
        land_types = sorted(list(set([p.get('land_type') for p in properties if p.get('land_type')])))
        
        result = {
            "property_types": [{"value": pt, "label": pt.replace('_', ' ').title()} for pt in property_types],
            "states": states,
            "cities": cities,
            "furnishing_statuses": furnishing_statuses,
            "facing_directions": facing_directions,
            "commercial_subtypes": commercial_subtypes,
            "land_types": land_types
        }
        
        print(f"[PROPERTIES] Filter options: {result}")
        return result
        
    except Exception as e:
        print(f"[PROPERTIES] Error fetching filter options: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch filter options: {str(e)}")

@router.get("/locations/{city}/mandals", tags=["properties"])
async def get_mandals_for_city(city: str):
    """Get mandals with property counts for a specific city"""
    try:
        print(f"[PROPERTIES] Fetching mandals for city: {city}")
        
        # Get all active properties in this city
        properties = await db.admin_select("properties", filters={"city": city, "status": "active"})
        
        if not properties:
            print(f"[PROPERTIES] No properties found in city: {city}")
            return {
                "city": city,
                "mandals": [],
                "property_count": 0
            }
        
        # Count properties per mandal
        mandal_counts: dict = {}
        for prop in properties:
            mandal = prop.get('mandal')
            if mandal:
                mandal_counts[mandal] = mandal_counts.get(mandal, 0) + 1
        
        # Sort by property count descending
        mandals = [
            {"mandal": m, "property_count": c} 
            for m, c in sorted(mandal_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        result = {
            "city": city,
            "mandals": mandals,
            "total_properties": len(properties)
        }
        
        print(f"[PROPERTIES] Found {len(mandals)} mandals in {city} with {len(properties)} total properties")
        return result
        
    except Exception as e:
        print(f"[PROPERTIES] Error fetching mandals for city: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch mandals: {str(e)}")