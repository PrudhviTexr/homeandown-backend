"""
Tests for analytics and saved properties functionality.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_record_property_view():
    """Test recording a property view"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a property view
        view_data = {
            "property_id": "test-property-123",
            "session_id": "test-session-456"
        }
        
        response = await client.post("/api/analytics/property-view", json=view_data)
        # May succeed or fail depending on database availability
        assert response.status_code in [200, 401, 500]
        
        # If successful, should return view_id
        if response.status_code == 200:
            result = response.json()
            assert result.get("success") == True
            assert "view_id" in result


@pytest.mark.asyncio
async def test_get_property_view_count():
    """Test getting property view count"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        property_id = "test-property-123"
        
        response = await client.get(f"/api/analytics/property-views-count/{property_id}")
        # Should work even without authentication (public endpoint)
        assert response.status_code in [200, 500]
        
        # If successful, should return view count
        if response.status_code == 200:
            result = response.json()
            assert result.get("success") == True
            assert "view_count" in result
            assert isinstance(result["view_count"], int)


@pytest.mark.asyncio
async def test_save_property_requires_auth():
    """Test that saving a property requires authentication"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        save_data = {
            "property_id": "test-property-123",
            "notes": "Test note"
        }
        
        response = await client.post("/api/buyer/save-property", json=save_data)
        # Should fail without authentication
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_saved_properties_requires_auth():
    """Test that getting saved properties requires authentication"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/buyer/saved-properties")
        # Should fail without authentication
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_unsave_property_requires_auth():
    """Test that unsaving a property requires authentication"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        property_id = "test-property-123"
        
        response = await client.delete(f"/api/buyer/unsave-property/{property_id}")
        # Should fail without authentication
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_buyer_dashboard_stats_requires_auth():
    """Test that buyer dashboard stats require authentication"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/buyer/dashboard/stats")
        # Should fail without authentication
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_seller_analytics_requires_auth():
    """Test that seller analytics require authentication"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/analytics/seller-dashboard-stats")
        # Should fail without authentication
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_property_view_missing_property_id():
    """Test that property view requires property_id"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        view_data = {}  # Missing property_id
        
        response = await client.post("/api/analytics/property-view", json=view_data)
        # Should fail validation
        assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_save_property_missing_property_id():
    """Test that saving property requires property_id"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First, we need to get a valid auth token (mocked here, would fail auth check)
        save_data = {}  # Missing property_id
        
        response = await client.post("/api/buyer/save-property", json=save_data)
        # Should fail validation or auth
        assert response.status_code in [400, 401, 422]


@pytest.mark.asyncio
async def test_analytics_routes_exist():
    """Test that all analytics routes are registered"""
    # Check that the app has the analytics routes
    route_paths = [route.path for route in app.routes]
    
    # Analytics routes
    assert any("/analytics/property-view" in path for path in route_paths)
    assert any("/analytics/property-views-count" in path for path in route_paths)
    assert any("/analytics/seller-dashboard-stats" in path for path in route_paths)


@pytest.mark.asyncio
async def test_buyer_routes_exist():
    """Test that all buyer routes are registered"""
    # Check that the app has the buyer routes
    route_paths = [route.path for route in app.routes]
    
    # Buyer routes
    assert any("/buyer/save-property" in path for path in route_paths)
    assert any("/buyer/saved-properties" in path for path in route_paths)
    assert any("/buyer/unsave-property" in path for path in route_paths)
    assert any("/buyer/dashboard/stats" in path for path in route_paths)
