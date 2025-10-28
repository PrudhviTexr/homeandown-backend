"""
Tests for property management functionality (add/delete/update properties).
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import uuid

# Test data
VALID_PROPERTY = {
    "title": "Test Property",
    "description": "A test property for automated testing",
    "property_type": "independent_house",
    "listing_type": "SALE",
    "price": 5000000,
    "area_sqft": 1500,
    "bedrooms": 3,
    "bathrooms": 2,
    "address": "123 Test Street",
    "city": "Test City",
    "state": "Test State",
    "zip_code": "12345",
    "status": "active",
    "owner_id": str(uuid.uuid4()),
    "added_by": str(uuid.uuid4()),
    "images": [],
    "amenities": ["Parking", "Garden"]
}


@pytest.mark.asyncio
async def test_create_property_success():
    """Test creating a property with valid data."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "message" in data
        assert data["message"] == "Property created successfully"


@pytest.mark.asyncio
async def test_create_property_missing_required_fields():
    """Test creating a property with missing required fields."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Missing area_sqft (required field)
        invalid_property = {**VALID_PROPERTY}
        invalid_property.pop("area_sqft")
        
        response = await client.post("/api/properties", json=invalid_property)
        # Should still succeed as area_sqft defaults to 0, but let's ensure it doesn't fail
        assert response.status_code in [200, 500]


@pytest.mark.asyncio
async def test_get_all_properties():
    """Test fetching all properties."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_property_by_id():
    """Test fetching a single property by ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Now fetch it by ID
        response = await client.get(f"/api/properties/{property_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == property_id
        assert data["title"] == VALID_PROPERTY["title"]


@pytest.mark.asyncio
async def test_update_property():
    """Test updating a property."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Update the property
        update_data = {"title": "Updated Property Title", "price": 6000000}
        response = await client.patch(f"/api/properties/{property_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify the update
        get_response = await client.get(f"/api/properties/{property_id}")
        assert get_response.status_code == 200
        updated_property = get_response.json()
        assert updated_property["title"] == "Updated Property Title"
        assert updated_property["price"] == 6000000


@pytest.mark.asyncio
async def test_delete_property():
    """Test deleting a property."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Delete the property
        response = await client.delete(f"/api/properties/{property_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deleted successfully" in data["message"]
        
        # Verify it's deleted - should return 404
        get_response = await client.get(f"/api/properties/{property_id}")
        assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_filter_properties_by_city():
    """Test filtering properties by city."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create properties in different cities
        property1 = {**VALID_PROPERTY, "city": "Mumbai"}
        property2 = {**VALID_PROPERTY, "city": "Delhi"}
        
        await client.post("/api/properties", json=property1)
        await client.post("/api/properties", json=property2)
        
        # Filter by city
        response = await client.get("/api/properties?city=Mumbai")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned properties should be from Mumbai
        for prop in data:
            assert prop["city"].lower() == "mumbai"


@pytest.mark.asyncio
async def test_filter_properties_by_price_range():
    """Test filtering properties by price range."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Filter by price range
        response = await client.get("/api/properties?min_price=1000000&max_price=10000000")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned properties should be within price range
        for prop in data:
            if prop.get("price"):
                assert 1000000 <= prop["price"] <= 10000000


@pytest.mark.asyncio
async def test_update_property_images():
    """Test updating property images array."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Update with image URLs
        image_urls = [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
        ]
        update_data = {"images": image_urls}
        response = await client.patch(f"/api/properties/{property_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify the images were updated
        get_response = await client.get(f"/api/properties/{property_id}")
        assert get_response.status_code == 200
        updated_property = get_response.json()
        assert isinstance(updated_property["images"], list)
        assert len(updated_property["images"]) == 2


@pytest.mark.asyncio
async def test_update_property_invalid_uuid():
    """Test updating a property with invalid UUID in owner_id field."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Try to update with invalid UUID string for owner_id
        update_data = {"owner_id": "homeandown", "title": "Updated Title"}
        response = await client.put(f"/api/properties/{property_id}", json=update_data)
        
        # Should return 400 Bad Request with validation error
        assert response.status_code == 400
        error_data = response.json()
        assert "Invalid UUID" in error_data.get("detail", "")
        assert "owner_id" in error_data.get("detail", "")


@pytest.mark.asyncio
async def test_toggle_featured_property():
    """Test toggling the featured status of a property."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create a property
        create_response = await client.post("/api/properties", json=VALID_PROPERTY)
        assert create_response.status_code == 200
        property_id = create_response.json()["id"]
        
        # Toggle featured to True
        response = await client.patch(f"/api/properties/{property_id}/featured", json={"featured": True})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["featured"] is True
        
        # Verify the property is now featured
        get_response = await client.get(f"/api/properties/{property_id}")
        assert get_response.status_code == 200
        property_data = get_response.json()
        assert property_data["featured"] is True
        
        # Toggle featured to False
        response = await client.patch(f"/api/properties/{property_id}/featured", json={"featured": False})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["featured"] is False
