import requests
import json
import sys
import os

# Add the parent directory to the sys.path to allow importing app.main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def test_property_update():
    """Test the property update API endpoint"""
    
    # Test data for updating a property
    test_property_id = "test-property-id"  # This will fail, but we can see the error
    update_data = {
        "title": "Updated Test Property",
        "description": "This is an updated test property",
        "price": 1500000,
        "property_type": "standalone_apartment",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1200,
        "address": "Updated Test Address",
        "city": "Hyderabad",
        "state": "Telangana",
        "zip_code": "500001",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "status": "active",
        "featured": True,
        "verified": True,
        "listing_type": "SALE"
    }
    
    print("Testing property update API...")
    print(f"Property ID: {test_property_id}")
    print(f"Update data: {json.dumps(update_data, indent=2)}")
    
    try:
        # Test the API endpoint
        url = f"https://homeandown-backend.onrender.com/api/properties/{test_property_id}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": "your-api-key-here"  # Replace with actual API key
        }
        
        print(f"Making PUT request to: {url}")
        response = requests.put(url, json=update_data, headers=headers, timeout=10)
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_property_update()
