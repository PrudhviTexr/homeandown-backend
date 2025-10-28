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
    # This is a simplified version. In a real app, you might want to cache this.
    # Note: Listing buckets might require admin privileges.
    # The `db` object uses the service key, so it should have the necessary permissions.
    try:
        # We can't easily list buckets with the current storage client version to check existence.
        # So we'll just try to create it. If it exists, it will not throw a fatal error.
        # A more robust solution might involve checking for a specific error message.
        await db.supabase_client.storage.create_bucket(bucket, {"public": public})
        print(f"[DB] Ensured bucket exists (or created): {bucket}")
        return True
    except Exception as e:
        # A bit of a hack: if the bucket already exists, the API might return an error.
        # We can inspect the error message. A better client library would not require this.
        if "already exists" in str(e):
            print(f"[DB] Bucket already exists: {bucket}")
            return True
        print(f"[DB] Bucket creation/check failed: {e}")
        # We don't re-raise here to allow uploads to proceed, assuming the bucket exists.
        return False


@router.post("/upload")
async def upload_file(
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    file: UploadFile = File(...),
    _=Depends(require_api_key),
):
    """Upload incoming file to Supabase Storage and record metadata in `documents` table.

    Returns the document id and the public URL.
    """
    try:
        print(f"[UPLOAD] Uploading file: {file.filename} for {entity_type}:{entity_id}")

        # allow any image type broadly and pdfs
        if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

        content = await file.read()
        ext = os.path.splitext(file.filename or "")[1] or ""
        filename = f"{uuid.uuid4().hex}{ext}"

        # Path inside bucket: <entity_type>/<entity_id>/<filename>
        object_path = f"{entity_type}/{entity_id}/{filename}"

        bucket = _get_storage_bucket()
        await ensure_bucket_exists(bucket)

        try:
            await db.upload_to_storage(bucket, object_path, content, content_type=file.content_type)
        except Exception as e:
            print(f"[UPLOAD] Storage upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload to storage")

        # Get public URL
        try:
            public_url = await db.get_public_url(bucket, object_path)
        except Exception as e:
            print(f"[UPLOAD] Failed to build public URL: {e}")
            raise HTTPException(status_code=500, detail="Failed to obtain public URL")

        # Store document record in Supabase
        doc_data = {
            "id": str(uuid.uuid4()),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "name": file.filename or filename,
            "url": public_url,
            "file_type": file.content_type,
            "file_size": len(content),
            "storage_path": object_path,
            "created_at": dt.datetime.now(dt.timezone.utc).isoformat()
        }

        await db.insert("documents", doc_data)

        print(f"[UPLOAD] File uploaded successfully: {doc_data['url']}")
        return {"success": True, "id": doc_data["id"], "url": doc_data["url"]}

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
        public_url = doc.get('url')
        if not public_url:
            print(f"[UPLOAD] Document missing public url: {doc}")
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
                'url': f.get('url'),
                'file_type': f.get('file_type'),
                'file_size': f.get('file_size'),
                'created_at': f.get('created_at')
            })
        return out
    except Exception as e:
        print(f"[UPLOAD] List files error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")
