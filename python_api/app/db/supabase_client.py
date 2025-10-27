#!/usr/bin/env python3
"""
Pure Supabase Database Client - No SQLite fallback
"""
import asyncio
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from ..core.config import settings

class SupabaseDBClient:
    def __init__(self, supabase_url: str, supabase_key: str):
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase URL and Key must be provided.")
        self.supabase_client: Client = create_client(supabase_url, supabase_key)
        print("[DB] Supabase client initialized.")

    async def _run_sync(self, func, *args, **kwargs):
        """Runs a synchronous function in a separate thread to avoid blocking the asyncio event loop."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))

    async def select(self, table: str, columns: str = "*", select: str = None, filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        def _execute_sync():
            if select == "count":
                query = self.supabase_client.table(table).select("*", count='exact', head=True)
            else:
                query = self.supabase_client.table(table).select(columns)

            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        query = query.filter(key, 'in', value)
                    else:
                        query = query.filter(key, 'eq', value)
            
            if limit and select != "count":
                query = query.limit(limit)

            response = query.execute()

            if select == "count":
                return [{"count": response.count}]
            return response.data

        try:
            result = await self._run_sync(_execute_sync)
            print(f"[DB] Supabase SELECT {table}: {len(result)} rows")
            return result
        except Exception as e:
            print(f"Error in Supabase select for table {table}: {e}")
            return []

    async def admin_select(self, table: str, columns: str = "*", select: str = None, filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        return await self.select(table, columns=columns, select=select, filters=filters, limit=limit)

    async def insert(self, table: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        def _execute_sync():
            return self.supabase_client.table(table).insert(data).execute().data
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] Supabase INSERT {table} error: {e}")
            raise

    async def update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        def _execute_sync():
            query = self.supabase_client.table(table).update(data)
            for key, value in filters.items():
                query = query.eq(key, value)
            return query.execute().data
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] Supabase UPDATE {table} error: {e}")
            raise

    async def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        def _execute_sync():
            query = self.supabase_client.table(table).delete()
            for key, value in filters.items():
                query = query.eq(key, value)
            return query.execute().data
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] Supabase DELETE error: {e}")
            raise

    async def upload_to_storage(self, bucket: str, path: str, content: bytes, content_type: str = 'application/octet-stream') -> Any:
        def _execute_sync():
            return self.supabase_client.storage.from_(bucket).upload(path, content, {"content-type": content_type})
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] Storage upload failed: {e}")
            raise

    async def get_public_url(self, bucket: str, path: str) -> str:
        def _execute_sync():
            return self.supabase_client.storage.from_(bucket).get_public_url(path)
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] Get public URL failed: {e}")
            raise
            
    async def rpc(self, func: str, params: Dict[str, Any] | None = None) -> Any:
        def _execute_sync():
            return self.supabase_client.rpc(func, params or {}).execute().data
        try:
            return await self._run_sync(_execute_sync)
        except Exception as e:
            print(f"[DB] RPC call failed: {e}")
            raise

# Create a single, global instance of the database client
# Hardcode the verified Supabase credentials to bypass .env file issues
SUPABASE_URL = "https://ajymffxpunxoqcmunohx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeW1mZnhwdW54b3FjbXVub2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYzNjY4OCwiZXhwIjoyMDY3MjEyNjg4fQ.OhWOjkmDxOeX5WgefvTTLOMZPRd3zjkEPAJyqcisfXM"

db = SupabaseDBClient(SUPABASE_URL, SUPABASE_KEY)