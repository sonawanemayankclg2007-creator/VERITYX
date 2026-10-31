import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityStatusUpdate,
    OpportunityResponse,
)
from app.services.supabase_client import supabase_service
from app.services.deadline_guardian import deadline_guardian
from app.db.local_store import db_store

router = APIRouter()

def enrich_opportunity(opp: dict) -> dict:
    opp_copy = dict(opp)
    metrics = deadline_guardian.calculate_deadline_metrics(opp.get("application_deadline"))
    health = deadline_guardian.evaluate_health_status(opp)
    follow_up_needed, days_elapsed = deadline_guardian.check_four_day_follow_up_needed(opp)

    opp_copy["days_remaining"] = metrics["days_remaining"]
    opp_copy["hours_remaining"] = metrics["hours_remaining"]
    opp_copy["is_overdue"] = metrics["is_overdue"]
    opp_copy["urgency_level"] = metrics["urgency_level"]
    opp_copy["deadline_ist"] = metrics["formatted_ist"]
    opp_copy["health_status"] = health
    opp_copy["follow_up_due"] = follow_up_needed
    opp_copy["follow_up_days_elapsed"] = days_elapsed
    return opp_copy

@router.post("/opportunities/track", response_model=dict)
async def track_opportunity(data: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    opp_id = str(uuid.uuid4())

    opp_record = {
        "id": opp_id,
        "user_id": user_id,
        "research_project_id": data.research_project_id,
        "title": data.title,
        "organization": data.organization,
        "opportunity_type": data.opportunity_type,
        "official_url": data.official_url,
        "application_start_date": str(data.application_start_date) if data.application_start_date else None,
        "application_deadline": str(data.application_deadline) if data.application_deadline else None,
        "application_status": data.application_status or "Not Started",
        "monitoring_enabled": data.monitoring_enabled,
    }
    db_store.insert("tracked_opportunities", opp_record)
    await supabase_service.insert("tracked_opportunities", opp_record, auth_token=auth_token)

    # Insert milestone dates
    saved_dates = []
    for d in data.dates or []:
        d_record = {
            "id": str(uuid.uuid4()),
            "opportunity_id": opp_id,
            "date_type": d.date_type,
            "date_value": str(d.date_value),
            "verification_status": d.verification_status,
        }
        db_store.insert("opportunity_dates", d_record)
        await supabase_service.insert("opportunity_dates", d_record, auth_token=auth_token)
        saved_dates.append(d_record)

    # Create default reminder preferences
    remind_pref = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "opportunity_id": opp_id,
        "reminder_intervals": [7, 3, 2, 1, 0],
        "email_enabled": True,
        "push_enabled": True,
        "in_app_enabled": True,
    }
    db_store.insert("reminder_preferences", remind_pref)
    await supabase_service.insert("reminder_preferences", remind_pref, auth_token=auth_token)

    # Generate initial tracking confirmation notification
    initial_notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "opportunity_id": opp_id,
        "notification_type": "status_update",
        "title": f"Opportunity Tracked: {data.title}",
        "message": f"Smart Deadline Guardian is now monitoring '{data.title}'. Application status: {data.application_status or 'Not Started'}.",
    }
    db_store.insert("notifications", initial_notif)
    await supabase_service.insert("notifications", initial_notif, auth_token=auth_token)

    enriched = enrich_opportunity(opp_record)
    return {
        "opportunity": enriched,
        "dates": saved_dates,
        "days_remaining": enriched["days_remaining"],
        "hours_remaining": enriched["hours_remaining"],
        "health_status": enriched["health_status"]
    }

