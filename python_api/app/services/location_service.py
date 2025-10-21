"""
Location Service
Handles property location by pincode with radius search
"""

import asyncio
import requests
import datetime as dt
from typing import Dict, List, Optional, Any, Tuple
from ..db.supabase_client import db

class LocationService:
    """Service for handling property locations and pincode-based searches"""
    
    # Cache for dynamically fetched coordinates
    _coordinate_cache = {}
    
    @staticmethod
    async def get_coordinates_from_pincode(pincode: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates from pincode - check database first, then fetch from web APIs
        Returns (latitude, longitude) or None if not found
        """
        if not pincode:
            return None
        
        # Clean pincode
        pincode = str(pincode).strip()
        
        # Check dynamic cache first
        if pincode in LocationService._coordinate_cache:
            print(f"[LOCATION] Found coordinates in dynamic cache for pincode {pincode}")
            return LocationService._coordinate_cache[pincode]
        
        # Check database for existing coordinates
        try:
            existing_coords = await LocationService._get_coordinates_from_db(pincode)
            if existing_coords:
                print(f"[LOCATION] Found coordinates in database for pincode {pincode}")
                LocationService._coordinate_cache[pincode] = existing_coords
                return existing_coords
        except Exception as e:
            print(f"[LOCATION] Database lookup failed for pincode {pincode}: {e}")
        
        # Fetch from web APIs and store in database
        coordinates = await LocationService._fetch_and_store_coordinates(pincode)
        if coordinates:
            print(f"[LOCATION] Successfully fetched and stored coordinates for pincode {pincode}: {coordinates}")
            LocationService._coordinate_cache[pincode] = coordinates
            return coordinates
        
        print(f"[LOCATION] No coordinates found for pincode {pincode}")
        return None
    
    @staticmethod
    async def _get_coordinates_from_db(pincode: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from database pincode_locations table"""
        try:
            result = await db.select("pincode_locations", filters={"pincode": pincode})
            if result and len(result) > 0:
                record = result[0]
                lat = record.get('latitude')
                lon = record.get('longitude')
                if lat is not None and lon is not None:
                    return (float(lat), float(lon))
        except Exception as e:
            print(f"[LOCATION] Database error for pincode {pincode}: {e}")
            # If table doesn't exist, return None to trigger web API fetch
            if "does not exist" in str(e) or "relation" in str(e):
                print(f"[LOCATION] Table pincode_locations doesn't exist, will fetch from web APIs")
        return None
    
    @staticmethod
    async def _fetch_and_store_coordinates(pincode: str) -> Optional[Tuple[float, float]]:
        """Fetch coordinates from web APIs and store in database"""
        # Try multiple APIs in order of preference
        apis = [
            LocationService._get_from_nominatim,
            LocationService._get_from_postalpincode,
            LocationService._get_from_geocoding_api
        ]
        
        for api_func in apis:
            try:
                coordinates = api_func(pincode)
                if coordinates:
                    # Store in database
                    await LocationService._store_coordinates_in_db(pincode, coordinates)
                    return coordinates
            except Exception as e:
                print(f"[LOCATION] API failed for pincode {pincode}: {e}")
                continue
        
        return None
    
    @staticmethod
    async def _store_coordinates_in_db(pincode: str, coordinates: Tuple[float, float]) -> bool:
        """Store coordinates in database pincode_locations table"""
        try:
            lat, lon = coordinates
            
            # Check if pincode already exists
            existing = await db.select("pincode_locations", filters={"pincode": pincode})
            
            if existing and len(existing) > 0:
                # Update existing record
                await db.update("pincode_locations", {
                    "latitude": lat,
                    "longitude": lon,
                    "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
                }, {"pincode": pincode})
                print(f"[LOCATION] Updated coordinates for pincode {pincode} in database")
            else:
                # Insert new record
                await db.insert("pincode_locations", {
                    "pincode": pincode,
                    "latitude": lat,
                    "longitude": lon,
                    "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "updated_at": dt.datetime.now(dt.timezone.utc).isoformat()
                })
                print(f"[LOCATION] Stored new coordinates for pincode {pincode} in database")
            
            return True
        except Exception as e:
            print(f"[LOCATION] Failed to store coordinates for pincode {pincode}: {e}")
            # If table doesn't exist, just skip storing and continue
            if "does not exist" in str(e) or "relation" in str(e):
                print(f"[LOCATION] Table pincode_locations doesn't exist, skipping database storage")
            return False
    
    @staticmethod
    def _get_from_nominatim(pincode: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from OpenStreetMap Nominatim API (free)"""
        try:
            print(f"[LOCATION] Trying Nominatim API for pincode {pincode}")
            response = requests.get(
                f"https://nominatim.openstreetmap.org/search",
                params={
                    'postalcode': pincode,
                    'countrycodes': 'in',
                    'format': 'json',
                    'limit': 1
                },
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
                timeout=15
            )
            
            print(f"[LOCATION] Nominatim response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[LOCATION] Nominatim response data: {data}")
                if data and len(data) > 0:
                    lat = float(data[0]['lat'])
                    lon = float(data[0]['lon'])
                    if lat != 0 and lon != 0:
                        print(f"[LOCATION] Nominatim found coordinates for {pincode}: {lat}, {lon}")
                        return (lat, lon)
                else:
                    print(f"[LOCATION] Nominatim returned empty results for {pincode}")
            else:
                print(f"[LOCATION] Nominatim returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[LOCATION] Nominatim API error for {pincode}: {e}")
        return None
    
    @staticmethod
    def _get_from_postalpincode(pincode: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from PostalPincode API"""
        try:
            print(f"[LOCATION] Trying PostalPincode API for pincode {pincode}")
            response = requests.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=15,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            
            print(f"[LOCATION] PostalPincode response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[LOCATION] PostalPincode response data: {data}")
                if data and len(data) > 0 and data[0].get('Status') == 'Success':
                    post_office = data[0]['PostOffice'][0]
                    city = post_office.get('District', '')
                    state = post_office.get('State', '')
                    
                    print(f"[LOCATION] PostalPincode found city: {city}, state: {state}")
                    
                    # Use city and state to get coordinates
                    if city and state:
                        coords = LocationService._get_coordinates_from_city_state(city, state)
                        if coords:
                            print(f"[LOCATION] PostalPincode found coordinates via city/state: {coords}")
                            return coords
                else:
                    print(f"[LOCATION] PostalPincode returned unsuccessful status: {data}")
            else:
                print(f"[LOCATION] PostalPincode returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[LOCATION] PostalPincode API error for {pincode}: {e}")
        return None
    
    @staticmethod
    def _get_from_geocoding_api(pincode: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from a generic geocoding service"""
        try:
            # Using a free geocoding service
            response = requests.get(
                f"https://geocode.xyz/{pincode},India?json=1",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('latt') and data.get('longt'):
                    lat = float(data['latt'])
                    lon = float(data['longt'])
                    return (lat, lon)
        except Exception as e:
            print(f"[LOCATION] Geocoding API error: {e}")
        return None
    
    @staticmethod
    def _get_coordinates_from_city_state(city: str, state: str) -> Optional[Tuple[float, float]]:
        """Get coordinates from city and state using Nominatim"""
        try:
            query = f"{city}, {state}, India"
            print(f"[LOCATION] Geocoding city/state: {query}")
            response = requests.get(
                f"https://nominatim.openstreetmap.org/search",
                params={
                    'q': query,
                    'format': 'json',
                    'limit': 1
                },
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
                timeout=15
            )
            
            print(f"[LOCATION] City/State geocoding response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[LOCATION] City/State geocoding response data: {data}")
                if data and len(data) > 0:
                    lat = float(data[0]['lat'])
                    lon = float(data[0]['lon'])
                    if lat != 0 and lon != 0:
                        print(f"[LOCATION] City/State geocoding found coordinates: {lat}, {lon}")
                        return (lat, lon)
                else:
                    print(f"[LOCATION] City/State geocoding returned empty results")
            else:
                print(f"[LOCATION] City/State geocoding returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[LOCATION] City/State geocoding error: {e}")
        return None
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        import math
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    @staticmethod
    async def get_properties_by_pincode(pincode: str, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """
        Get properties within a radius of the given pincode
        """
        try:
            # Get coordinates for the pincode
            coordinates = LocationService.get_coordinates_from_pincode(pincode)
            if not coordinates:
                return []
            
            target_lat, target_lon = coordinates
            
            # Get all properties with coordinates
            properties = await db.select("properties", filters={"status": "active"})
            
            nearby_properties = []
            for property in properties:
                prop_lat = property.get('latitude')
                prop_lon = property.get('longitude')
                
                # Skip properties without coordinates
                if prop_lat is None or prop_lon is None:
                    continue
                
                # Calculate distance
                distance = LocationService.calculate_distance(
                    target_lat, target_lon, prop_lat, prop_lon
                )
                
                # Add to nearby properties if within radius
                if distance <= radius_km:
                    property['distance_km'] = round(distance, 2)
                    nearby_properties.append(property)
            
            # Sort by distance
            nearby_properties.sort(key=lambda x: x.get('distance_km', float('inf')))
            
            return nearby_properties
            
        except Exception as e:
            print(f"[LOCATION] Error getting properties by pincode: {e}")
            return []
    
    @staticmethod
    async def update_property_coordinates(property_id: str, pincode: str) -> Dict[str, Any]:
        """
        Update property coordinates based on pincode
        """
        try:
            coordinates = LocationService.get_coordinates_from_pincode(pincode)
            if not coordinates:
                return {"success": False, "error": "Could not get coordinates for pincode"}
            
            lat, lon = coordinates
            
            # Update property with coordinates
            await db.update(
                "properties", 
                {"latitude": lat, "longitude": lon}, 
                {"id": property_id}
            )
            
            return {
                "success": True,
                "message": f"Coordinates updated for property",
                "latitude": lat,
                "longitude": lon
            }
            
        except Exception as e:
            print(f"[LOCATION] Error updating property coordinates: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_nearby_properties(latitude: float, longitude: float, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """
        Get properties within a radius of given coordinates
        """
        try:
            # Get all active properties
            properties = await db.select("properties", filters={"status": "active"})
            
            nearby_properties = []
            for property in properties:
                prop_lat = property.get('latitude')
                prop_lon = property.get('longitude')
                
                # Skip properties without coordinates
                if prop_lat is None or prop_lon is None:
                    continue
                
                # Calculate distance
                distance = LocationService.calculate_distance(
                    latitude, longitude, prop_lat, prop_lon
                )
                
                # Add to nearby properties if within radius
                if distance <= radius_km:
                    property['distance_km'] = round(distance, 2)
                    nearby_properties.append(property)
            
            # Sort by distance
            nearby_properties.sort(key=lambda x: x.get('distance_km', float('inf')))
            
            return nearby_properties
            
        except Exception as e:
            print(f"[LOCATION] Error getting nearby properties: {e}")
            return []
    
    @staticmethod
    def format_location_display(property: Dict[str, Any]) -> str:
        """
        Format property location for display
        """
        city = property.get('city', '')
        state = property.get('state', '')
        pincode = property.get('zip_code', '')
        
        location_parts = []
        if city:
            location_parts.append(city)
        if state:
            location_parts.append(state)
        if pincode:
            location_parts.append(pincode)
        
        return ', '.join(location_parts) if location_parts else 'Location not specified'
    
    @staticmethod
    async def get_properties_without_coordinates() -> List[Dict[str, Any]]:
        """
        Get properties that don't have coordinates set
        """
        try:
            properties = await db.select("properties", filters={"status": "active"})
            return [p for p in properties if p.get('latitude') is None or p.get('longitude') is None]
        except Exception as e:
            print(f"[LOCATION] Error getting properties without coordinates: {e}")
            return []
    
    @staticmethod
    async def get_pincode_details(pincode: str) -> Dict[str, Any]:
        """Get detailed location information for a pincode"""
        try:
            response = requests.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0 and data[0].get('Status') == 'Success':
                    post_office = data[0]['PostOffice'][0]
                    return {
                        "country": post_office.get('Country', 'India'),
                        "state": post_office.get('State', ''),
                        "district": post_office.get('District', ''),
                        "mandal": post_office.get('Name', ''),  # Name field is actually mandal
                        "city": post_office.get('Name', ''),  # For city field
                        "region": post_office.get('Region', ''),
                        "division": post_office.get('Division', ''),
                        "circle": post_office.get('Circle', ''),
                        "block": post_office.get('Block', ''),
                        "branch_type": post_office.get('BranchType', ''),
                        "delivery_status": post_office.get('DeliveryStatus', '')
                    }
        except Exception as e:
            print(f"[LOCATION] Error fetching pincode details: {e}")
        
        return {}
    
    @staticmethod
    async def get_pincode_location_data(pincode: str) -> Dict[str, Any]:
        """Get complete location data for property form auto-population"""
        try:
            print(f"[LOCATION] Fetching complete location data for pincode: {pincode}")
            
            # Try the postal pincode API first
            response = requests.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=15,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            
            print(f"[LOCATION] API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[LOCATION] API Response Data: {data}")
                
                if data and len(data) > 0 and data[0].get('Status') == 'Success':
                    post_office = data[0]['PostOffice'][0]
                    print(f"[LOCATION] Post Office Data: {post_office}")
                    
                    # Get coordinates using multiple methods
                    coordinates = await LocationService.get_coordinates_from_pincode(pincode)
                    print(f"[LOCATION] Coordinates: {coordinates}")
                    
                    # Create a comprehensive address from the location data
                    address_parts = []
                    if post_office.get('Name'):
                        address_parts.append(post_office.get('Name'))
                    if post_office.get('Block'):
                        address_parts.append(post_office.get('Block'))
                    if post_office.get('District'):
                        address_parts.append(post_office.get('District'))
                    if post_office.get('State'):
                        address_parts.append(post_office.get('State'))
                    
                    suggested_address = ", ".join(address_parts) if address_parts else ""
                    
                    location_data = {
                        "pincode": pincode,
                        "country": post_office.get('Country', 'India'),
                        "state": post_office.get('State', ''),
                        "district": post_office.get('District', ''),
                        "mandal": post_office.get('Name', ''),  # Name field is mandal
                        "city": post_office.get('Name', ''),  # For city field
                        "address": suggested_address,  # Auto-generated address
                        "region": post_office.get('Region', ''),
                        "division": post_office.get('Division', ''),
                        "circle": post_office.get('Circle', ''),
                        "block": post_office.get('Block', ''),
                        "latitude": coordinates[0] if coordinates else None,
                        "longitude": coordinates[1] if coordinates else None,
                        "coordinates": coordinates if coordinates else None,
                        "map_bounds": LocationService.calculate_pincode_bounds(coordinates[0], coordinates[1]) if coordinates else None,
                        "auto_populated": True,
                        "editable_fields": True,  # All fields can be edited
                        "suggested_fields": {
                            "country": post_office.get('Country', 'India'),
                            "state": post_office.get('State', ''),
                            "district": post_office.get('District', ''),
                            "mandal": post_office.get('Name', ''),
                            "city": post_office.get('Name', ''),
                            "address": suggested_address,
                            "latitude": coordinates[0] if coordinates else None,
                            "longitude": coordinates[1] if coordinates else None
                        }
                    }
                    
                    print(f"[LOCATION] Successfully fetched location data for pincode {pincode}")
                    return location_data
                else:
                    print(f"[LOCATION] API returned unsuccessful status: {data}")
            else:
                print(f"[LOCATION] API returned status {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"[LOCATION] Error fetching complete location data: {e}")
        
        # If postal API fails, try alternative geocoding methods
        print(f"[LOCATION] Trying alternative geocoding methods for pincode {pincode}")
        try:
            # Try to get coordinates and reverse geocode
            coordinates = await LocationService.get_coordinates_from_pincode(pincode)
            if coordinates:
                # Try to reverse geocode to get location details
                reverse_data = await LocationService._reverse_geocode_coordinates(coordinates[0], coordinates[1])
                if reverse_data:
                    location_data = {
                        "pincode": pincode,
                        "country": reverse_data.get('country', 'India'),
                        "state": reverse_data.get('state', ''),
                        "district": reverse_data.get('district', ''),
                        "mandal": reverse_data.get('mandal', ''),
                        "city": reverse_data.get('city', ''),
                        "address": reverse_data.get('address', ''),
                        "latitude": coordinates[0],
                        "longitude": coordinates[1],
                        "coordinates": coordinates,
                        "map_bounds": LocationService.calculate_pincode_bounds(coordinates[0], coordinates[1]),
                        "auto_populated": True,
                        "editable_fields": True,
                        "suggested_fields": {
                            "country": reverse_data.get('country', 'India'),
                            "state": reverse_data.get('state', ''),
                            "district": reverse_data.get('district', ''),
                            "mandal": reverse_data.get('mandal', ''),
                            "city": reverse_data.get('city', ''),
                            "address": reverse_data.get('address', ''),
                            "latitude": coordinates[0],
                            "longitude": coordinates[1]
                        }
                    }
                    print(f"[LOCATION] Successfully fetched location data via reverse geocoding for pincode {pincode}")
                    return location_data
        except Exception as e:
            print(f"[LOCATION] Reverse geocoding failed: {e}")
        
        # Last resort: Return error with pincode info
        return {
            "pincode": pincode,
            "error": f"No location data found for pincode {pincode}",
            "auto_populated": False,
            "suggested_fields": {
                "country": "India",
                "state": "",
                "district": "",
                "mandal": "",
                "city": "",
                "address": "",
                "latitude": None,
                "longitude": None
            }
        }
    
    @staticmethod
    async def _reverse_geocode_coordinates(lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Reverse geocode coordinates to get location details"""
        try:
            # Use Nominatim for reverse geocoding
            response = requests.get(
                f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1",
                timeout=10,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            
            if response.status_code == 200:
                data = response.json()
                address = data.get('address', {})
                
                return {
                    'country': address.get('country', 'India'),
                    'state': address.get('state', ''),
                    'district': address.get('county', '') or address.get('district', ''),
                    'mandal': address.get('suburb', '') or address.get('village', ''),
                    'city': address.get('city', '') or address.get('town', '') or address.get('village', ''),
                    'address': data.get('display_name', '')
                }
        except Exception as e:
            print(f"[LOCATION] Reverse geocoding error: {e}")
        
        return None
    
    @staticmethod
    def _get_fallback_pincode_data(pincode: str) -> Optional[Dict[str, Any]]:
        """Get fallback pincode data for common pincodes"""
        fallback_mappings = {
            '500090': {
                'state': 'Telangana',
                'district': 'Hyderabad',
                'mandal': 'Serilingampally',
                'city': 'Hyderabad',
                'address': 'Serilingampally, Hyderabad, Telangana',
                'latitude': 17.3850,
                'longitude': 78.4867
            },
            '500001': {
                'state': 'Telangana',
                'district': 'Hyderabad',
                'mandal': 'Secunderabad',
                'city': 'Hyderabad',
                'address': 'Secunderabad, Hyderabad, Telangana',
                'latitude': 17.4399,
                'longitude': 78.4983
            },
            '500002': {
                'state': 'Telangana',
                'district': 'Hyderabad',
                'mandal': 'Khairatabad',
                'city': 'Hyderabad',
                'address': 'Khairatabad, Hyderabad, Telangana',
                'latitude': 17.4065,
                'longitude': 78.4772
            },
            '500003': {
                'state': 'Telangana',
                'district': 'Hyderabad',
                'mandal': 'Himayathnagar',
                'city': 'Hyderabad',
                'address': 'Himayathnagar, Hyderabad, Telangana',
                'latitude': 17.4065,
                'longitude': 78.4772
            },
            '500004': {
                'state': 'Telangana',
                'district': 'Hyderabad',
                'mandal': 'Abids',
                'city': 'Hyderabad',
                'address': 'Abids, Hyderabad, Telangana',
                'latitude': 17.4065,
                'longitude': 78.4772
            }
        }
        
        if pincode in fallback_mappings:
            data = fallback_mappings[pincode]
            return {
                "pincode": pincode,
                "country": "India",
                "state": data['state'],
                "district": data['district'],
                "mandal": data['mandal'],
                "city": data['city'],
                "address": data['address'],
                "latitude": data['latitude'],
                "longitude": data['longitude'],
                "coordinates": (data['latitude'], data['longitude']),
                "map_bounds": LocationService.calculate_pincode_bounds(data['latitude'], data['longitude']),
                "auto_populated": True,
                "editable_fields": True,
                "suggested_fields": {
                    "country": "India",
                    "state": data['state'],
                    "district": data['district'],
                    "mandal": data['mandal'],
                    "city": data['city'],
                    "address": data['address'],
                    "latitude": data['latitude'],
                    "longitude": data['longitude']
                }
            }
        
        return None
    
    @staticmethod
    def calculate_pincode_bounds(lat: float, lon: float, radius_km: float = 5.0) -> Dict[str, float]:
        """Calculate map bounds for a pincode area"""
        import math
        
        # Convert radius from km to degrees (approximate)
        lat_delta = radius_km / 111.0  # 1 degree latitude ≈ 111 km
        lon_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
        
        return {
            "north": lat + lat_delta,
            "south": lat - lat_delta,
            "east": lon + lon_delta,
            "west": lon - lon_delta,
            "center_lat": lat,
            "center_lon": lon,
            "radius_km": radius_km
        }
