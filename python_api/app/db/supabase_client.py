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

    async def select(self, table: str, columns: str = "*", select: str = None, filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None, offset: Optional[int] = None, order_by: Optional[str] = None, ascending: bool = True) -> List[Dict[str, Any]]:
        def _execute_sync():
            if select == "count":
                query = self.supabase_client.table(table).select("*", count='exact', head=True)
            else:
                query = self.supabase_client.table(table).select(columns)

            if filters:
                # Check if this is an OR query
                if isinstance(filters, dict) and "or" in filters:
                    # Handle OR queries: {"or": [{"agent_id": "xxx"}, {"assigned_agent_id": "xxx"}]}
                    or_conditions = filters["or"]
                    if isinstance(or_conditions, list) and len(or_conditions) > 0:
                        # Supabase Python client OR syntax: query.or_("field1.eq.value1,field2.eq.value2")
                        or_parts = []
                        for condition in or_conditions:
                            if isinstance(condition, dict):
                                for k, v in condition.items():
                                    # Escape special characters in values if needed
                                    v_str = str(v)
                                    or_parts.append(f"{k}.eq.{v_str}")
                        if or_parts:
                            or_filter_str = ",".join(or_parts)
                            try:
                                query = query.or_(or_filter_str)
                                print(f"[DB] Applied OR filter: {or_filter_str}")
                            except Exception as or_error:
                                print(f"[DB] OR filter failed, will use fallback: {or_error}")
                                # If OR fails, we'll need to handle it in the calling code
                                raise ValueError(f"OR query not supported: {or_error}")
                    # Process other filters if any (after OR)
                    for key, value in filters.items():
                        if key != "or":
                            if isinstance(value, list):
                                # Supabase Python client's filter with 'in' expects a tuple
                                # But we need to handle it properly for UUIDs
                                if value:
                                    # Pass list directly - Supabase client should handle conversion
                                    query = query.filter(key, 'in', value)
                                else:
                                    # Empty list - return no results by filtering with impossible value
                                    query = query.filter(key, 'eq', '00000000-0000-0000-0000-000000000000')
                            elif isinstance(value, dict):
                                for op, op_value in value.items():
                                    if op == "gt":
                                        query = query.filter(key, 'gt', op_value)
                                    elif op == "gte":
                                        query = query.filter(key, 'gte', op_value)
                                    elif op == "lt":
                                        query = query.filter(key, 'lt', op_value)
                                    elif op == "lte":
                                        query = query.filter(key, 'lte', op_value)
                                    elif op == "in":
                                        # Handle 'in' operator in nested dict
                                        if isinstance(op_value, list):
                                            if op_value:
                                                query = query.filter(key, 'in', op_value)
                                            else:
                                                query = query.filter(key, 'eq', '00000000-0000-0000-0000-000000000000')
                                        else:
                                            query = query.filter(key, 'in', op_value)
                            else:
                                query = query.filter(key, 'eq', value)
                else:
                    # Normal AND filters
                    for key, value in filters.items():
                        if isinstance(value, list):
                            # Supabase Python client's filter with 'in' expects a list
                            if value:
                                query = query.filter(key, 'in', value)
                            else:
                                # Empty list - return no results
                                query = query.filter(key, 'eq', '00000000-0000-0000-0000-000000000000')
                        elif isinstance(value, dict):
                            # Support operators like {"gt": 100}, {"gte": 100}, {"lt": 100}, {"lte": 100}
                            for op, op_value in value.items():
                                if op == "gt":
                                    query = query.filter(key, 'gt', op_value)
                                elif op == "gte":
                                    query = query.filter(key, 'gte', op_value)
                                elif op == "lt":
                                    query = query.filter(key, 'lt', op_value)
                                elif op == "lte":
                                    query = query.filter(key, 'lte', op_value)
                                elif op == "in":
                                    if isinstance(op_value, list):
                                        if op_value:
                                            query = query.filter(key, 'in', op_value)
                                        else:
                                            query = query.filter(key, 'eq', '00000000-0000-0000-0000-000000000000')
                                    else:
                                        query = query.filter(key, 'in', op_value)
                        else:
                            query = query.filter(key, 'eq', value)
            
            # Add ordering
            if order_by and select != "count":
                if ascending:
                    query = query.order(order_by, desc=False)
                else:
                    query = query.order(order_by, desc=True)
            
            # Add pagination
            if offset is not None and select != "count":
                query = query.range(offset, offset + (limit or 1000) - 1)
            elif limit and select != "count":
                query = query.limit(limit)

            response = query.execute()

            if select == "count":
                return [{"count": response.count}]
            return response.data

        try:
            # Add timeout to database operations to prevent hanging
            # Use shorter timeout for count queries (0.5s) vs regular queries (1.5s) for faster response
            import asyncio
            timeout_seconds = 0.5 if select == "count" else 1.5
            result = await asyncio.wait_for(
                self._run_sync(_execute_sync),
                timeout=timeout_seconds
            )
            print(f"[DB] Supabase SELECT {table}: {len(result)} rows (timeout: {timeout_seconds}s)")
            return result
        except asyncio.TimeoutError:
            timeout_seconds = 0.5 if select == "count" else 1.5
            print(f"[DB] Timeout error in Supabase select for table {table} (timeout: {timeout_seconds}s)")
            return []
        except Exception as e:
            print(f"Error in Supabase select for table {table}: {e}")
            return []

    async def admin_select(self, table: str, columns: str = "*", select: str = None, filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None, offset: Optional[int] = None, order_by: Optional[str] = None, ascending: bool = True) -> List[Dict[str, Any]]:
        return await self.select(table, columns=columns, select=select, filters=filters, limit=limit, offset=offset, order_by=order_by, ascending=ascending)

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