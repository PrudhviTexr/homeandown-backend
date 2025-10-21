#!/usr/bin/env python3
"""
Pure Supabase Database Client - No SQLite fallback
"""
import os
import json
from typing import Dict, List, Any, Optional
from supabase import create_client, Client

# Load environment variables
try:
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent.parent / '.env'
    load_dotenv(env_path)
    print(f"[DB] Loaded environment from: {env_path}")
except Exception as e:
    print(f"[DB] Could not load .env file: {e}")

def _read_env(key: str) -> str:
    """Read environment variable with robust error handling"""
    # Always try reading directly from file first for service role key
    if key == 'SUPABASE_SERVICE_ROLE_KEY':
        try:
            env_path = Path(__file__).resolve().parent.parent.parent / '.env'
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith(f'{key}='):
                        value = line.split('=', 1)[1].strip()
                        print(f"[DB] Read {key} from file: {len(value)} characters")
                        return value
        except Exception as e:
            print(f"[DB] Could not read {key} from file: {e}")
    
    # Fallback to environment variable
    value = os.getenv(key, "")
    if value:
        return value.strip().strip('"').strip("'")
    
    return ""

class SupabaseDBClient:
    def __init__(self):
        self.supabase_client: Client = None
        self._init_client()
    
    def _init_client(self):
        """Initialize Supabase client"""
        try:
            supabase_url = _read_env('SUPABASE_URL')
            supabase_key = _read_env('SUPABASE_SERVICE_ROLE_KEY')
            
            if not supabase_url or not supabase_key:
                raise Exception("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
            
            print(f"[DB] Initializing Supabase client...")
            print(f"[DB] URL: {supabase_url}")
            print(f"[DB] Key: {supabase_key[:20]}...")
            
            self.supabase_client = create_client(supabase_url, supabase_key)
            
            # Test connection (but don't fail if it doesn't work)
            try:
                print(f"[DB] Testing Supabase connection...")
                result = self.supabase_client.table('users').select('id').limit(1).execute()
                print(f"[DB] Supabase connection successful!")
                print(f"[DB] Test query returned: {len(result.data) if result.data else 0} users")
            except Exception as test_error:
                print(f"[DB] Supabase connection test failed: {test_error}")
                print(f"[DB] Continuing with Supabase client (keys may be invalid)")
            
        except Exception as e:
            print(f"[DB] Supabase client initialization failed: {e}")
            raise Exception(f"Failed to initialize Supabase client: {e}")

    async def select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Select data from Supabase"""
        try:
            query = self.supabase_client.table(table).select(columns)
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        if isinstance(value, dict) and "in" in value:
                            # Handle "in" operator for filtering by multiple values
                            query = query.in_(key, value["in"])
                        else:
                            query = query.eq(key, value)
            if limit:
                query = query.limit(limit)

            result = query.execute()
            data = result.data if result.data else []

            # Parse JSON fields
            parsed_data = []
            for row in data:
                parsed_row = dict(row)
                for field in ['images', 'amenities', 'room_images', 'sections', 'nearby_highlights', 'gated_community_features']:
                    if field in parsed_row and isinstance(parsed_row[field], str):
                        try:
                            parsed_row[field] = json.loads(parsed_row[field])
                        except (json.JSONDecodeError, TypeError):
                            parsed_row[field] = []
                    elif field in parsed_row and parsed_row[field] is None:
                        parsed_row[field] = []
                parsed_data.append(parsed_row)

            print(f"[DB] Supabase SELECT {table}: {len(parsed_data)} rows")
            return parsed_data

        except Exception as e:
            print(f"[DB] Supabase SELECT {table} error: {e}")
            raise

    async def admin_select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Select data with admin privileges (same as select for Supabase)"""
        return await self.select(table, columns, filters, limit)
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into Supabase"""
        try:
            # Clean data for insertion - Supabase handles arrays natively, no need to json.dumps
            clean_data = {}
            for key, value in data.items():
                # Keep lists and dicts as-is for Supabase (it handles JSON types natively)
                clean_data[key] = value

            result = self.supabase_client.table(table).insert(clean_data).execute()
            result_data = result.data[0] if result.data else {}
            
            print(f"[DB] Supabase INSERT {table}: Success")
            return result_data

        except Exception as e:
            print(f"[DB] Supabase INSERT {table} error: {e}")
            raise
    
    async def update(self, table: str, data: Dict[str, Any], filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Update data in Supabase"""
        try:
            # Clean data for update - Supabase handles arrays natively
            clean_data = {}
            for key, value in data.items():
                # Keep lists and dicts as-is for Supabase
                clean_data[key] = value
            
            query = self.supabase_client.table(table).update(clean_data)
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        query = query.eq(key, value)
            
            result = query.execute()
            result_data = result.data if result.data else []
            
            print(f"[DB] Supabase UPDATE {table}: Success")
            return result_data

        except Exception as e:
            print(f"[DB] Supabase UPDATE {table} error: {e}")
            raise
    
    async def delete(self, table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Delete data from Supabase"""
        try:
            query = self.supabase_client.table(table).delete()
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        query = query.eq(key, value)
            
            result = query.execute()
            result_data = result.data if result.data else []
            
            print(f"[DB] Supabase DELETE {table}: Success")
            return result_data
            
        except Exception as e:
            print(f"[DB] Supabase DELETE {table} error: {e}")
        raise

# Global database instance
db = SupabaseDBClient()

# Helper functions for backward compatibility
async def admin_select(table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Select data with admin privileges"""
    return await db.admin_select(table, columns, filters, limit)

async def select(table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Select data with user privileges"""
    return await db.select(table, columns, filters, limit)

async def insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert data"""
    return await db.insert(table, data)

async def update(table: str, data: Dict[str, Any], filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Update data"""
    return await db.update(table, data, filters)

async def delete(table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Delete data"""
    return await db.delete(table, filters)

# Storage helpers for Supabase
async def upload_to_storage(bucket: str, path: str, content: bytes, content_type: str = 'application/octet-stream') -> Any:
    """Upload bytes to Supabase storage"""
    try:
        result = db.supabase_client.storage.from_(bucket).upload(path, content, {
            "content-type": content_type
        })
        print(f"[DB] Storage upload successful: {bucket}/{path}")
        return result
    except Exception as e:
        print(f"[DB] Storage upload failed: {e}")
        raise

async def get_public_url(bucket: str, path: str) -> str:
    """Return the public URL for an object in Supabase storage"""
    try:
        result = db.supabase_client.storage.from_(bucket).get_public_url(path)
        return result
    except Exception as e:
        print(f"[DB] Get public URL failed: {e}")
        raise

async def ensure_bucket_exists(bucket: str, public: bool = True):
    """Ensure the storage bucket exists in Supabase"""
    try:
        # Try to list buckets to check if it exists
        buckets = db.supabase_client.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if bucket not in bucket_names:
            # Create bucket if it doesn't exist
            db.supabase_client.storage.create_bucket(bucket, {"public": public})
            print(f"[DB] Created bucket: {bucket} (public: {public})")
        else:
            print(f"[DB] Bucket already exists: {bucket}")
        
        return True
    except Exception as e:
        print(f"[DB] Bucket creation failed: {e}")
        raise

async def rpc(func: str, params: Dict[str, Any] | None = None) -> Any:
    """Call a Postgres function (RPC) in Supabase"""
    try:
        result = db.supabase_client.rpc(func, params or {})
        print(f"[DB] RPC call successful: {func}")
        return result.data if result.data else []
    except Exception as e:
        print(f"[DB] RPC call failed: {e}")
        raise