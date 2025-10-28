#!/usr/bin/env python3
"""
Test script for pincode API functionality
"""
import asyncio
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.location_service import LocationService

async def test_pincode_api():
    """Test the pincode API with various pincodes"""
    test_pincodes = [
        "500072",  # The failing pincode from the user
        "500090",  # Known working pincode
        "500001",  # Another known pincode
        "110001",  # Delhi pincode
        "400001"   # Mumbai pincode
    ]
    
    for pincode in test_pincodes:
        print(f"\n{'='*50}")
        print(f"Testing pincode: {pincode}")
        print(f"{'='*50}")
        
        try:
            # Test the main location data function
            result = await LocationService.get_pincode_location_data(pincode)
            print(f"Result: {result}")
            
            if result.get('error'):
                print(f"❌ Error: {result['error']}")
            else:
                print(f"✅ Success!")
                print(f"   State: {result.get('state', 'N/A')}")
                print(f"   District: {result.get('district', 'N/A')}")
                print(f"   Mandal: {result.get('mandal', 'N/A')}")
                print(f"   City: {result.get('city', 'N/A')}")
                print(f"   Address: {result.get('address', 'N/A')}")
                print(f"   Coordinates: {result.get('coordinates', 'N/A')}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        print(f"{'='*50}")

if __name__ == "__main__":
    asyncio.run(test_pincode_api())
