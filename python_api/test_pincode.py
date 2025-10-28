#!/usr/bin/env python3
"""
Test script to verify pincode API functionality
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def test_pincode_api():
    """Test the pincode API functionality"""
    try:
        from app.services.location_service import LocationService
        
        print("Testing pincode API functionality...")
        
        # Test pincode: 500090 (Hyderabad)
        pincode = "500090"
        print(f"Testing pincode: {pincode}")
        
        # Test the location service
        location_data = await LocationService.get_pincode_location_data(pincode)
        
        print(f"Location data received: {location_data}")
        
        if location_data.get('auto_populated'):
            suggestions = location_data.get('suggested_fields', {})
            print(f"Suggested fields:")
            print(f"  - Country: {suggestions.get('country')}")
            print(f"  - State: {suggestions.get('state')}")
            print(f"  - District: {suggestions.get('district')}")
            print(f"  - Mandal: {suggestions.get('mandal')}")
            print(f"  - City: {suggestions.get('city')}")
            print(f"  - Address: {suggestions.get('address')}")
            print(f"  - Latitude: {suggestions.get('latitude')}")
            print(f"  - Longitude: {suggestions.get('longitude')}")
            
            return True
        else:
            print(f"Failed to get location data: {location_data}")
            return False
            
    except Exception as e:
        print(f"Error testing pincode API: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_pincode_api())
    if result:
        print("✅ Pincode API test passed!")
    else:
        print("❌ Pincode API test failed!")
