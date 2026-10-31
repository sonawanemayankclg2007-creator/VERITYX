import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

class SupabaseService:
    """
    Centralized Supabase client for backend operations.
    Communicates with Supabase PostgREST and Auth APIs.
    """
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip('/')
        self.anon_key = settings.SUPABASE_ANON_KEY
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY or self.anon_key
        
    def _get_headers(self, auth_token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.anon_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        else:
            headers["Authorization"] = f"Bearer {self.service_key}"
        return headers

    async def get_user(self, jwt_token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token against Supabase Auth endpoint"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.url}/auth/v1/user",
                    headers={
                        "apikey": self.anon_key,
                        "Authorization": f"Bearer {jwt_token}"
                    }
                )
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            print(f"[SupabaseClient] Error fetching auth user: {e}")
        return None

    async def query(self, table: str, params: Optional[Dict[str, str]] = None, auth_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query rows from a Supabase table with optional RLS context"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.url}/rest/v1/{table}",
                    params=params or {},
                    headers=self._get_headers(auth_token)
                )
                if res.status_code == 200:
                    return res.json()
                elif res.status_code in (401, 404):
                    return []
                else:
                    print(f"[SupabaseClient] Query {table} returned {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[SupabaseClient] Query error on {table}: {e}")
        return []

    async def insert(self, table: str, data: Dict[str, Any], auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Insert a row into a Supabase table"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.url}/rest/v1/{table}",
                    json=data,
                    headers=self._get_headers(auth_token)
                )
                if res.status_code in (200, 201):
                    res_data = res.json()
                    return res_data[0] if isinstance(res_data, list) and len(res_data) > 0 else res_data
                else:
                    print(f"[SupabaseClient] Insert {table} returned {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[SupabaseClient] Insert error on {table}: {e}")
        return None

    async def update(self, table: str, record_id: str, data: Dict[str, Any], auth_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update a row in a Supabase table by ID"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.patch(
                    f"{self.url}/rest/v1/{table}",
                    params={"id": f"eq.{record_id}"},
                    json=data,
                    headers=self._get_headers(auth_token)
                )
                if res.status_code == 200:
                    res_data = res.json()
                    return res_data[0] if isinstance(res_data, list) and len(res_data) > 0 else res_data
                else:
                    print(f"[SupabaseClient] Update {table} returned {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[SupabaseClient] Update error on {table}: {e}")
        return None

    async def delete(self, table: str, record_id: str, auth_token: Optional[str] = None) -> bool:
        """Delete a row from a Supabase table by ID"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.delete(
                    f"{self.url}/rest/v1/{table}",
                    params={"id": f"eq.{record_id}"},
                    headers=self._get_headers(auth_token)
                )
                if res.status_code in (200, 204):
                    return True
                else:
                    print(f"[SupabaseClient] Delete {table} returned {res.status_code}: {res.text}")
                    return False
        except Exception as e:
            print(f"[SupabaseClient] Delete error on {table}: {e}")
        return False

supabase_service = SupabaseService()

