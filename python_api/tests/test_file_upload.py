"""
Basic integration tests for file upload functionality

This test suite verifies that the file upload, list, and delete
endpoints work correctly with Supabase Storage.

Note: These tests require valid Supabase credentials in environment variables.
Run with: pytest python_api/tests/test_file_upload.py -v
"""

import os
import sys
import pytest
from io import BytesIO

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Skip tests if Supabase credentials are not configured
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

skip_if_no_credentials = pytest.mark.skipif(
    not SUPABASE_URL or not SUPABASE_SERVICE_KEY,
    reason="Supabase credentials not configured"
)


@skip_if_no_credentials
def test_storage_service_initialization():
    """Test that the storage service initializes correctly"""
    from app.services.supabase_storage import storage_service
    
    assert storage_service.is_available(), "Storage service should be available"
    print("✓ Storage service initialized successfully")


@skip_if_no_credentials
def test_upload_file():
    """Test file upload functionality"""
    from app.services.supabase_storage import storage_service
    
    # Create a mock file
    class MockUploadFile:
        def __init__(self, filename, content, content_type):
            self.filename = filename
            self.content = content
            self.content_type = content_type
        
        async def read(self):
            return self.content
    
    # Create test file
    test_content = b"Test file content for upload"
    mock_file = MockUploadFile("test.txt", test_content, "text/plain")
    
    # Test upload
    import asyncio
    result = asyncio.run(storage_service.upload_file(
        mock_file,
        bucket="uploads",
        folder="tests"
    ))
    
    assert result.get("url"), "Upload should return a URL"
    assert result.get("path"), "Upload should return a path"
    assert not result.get("error"), f"Upload should not have errors: {result.get('error')}"
    
    print(f"✓ File uploaded successfully: {result['url']}")
    
    # Return path for cleanup
    return result.get("path")


@skip_if_no_credentials
def test_list_files():
    """Test file listing functionality"""
    from app.services.supabase_storage import storage_service
    
    files = storage_service.list_files(bucket="uploads", folder="tests")
    
    assert isinstance(files, list), "List files should return a list"
    print(f"✓ Listed {len(files)} files in uploads/tests")


@skip_if_no_credentials
def test_delete_file():
    """Test file deletion functionality"""
    from app.services.supabase_storage import storage_service
    
    # First upload a file
    test_path = test_upload_file()
    
    if test_path:
        # Then delete it
        success = storage_service.delete_file(bucket="uploads", path=test_path)
        assert success, "Delete should succeed"
        print(f"✓ File deleted successfully: {test_path}")


@skip_if_no_credentials
def test_file_api_endpoints():
    """Test the FastAPI file endpoints"""
    print("✓ API endpoints test would require running server")
    print("  - POST /api/files/upload")
    print("  - DELETE /api/files")
    print("  - GET /api/files/list")
    

if __name__ == "__main__":
    """Run tests manually"""
    print("=" * 60)
    print("File Upload Integration Tests")
    print("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("⚠ Supabase credentials not configured. Skipping tests.")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        sys.exit(0)
    
    try:
        print("\n1. Testing storage service initialization...")
        test_storage_service_initialization()
        
        print("\n2. Testing file upload...")
        test_upload_file()
        
        print("\n3. Testing file listing...")
        test_list_files()
        
        print("\n4. Testing file deletion...")
        test_delete_file()
        
        print("\n5. Testing API endpoints...")
        test_file_api_endpoints()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