@router.get("/opportunities", response_model=List[dict])
async def list_opportunities(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    items = await supabase_service.query("tracked_opportunities", {"user_id": f"eq.{user_id}"}, auth_token=auth_token)
    if not items:
        items = db_store.query("tracked_opportunities", lambda o: o.get("user_id") == user_id)

    # Load notifications for scheduled guardian alerts
    existing_notifs = db_store.query("notifications", lambda n: n.get("user_id") == user_id)

    results = []
    for opp in items:
        opp_id = opp["id"]
        dates = db_store.query("opportunity_dates", lambda d: d.get("opportunity_id") == opp_id)
        if not dates and auth_token:
            dates = await supabase_service.query("opportunity_dates", {"opportunity_id": f"eq.{opp_id}"}, auth_token=auth_token)
        
        opp_enriched = enrich_opportunity(opp)
        opp_enriched["dates"] = dates

        # Check and deliver scheduled reminder alerts
        new_alerts = deadline_guardian.generate_scheduled_notifications(user_id, opp, existing_notifs)
        for alert in new_alerts:
            db_store.insert("notifications", alert)
            if auth_token:
                try:
                    await supabase_service.insert("notifications", alert, auth_token=auth_token)
                except Exception:
                    pass

        results.append(opp_enriched)
    return results

@router.get("/opportunities/{opportunity_id}", response_model=dict)
async def get_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    opp = db_store.get_by_id("tracked_opportunities", opportunity_id)
    if not opp:
        supabase_res = await supabase_service.query("tracked_opportunities", {"id": f"eq.{opportunity_id}"}, auth_token=auth_token)
        if supabase_res:
            opp = supabase_res[0]

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    dates = db_store.query("opportunity_dates", lambda d: d.get("opportunity_id") == opportunity_id)
    if not dates and auth_token:
        dates = await supabase_service.query("opportunity_dates", {"opportunity_id": f"eq.{opportunity_id}"}, auth_token=auth_token)

    changes = db_store.query("source_changes", lambda c: c.get("opportunity_id") == opportunity_id)
    if not changes and auth_token:
        changes = await supabase_service.query("source_changes", {"opportunity_id": f"eq.{opportunity_id}"}, auth_token=auth_token)

    opp_enriched = enrich_opportunity(opp)
    opp_enriched["dates"] = dates
    opp_enriched["changes"] = changes
    return opp_enriched

@router.patch("/opportunities/{opportunity_id}", response_model=dict)
async def update_opportunity(
    opportunity_id: str,
    data: OpportunityUpdate,
    current_user: dict = Depends(get_current_user)
):
    auth_token = current_user.get("token")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if "application_deadline" in updates and updates["application_deadline"]:
        updates["application_deadline"] = str(updates["application_deadline"])
    if "application_start_date" in updates and updates["application_start_date"]:
        updates["application_start_date"] = str(updates["application_start_date"])

    updated = db_store.update("tracked_opportunities", opportunity_id, updates)
    await supabase_service.update("tracked_opportunities", opportunity_id, updates, auth_token=auth_token)
    return updated or {"message": "Updated"}

@router.patch("/opportunities/{opportunity_id}/status", response_model=dict)
async def update_opportunity_status(
    opportunity_id: str,
    data: OpportunityStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    auth_token = current_user.get("token")
    valid_statuses = ["Not Started", "In Progress", "Registered", "Completed", "Not Interested"]
    if data.application_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    updated = db_store.update("tracked_opportunities", opportunity_id, {"application_status": data.application_status})
    await supabase_service.update("tracked_opportunities", opportunity_id, {"application_status": data.application_status}, auth_token=auth_token)

    # Add confirmation notification
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["sub"],
        "opportunity_id": opportunity_id,
        "notification_type": "status_update",
        "title": f"Status Updated: {data.application_status}",
        "message": f"Your progress on this opportunity is now recorded as: '{data.application_status}'.",
    }
    db_store.insert("notifications", notif)
    await supabase_service.insert("notifications", notif, auth_token=auth_token)

    return {"message": "Status updated successfully", "opportunity": updated}

@router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    db_store.delete("tracked_opportunities", opportunity_id)
    await supabase_service.delete("tracked_opportunities", opportunity_id, auth_token=auth_token)
    return {"message": "Tracked opportunity deleted"}

