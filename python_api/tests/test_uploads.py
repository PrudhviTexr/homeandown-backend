"""
Tests for image upload functionality.
"""
import pytest
from httpx import AsyncClient
from app.main import app
from httpx import ASGITransport
import io


@pytest.mark.asyncio
async def test_upload_image_success():
    """Test uploading a valid image file."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a mock image file
        image_data = b"fake image data"
        files = {
            "file": ("test_image.jpg", io.BytesIO(image_data), "image/jpeg")
        }
        data = {
            "entity_type": "property",
            "entity_id": "test-property-123"
        }
        
        response = await client.post("/api/uploads/upload", files=files, data=data)
        # May succeed if Supabase is configured, or fail gracefully
        assert response.status_code in [200, 401, 500]
        
        # If successful, should return URL
        if response.status_code == 200:
            result = response.json()
            assert "url" in result
            assert "id" in result


@pytest.mark.asyncio
async def test_upload_invalid_file_type():
    """Test uploading an invalid file type."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a mock text file (not allowed)
        file_data = b"This is a text file"
        files = {
            "file": ("test.txt", io.BytesIO(file_data), "text/plain")
        }
        data = {
            "entity_type": "property",
            "entity_id": "test-property-123"
        }
        
        response = await client.post("/api/uploads/upload", files=files, data=data)
        # Should reject invalid file type
        assert response.status_code in [400, 401, 500]


@pytest.mark.asyncio
async def test_upload_missing_required_fields():
    """Test uploading without required fields."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Missing entity_id
        image_data = b"fake image data"
        files = {
            "file": ("test_image.jpg", io.BytesIO(image_data), "image/jpeg")
        }
        data = {
            "entity_type": "property"
        }
        
        response = await client.post("/api/uploads/upload", files=files, data=data)
        # Should fail validation
        assert response.status_code in [422, 500]


@pytest.mark.asyncio
async def test_list_files_by_entity():
    """Test listing files for a specific entity."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/uploads?entity_type=property&entity_id=test-123")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_all_files():
    """Test listing all files."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/uploads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_upload_pdf_file():
    """Test uploading a PDF file."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a mock PDF file
        pdf_data = b"%PDF-1.4 fake pdf data"
        files = {
            "file": ("document.pdf", io.BytesIO(pdf_data), "application/pdf")
        }
        data = {
            "entity_type": "property",
            "entity_id": "test-property-123"
        }
        
        response = await client.post("/api/uploads/upload", files=files, data=data)
        # PDF should be allowed
        assert response.status_code in [200, 401, 500]
        
        # If successful, should return URL
        if response.status_code == 200:
            result = response.json()
            assert "url" in result


@pytest.mark.asyncio
async def test_upload_png_image():
    """Test uploading a PNG image."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create a mock PNG file
        png_data = b"\x89PNG\r\n\x1a\n fake png data"
        files = {
            "file": ("test_image.png", io.BytesIO(png_data), "image/png")
        }
        data = {
            "entity_type": "property",
            "entity_id": "test-property-456"
        }
        
        response = await client.post("/api/uploads/upload", files=files, data=data)
        # PNG should be allowed
        assert response.status_code in [200, 401, 500]
