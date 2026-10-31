import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import get_current_user
from app.schemas.research import SourceInput, SourceResponse
from app.services.source_extractor import source_extractor
from app.services.change_detector import change_detector
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

router = APIRouter()

@router.post("/sources", response_model=dict)
async def add_source(
    research_project_id: str,
    data: SourceInput,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    s_id = str(uuid.uuid4())
    content = data.source_content or ""
    p_date = data.publication_date
    s_type = data.source_type

    if data.url and not content:
        try:
            extracted = await source_extractor.extract_from_url(data.url)
            content = extracted["source_content"]
            s_type = extracted["source_type"]
            p_date = extracted["publication_date"] or p_date
        except Exception as e:
            content = f"Source summary: {data.title}"

    src = {
        "id": s_id,
        "research_project_id": research_project_id,
        "user_id": user_id,
        "url": data.url,
        "title": data.title,
        "source_type": s_type,
        "source_content": content,
        "publication_date": str(p_date) if p_date else None,
        "freshness_status": "current",
        "verification_status": "unverified",
    }
    db_store.insert("sources", src)
    await supabase_service.insert("sources", src, auth_token=auth_token)
    return src

@router.post("/sources/upload", response_model=dict)
async def upload_source_file(
    research_project_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    contents = await file.read()
    text_content = contents.decode("utf-8", errors="ignore")[:30000]

    src = {
        "id": str(uuid.uuid4()),
        "research_project_id": research_project_id,
        "user_id": user_id,
        "url": None,
        "title": title or file.filename,
        "source_type": "document",
        "source_content": text_content,
        "freshness_status": "current",
        "verification_status": "unverified",
    }
    db_store.insert("sources", src)
    await supabase_service.insert("sources", src, auth_token=auth_token)
    return src

@router.get("/research/{research_id}/sources", response_model=List[dict])
async def list_project_sources(research_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    sources = db_store.query("sources", lambda s: s.get("research_project_id") == research_id)
    if not sources and auth_token:
        sources = await supabase_service.query("sources", {"research_project_id": f"eq.{research_id}"}, auth_token=auth_token)
    return sources

@router.post("/sources/{source_id}/refresh", response_model=dict)
async def refresh_source(source_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    src = db_store.get_by_id("sources", source_id)
    if not src:
        supabase_res = await supabase_service.query("sources", {"id": f"eq.{source_id}"}, auth_token=auth_token)
        if supabase_res:
            src = supabase_res[0]
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    if not src.get("url"):
        return {"message": "Source has no URL to refresh", "changed": False}

    old_content = src.get("source_content", "")
    extracted = await source_extractor.extract_from_url(src["url"])
    new_content = extracted["source_content"]

    diff_detected = await change_detector.inspect_and_diff(
        source_id=source_id,
        opportunity_id=None,
        user_id=current_user["sub"],
        new_content=new_content,
        old_content=old_content,
        auth_token=auth_token
    )

    db_store.update("sources", source_id, {
        "source_content": new_content,
        "last_checked_at": extracted.get("publication_date")
    })
    await supabase_service.update("sources", source_id, {
        "source_content": new_content,
        "last_checked_at": extracted.get("publication_date")
    }, auth_token=auth_token)

    return {
        "message": "Source refreshed",
        "changed": diff_detected is not None,
        "change_details": diff_detected
    }

