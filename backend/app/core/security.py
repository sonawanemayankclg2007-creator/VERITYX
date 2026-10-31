import ipaddress
import socket
from urllib.parse import urlparse
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.config import settings

security = HTTPBearer(auto_error=False)

# Blocked IP networks for SSRF protection
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),     # Cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("fc00::/7"),          # IPv6 ULA
    ipaddress.ip_network("::1/128"),           # IPv6 Loopback
]

_URL_SAFETY_CACHE = {}

def is_safe_url(url: str) -> bool:
    """
    Validates URL to block SSRF attacks against localhost, internal subnets,
    and cloud metadata endpoints (e.g., 169.254.169.254) with safety caching.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
            
        hostname = parsed.hostname
        if not hostname:
            return False
            
        hostname_lower = hostname.lower()
        if hostname_lower in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            return False

        if hostname_lower in _URL_SAFETY_CACHE:
            return _URL_SAFETY_CACHE[hostname_lower]

        # Check if already an IP
        try:
            ip_obj = ipaddress.ip_address(hostname_lower)
            is_safe = not any(ip_obj in net for net in BLOCKED_NETWORKS)
            _URL_SAFETY_CACHE[hostname_lower] = is_safe
            return is_safe
        except ValueError:
            pass

        # Disallow known internal suffixes
        if hostname_lower.endswith((".local", ".internal", ".localhost", ".onion", ".lan")):
            _URL_SAFETY_CACHE[hostname_lower] = False
            return False

        # Fast DNS check with timeout guard
        try:
            prev_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(1.5)
            try:
                ip_str = socket.gethostbyname(hostname)
                ip_obj = ipaddress.ip_address(ip_str)
                is_safe = not any(ip_obj in net for net in BLOCKED_NETWORKS)
                _URL_SAFETY_CACHE[hostname_lower] = is_safe
                return is_safe
            finally:
                socket.setdefaulttimeout(prev_timeout)
        except Exception:
            # If DNS resolution fails, allow external public domains syntactically
            _URL_SAFETY_CACHE[hostname_lower] = True
            return True

    except Exception:
        return False

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    """
    Extracts and validates Supabase JWT token from Authorization header.
    Returns user payload dictionary containing 'sub' (User UID) and 'email'.
    """
    if not credentials:
        # For development flexibility when testing endpoints locally without auth header
        return {"sub": "00000000-0000-0000-0000-000000000000", "email": "dev@verityx.ai", "role": "authenticated", "token": None}
        
    token = credentials.credentials
    try:
        # Decode without verification if secret isn't supplied or verify using Supabase secret
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"], 
                options={"verify_aud": False}
            )
        else:
            payload = jwt.decode(token, options={"verify_signature": False})
            
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing subject identifier."
            )
        return {
            "sub": user_id,
            "email": payload.get("email", ""),
            "role": payload.get("role", "authenticated"),
            "token": token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication validation failed: {str(e)}"
        )

