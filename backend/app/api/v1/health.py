from fastapi import APIRouter
from app.core.config import settings
from app.services.supabase_client import supabase_service

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint validating Supabase and system readiness"""
    db_status = "connected"
    try:
        # Ping Supabase
        await supabase_service.query("profiles", {"limit": "1"})
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "ai_engine": "gemini" if settings.GEMINI_API_KEY else "heuristic_fallback",
        "supabase_url": settings.SUPABASE_URL
    }

