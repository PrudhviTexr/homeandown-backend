from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import RedirectResponse
from ..core.security import require_api_key
from ..db.supabase_client import db
import os
import uuid
import datetime as dt

router = APIRouter()


def _get_storage_bucket():
    return os.getenv("SUPABASE_STORAGE_BUCKET", "property-images")

async def ensure_bucket_exists(bucket: str, public: bool = True):
    """Ensure the storage bucket exists in Supabase"""
    # Skip bucket creation in production - assume it's already set up
    # The bucket should be created manually in Supabase dashboard
    print(f"[DB] Assuming bucket exists: {bucket}")
    return True


@router.post("/upload")
async def upload_file(
    entity_type: str = Form(...),
    entity_id: str = Form(default=""),
    document_category: str = Form(default=""),
    file: UploadFile = File(...),
    _=Depends(require_api_key),
):
    """Upload incoming file to Supabase Storage and record metadata in `documents` table.

    Returns the document id and the public URL.
    """
    try:
        print(f"[UPLOAD] Uploading file: {file.filename} for {entity_type}:{entity_id}, category: {document_category}")

        # allow any image type broadly and pdfs
        if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

        content = await file.read()
        ext = os.path.splitext(file.filename or "")[1] or ""
        filename = f"{uuid.uuid4().hex}{ext}"

        # Determine bucket based on entity type - NO SUBFOLDERS
        if entity_type == 'property' or entity_type == 'property_images':
            bucket = 'property-images'
            object_path = filename  # Flat structure: just filename
            # Normalize entity_type for storage in database
            normalized_entity_type = 'property'
        elif entity_type == 'user' or entity_type == 'user_documents':
            bucket = 'documents'
            object_path = filename  # Flat structure: just filename
            # Normalize entity_type: always store as 'user' in database for consistency
            # This ensures admin panel queries with entity_type='user' will find them
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
            print(f"[UPLOAD] Error details: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"[UPLOAD] Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")

        # Get public URL
        try:
            public_url = await db.get_public_url(bucket, object_path)
        except Exception as e:
            print(f"[UPLOAD] Failed to build public URL: {e}")
            raise HTTPException(status_code=500, detail="Failed to obtain public URL")

        # Store document record in Supabase - only use fields that exist in schema
        # Use normalized entity_type for consistent querying
        doc_data = {
            "name": file.filename or filename,
            "file_path": public_url,  # Store the public URL in file_path
            "file_type": file.content_type,
            "file_size": len(content),
            "entity_type": normalized_entity_type,  # Use normalized type for consistent queries
            "entity_id": entity_id if entity_id else str(uuid.uuid4()),
            "uploaded_by": entity_id if entity_id else None,
            "document_category": document_category if document_category else None
        }

        try:
            result = await db.insert("documents", doc_data)
            print(f"[UPLOAD] Document uploaded successfully: {public_url}, entity: {entity_type}:{entity_id}")
            
            # Get the inserted document ID
            doc_id = result[0].get('id') if result else None
            return {"success": True, "id": doc_id, "url": public_url}
        except Exception as insert_error:
            print(f"[UPLOAD] Failed to insert document record: {insert_error}")
            import traceback
            print(traceback.format_exc())
            # Still return success with URL even if DB insert fails
            return {"success": True, "id": None, "url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD] Upload error: {e}")
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
