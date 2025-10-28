"""
File Upload/Management Routes

Provides endpoints for uploading, deleting, and listing files in Supabase Storage.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
import logging

from ..services.supabase_storage import storage_service
from ..core.auth import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/files", tags=["files"])


class DeleteFileRequest(BaseModel):
    path: str
    bucket: str = "property-images"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    bucket: str = Form("property-images"),
    folder: str = Form(""),
    current_user = Depends(get_current_user_optional)
):
    """
    Upload a file to Supabase Storage
    
    - **file**: File to upload (multipart/form-data)
    - **bucket**: Target bucket name (default: property-images)
    - **folder**: Optional folder path within bucket
    
    Returns the public URL and storage path of the uploaded file.
    """
    try:
        logger.info(f"File upload request: bucket={bucket}, folder={folder}, filename={file.filename}")
        
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate bucket name (whitelist for security)
        allowed_buckets = ["property-images", "profile-images", "documents", "images", "uploads"]
        if bucket not in allowed_buckets:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid bucket. Allowed: {', '.join(allowed_buckets)}"
            )
        
        # Upload file
        result = await storage_service.upload_file(file, bucket, folder)
        
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])
        
        logger.info(f"File uploaded successfully: {result['url']}")
        
        return {
            "success": True,
            "url": result["url"],
            "path": result["path"],
            "bucket": result["bucket"],
            "filename": result.get("filename"),
            "content_type": result.get("content_type")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in upload_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("")
async def delete_file(
    request: DeleteFileRequest,
    current_user = Depends(get_current_user_optional)
):
    """
    Delete a file from Supabase Storage
    
    - **path**: File path within bucket
    - **bucket**: Bucket name
    """
    try:
        logger.info(f"File delete request: bucket={request.bucket}, path={request.path}")
        
        success = storage_service.delete_file(request.bucket, request.path)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete file")
        
        return {"success": True, "message": "File deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_files(
    bucket: str = "property-images",
    folder: str = "",
    current_user = Depends(get_current_user_optional)
):
    """
    List files in a bucket/folder
    
    - **bucket**: Bucket name
    - **folder**: Optional folder path
    """
    try:
        logger.info(f"File list request: bucket={bucket}, folder={folder}")
        
        files = storage_service.list_files(bucket, folder)
        
        return {
            "success": True,
            "bucket": bucket,
            "folder": folder,
            "files": files
        }
        
    except Exception as e:
        logger.error(f"Error in list_files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
