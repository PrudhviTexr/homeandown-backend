"""
Location Service
Handles property location by pincode with radius search
"""

import asyncio
import requests
from typing import Dict, List, Optional, Any, Tuple
from ..db.supabase_client import db

class LocationService:
    """Service for handling property locations and pincode-based searches"""
    
    # Indian pincode to coordinates mapping (sample data)
    PINCODE_COORDINATES = {
        "400050": (19.0760, 72.8777),  # Mumbai
        "500033": (17.3850, 78.4867),  # Hyderabad
        "500034": (17.3850, 78.4867),  # Hyderabad
        "500045": (17.3850, 78.4867),  # Hyderabad
        "110049": (28.6139, 77.2090),  # Delhi
        "535270": (17.6868, 83.2185),  # Visakhapatnam
        # Add more pincodes as needed
    }
    
    @staticmethod
    def get_coordinates_from_pincode(pincode: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates from pincode
        Returns (latitude, longitude) or None if not found
        """
        if not pincode:
            return None
        
        # Clean pincode
        pincode = str(pincode).strip()
        
        # Check our local mapping first
        if pincode in LocationService.PINCODE_COORDINATES:
            return LocationService.PINCODE_COORDINATES[pincode]
        
        # Try to get from external API (you can integrate with Google Maps API, etc.)
        try:
            # Example using a free geocoding service
            # You can replace this with Google Maps API or other services
            response = requests.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0 and data[0].get('Status') == 'Success':
                    # Extract coordinates from response (this is a simplified example)
                    # You might need to use a different geocoding service for actual coordinates
                    pass
        except Exception as e:
            print(f"[LOCATION] Error fetching coordinates for pincode {pincode}: {e}")
        
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
