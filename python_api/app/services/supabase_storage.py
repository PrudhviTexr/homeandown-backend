"""
Supabase Storage Service for server-side file operations

This service provides server-side file upload/download/delete operations
using Supabase Storage with the service role key for administrative access.
"""

import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

class SupabaseStorageService:
    """Server-side Supabase Storage operations using service role key"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_service_key:
            logger.warning("Supabase credentials not configured for storage service")
            self.client = None
            return
            
        try:
            self.client: Client = create_client(supabase_url, supabase_service_key)
            logger.info("Supabase Storage Service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase Storage Service: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if storage service is available"""
        return self.client is not None
    
    async def upload_file(
        self, 
        file: UploadFile, 
        bucket: str, 
        folder: str = ""
    ) -> Dict[str, Any]:
        """
        Upload a file to Supabase Storage
        
        Args:
            file: FastAPI UploadFile instance
            bucket: Bucket name (e.g., 'property-images', 'profile-images')
            folder: Optional folder path within bucket
            
        Returns:
            Dict with 'url', 'path', and optional 'error'
        """
        if not self.is_available():
            return {"error": "Storage service not available", "url": "", "path": ""}
        
        try:
            # Read file content
            contents = await file.read()
            
            # Generate unique filename
            import time
            import random
            import string
            file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
            filename = f"{int(time.time())}-{random_str}.{file_ext}"
            file_path = f"{folder}/{filename}" if folder else filename
            
            logger.info(f"Uploading file to {bucket}/{file_path}")
            
            # Upload to Supabase Storage
            response = self.client.storage.from_(bucket).upload(
                path=file_path,
                file=contents,
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(bucket).get_public_url(file_path)
            
            logger.info(f"File uploaded successfully: {public_url}")
            
            return {
                "url": public_url,
                "path": file_path,
                "bucket": bucket,
                "filename": filename,
                "content_type": file.content_type
            }
            
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return {"error": str(e), "url": "", "path": ""}
    
    def delete_file(self, bucket: str, path: str) -> bool:
        """
        Delete a file from Supabase Storage
        
        Args:
            bucket: Bucket name
            path: File path within bucket
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_available():
            logger.error("Storage service not available")
            return False
        
        try:
            logger.info(f"Deleting file: {bucket}/{path}")
            self.client.storage.from_(bucket).remove([path])
            logger.info(f"File deleted successfully: {bucket}/{path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def list_files(self, bucket: str, folder: str = "") -> List[Dict[str, Any]]:
        """
        List files in a bucket/folder
        
        Args:
            bucket: Bucket name
            folder: Optional folder path
            
        Returns:
            List of file metadata dictionaries
        """
        if not self.is_available():
            logger.error("Storage service not available")
            return []
        
        try:
            logger.info(f"Listing files in {bucket}/{folder}")
            files = self.client.storage.from_(bucket).list(folder)
            return files
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def get_public_url(self, bucket: str, path: str) -> Optional[str]:
        """
        Get public URL for a file
        
        Args:
            bucket: Bucket name
            path: File path within bucket
            
        Returns:
            Public URL or None if error
        """
        if not self.is_available():
            return None
        
        try:
            return self.client.storage.from_(bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Error getting public URL: {e}")
            return None


# Global instance
storage_service = SupabaseStorageService()
