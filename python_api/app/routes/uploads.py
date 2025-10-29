from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from ..core.security import require_api_key, try_get_current_user_claims # Use the new optional auth
from ..db.supabase_client import db
import os
import uuid
import datetime as dt
from typing import Optional

router = APIRouter()


def _get_storage_bucket():
    return os.getenv("SUPABASE_STORAGE_BUCKET", "property-images")

async def ensure_bucket_exists(bucket: str, public: bool = True):
    """Ensure the storage bucket exists in Supabase"""
    # Skip bucket creation in production - assume it's already set up
    # The bucket should be created manually in Supabase dashboard
    print(f"[DB] Assuming bucket exists: {bucket}")
    return True

async def upload_file_to_storage(
    file: UploadFile,
    entity_id: str,
    entity_type: str,
    document_category: str,
    uploaded_by: Optional[str] = None
):
    """Reusable function to upload a file to Supabase Storage and record metadata."""
    print(f"[UPLOAD] Uploading file: {file.filename} for {entity_type}:{entity_id}, category: {document_category}, uploaded_by: {uploaded_by}")

    # allow any image type broadly and pdfs
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    content = await file.read()
    ext = os.path.splitext(file.filename or "")[1] or ""
    filename = f"{uuid.uuid4().hex}{ext}"

    # Determine bucket based on entity type
    if entity_type in ['property', 'property_images']:
        bucket = 'property-images'
        object_path = filename
        normalized_entity_type = 'property'
    elif entity_type in ['user', 'user_documents']:
        bucket = 'documents'
        object_path = filename
        normalized_entity_type = 'user'
    else:
        bucket = _get_storage_bucket()
        object_path = filename
        normalized_entity_type = entity_type

    await ensure_bucket_exists(bucket)

    try:
        await db.upload_to_storage(bucket, object_path, content, content_type=file.content_type)
    except Exception as e:
        print(f"[UPLOAD] Storage upload failed: {e}")
        import traceback
        print(f"[UPLOAD] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")

    # Get public URL
    try:
        public_url = await db.get_public_url(bucket, object_path)
    except Exception as e:
        print(f"[UPLOAD] Failed to build public URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to obtain public URL")

    # Store document record
    # For uploaded_by, we need a user ID. If not provided and entity_type is 'property',
    # we should skip setting uploaded_by or use a system default
    final_uploaded_by = uploaded_by
    if not final_uploaded_by:
        # If uploading for a user, use the user's ID
        if normalized_entity_type == 'user':
            final_uploaded_by = entity_id
        # For property uploads, uploaded_by should come from the request context
        # If not available, set to None (will need to be handled by DB schema)
        else:
            final_uploaded_by = None
    
    doc_data = {
        "id": str(uuid.uuid4()), # Generate a UUID for the new document record
        "name": file.filename or filename,
        "file_path": public_url,
        "file_type": file.content_type,
        "file_size": len(content),
        "entity_type": normalized_entity_type,
        "entity_id": entity_id,
        "uploaded_by": final_uploaded_by,
        "document_category": document_category or None,
        "status": "pending",
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }

    try:
        result = await db.insert("documents", doc_data)
        print(f"[UPLOAD] Document uploaded successfully: {public_url}, entity: {entity_type}:{entity_id}")
        return result[0] if result else None
    except Exception as insert_error:
        print(f"[UPLOAD] Failed to insert document record: {insert_error}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to record document metadata")


@router.post("/upload")
async def upload_file(
    entity_type: str = Form(...),
    entity_id: str = Form(""),
    document_category: str = Form(""),
    file: UploadFile = File(...),
    claims: dict = Depends(try_get_current_user_claims) # Use the new dependency
):
    """
    User-facing endpoint to upload a file.
    The user's ID is automatically used as entity_id and uploaded_by if available.
    """
    try:
        current_user_id = claims.get("sub") if claims else None
        
        # Prioritize authenticated user, but allow entity_id from form for signups
        final_entity_id = entity_id or current_user_id
        if not final_entity_id:
            raise HTTPException(status_code=400, detail="entity_id is required for anonymous uploads.")

        # uploaded_by should be the authenticated user if available
        # For property uploads, if no auth user, try to get owner_id from property
        uploader = current_user_id
        if not uploader and entity_type in ['property', 'property_images']:
            # Try to fetch the property's owner_id to use as uploaded_by
            try:
                property_data = await db.select("properties", filters={"id": final_entity_id})
                if property_data and len(property_data) > 0:
                    uploader = property_data[0].get('owner_id') or property_data[0].get('added_by')
            except Exception as e:
                print(f"[UPLOAD] Could not fetch property owner: {e}")
        
        # Fallback to entity_id only if it's a user upload
        if not uploader:
            if entity_type in ['user', 'user_documents']:
                uploader = final_entity_id
            else:
                # Last resort: use a system/admin ID or raise error
                raise HTTPException(status_code=401, detail="Authentication required for file uploads")

        result_doc = await upload_file_to_storage(
            file=file,
            entity_id=final_entity_id,
            entity_type=entity_type,
            document_category=document_category,
            uploaded_by=uploader
        )
        
        if result_doc:
            # Ensure the response has a 'url' key for frontend compatibility
            return {"success": True, "id": result_doc.get('id'), "url": result_doc.get('file_path')}
        else:
            raise HTTPException(status_code=500, detail="Failed to get document details after upload.")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD] User upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")


@router.get("/{doc_id}")
async def get_file(doc_id: str):
    """Lookup the document record and redirect to its public URL in Supabase Storage."""
    try:
        # Look up document in DB
        docs = await db.select("documents", filters={"id": doc_id})
        if not docs:
            raise HTTPException(status_code=404, detail="File not found")

        doc = docs[0]
        # Use file_path field instead of url
        public_url = doc.get('file_path')
        if not public_url:
            print(f"[UPLOAD] Document missing file_path: {doc}")
            raise HTTPException(status_code=404, detail="File not available")

        # Redirect client to the public URL (Supabase Storage public object)
        return RedirectResponse(url=public_url)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD] Get file error: {e}")
        raise HTTPException(status_code=404, detail="File not found")


@router.get("")
async def list_files(entity_type: str | None = None, entity_id: str | None = None):
    try:
        filters = {}
        if entity_type:
            filters['entity_type'] = entity_type
        if entity_id:
            filters['entity_id'] = entity_id
        files = await db.select('documents') if not filters else await db.select('documents', filters=filters)
        # Ensure we return only useful fields
        out = []
        for f in files or []:
            out.append({
                'id': f.get('id'),
                'entity_type': f.get('entity_type'),
                'entity_id': f.get('entity_id'),
                'name': f.get('name'),
                'file_path': f.get('file_path'),  # Use file_path instead of url
                'document_category': f.get('document_category'),
                'file_type': f.get('file_type'),
                'file_size': f.get('file_size'),
                'created_at': f.get('created_at')
            })
        return out
    except Exception as e:
        print(f"[UPLOAD] List files error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")
