from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.schemas.monitoring import NotificationResponse, NotificationPreferenceUpdate
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

router = APIRouter()

@router.get("/notifications", response_model=dict)
async def list_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    notifs = db_store.query("notifications", lambda n: n.get("user_id") == user_id)
    if not notifs and auth_token:
        notifs = await supabase_service.query("notifications", {"user_id": f"eq.{user_id}"}, auth_token=auth_token)
    
    # Ensure priority is assigned
    for n in notifs:
        if not n.get("priority"):
            title_l = (n.get("title") or "").lower()
            if "critical" in title_l or "1 day" in title_l or "final hours" in title_l:
                n["priority"] = "critical"
            elif "3 days" in title_l or "urgent" in title_l:
                n["priority"] = "high"
            elif "5 days" in title_l or "reminder" in title_l:
                n["priority"] = "medium"
            else:
                n["priority"] = "normal"

    # Sort descending by created_at
    notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    unread_count = sum(1 for n in notifs if not n.get("read_at"))
    return {
        "notifications": notifs,
        "unread_count": unread_count,
    }

@router.patch("/notifications/mark-all-read", response_model=dict)
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    now = datetime.utcnow().isoformat()
    notifs = db_store.query("notifications", lambda n: n.get("user_id") == user_id and not n.get("read_at"))
    for n in notifs:
        db_store.update("notifications", n["id"], {"read_at": now})
        if auth_token:
            try:
                await supabase_service.update("notifications", n["id"], {"read_at": now}, auth_token=auth_token)
            except Exception:
                pass
    return {"message": "All notifications marked as read"}

@router.delete("/notifications/{notification_id}", response_model=dict)
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    db_store.delete("notifications", notification_id)
    if auth_token:
        try:
            await supabase_service.delete("notifications", notification_id, auth_token=auth_token)
        except Exception:
            pass
    return {"message": "Notification dismissed successfully"}

@router.patch("/notifications/{notification_id}/read", response_model=dict)
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    now = datetime.utcnow().isoformat()
    updated = db_store.update("notifications", notification_id, {"read_at": now})
    await supabase_service.update("notifications", notification_id, {"read_at": now}, auth_token=auth_token)
    return {"message": "Notification marked as read", "notification": updated}

@router.patch("/notifications/preferences", response_model=dict)
async def update_notification_preferences(
    data: NotificationPreferenceUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    db_store.update("profiles", user_id, {"notification_preferences": updates})
    await supabase_service.update("profiles", user_id, {"notification_preferences": updates}, auth_token=auth_token)
    return {"message": "Preferences updated", "preferences": updates}

