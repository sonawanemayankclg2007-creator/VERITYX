from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.schemas.monitoring import MonitoringCheckRequest, SourceChangeResponse
from app.services.source_extractor import source_extractor
from app.services.change_detector import change_detector
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

router = APIRouter()

@router.post("/monitoring/check", response_model=dict)
async def run_monitoring_check(data: MonitoringCheckRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    checked_sources = []
    detected_changes = []

    # Filter sources to check
    if data.source_id:
        src = db_store.get_by_id("sources", data.source_id)
        if not src and auth_token:
            res = await supabase_service.query("sources", {"id": f"eq.{data.source_id}"}, auth_token=auth_token)
            src = res[0] if res else None
        sources_to_check = [src] if src else []
    elif data.opportunity_id:
        opp = db_store.get_by_id("tracked_opportunities", data.opportunity_id)
        if not opp and auth_token:
            res = await supabase_service.query("tracked_opportunities", {"id": f"eq.{data.opportunity_id}"}, auth_token=auth_token)
            opp = res[0] if res else None
        if opp and opp.get("research_project_id"):
            sources_to_check = db_store.query("sources", lambda s: s.get("research_project_id") == opp["research_project_id"])
            if not sources_to_check and auth_token:
                sources_to_check = await supabase_service.query("sources", {"research_project_id": f"eq.{opp['research_project_id']}"}, auth_token=auth_token)
        else:
            sources_to_check = []
    else:
        sources_to_check = db_store.query("sources", lambda s: s.get("user_id") == user_id)
        if not sources_to_check and auth_token:
            sources_to_check = await supabase_service.query("sources", {"user_id": f"eq.{user_id}"}, auth_token=auth_token)

    for src in sources_to_check:
        if not src or not src.get("url"):
            continue

        try:
            old_content = src.get("source_content", "")
            extracted = await source_extractor.extract_from_url(src["url"])
            new_content = extracted["source_content"]
            checked_sources.append(src["id"])

            change = await change_detector.inspect_and_diff(
                source_id=src["id"],
                opportunity_id=data.opportunity_id,
                user_id=user_id,
                new_content=new_content,
                old_content=old_content,
                auth_token=auth_token
            )
            if change:
                detected_changes.append(change)

            # Update source content
            db_store.update("sources", src["id"], {"source_content": new_content})
            await supabase_service.update("sources", src["id"], {"source_content": new_content}, auth_token=auth_token)
        except Exception as e:
            print(f"[Monitoring] Error checking source {src.get('id')}: {e}")

    return {
        "sources_checked_count": len(checked_sources),
        "changes_detected_count": len(detected_changes),
        "changes": detected_changes,
    }

@router.get("/monitoring/changes", response_model=List[dict])
async def list_source_changes(opportunity_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    if opportunity_id:
        changes = db_store.query("source_changes", lambda c: c.get("opportunity_id") == opportunity_id)
        if not changes and auth_token:
            changes = await supabase_service.query("source_changes", {"opportunity_id": f"eq.{opportunity_id}"}, auth_token=auth_token)
        return changes
    changes = db_store.query("source_changes")
    if not changes and auth_token:
        changes = await supabase_service.query("source_changes", auth_token=auth_token)
    return changes

@router.post("/monitoring/verify", response_model=dict)
async def verify_change(
    change_id: str,
    status: str = "Verified Change",  # Verified Change or Disputed
    current_user: dict = Depends(get_current_user)
):
    auth_token = current_user.get("token")
    change = db_store.get_by_id("source_changes", change_id)
    if not change and auth_token:
        res = await supabase_service.query("source_changes", {"id": f"eq.{change_id}"}, auth_token=auth_token)
        change = res[0] if res else None

    if not change:
        raise HTTPException(status_code=404, detail="Change record not found")

    updated = db_store.update("source_changes", change_id, {"verification_status": status})
    await supabase_service.update("source_changes", change_id, {"verification_status": status}, auth_token=auth_token)

    return {"message": f"Change marked as {status}", "change": updated}

