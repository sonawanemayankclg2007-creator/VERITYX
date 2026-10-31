import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import Response
from app.core.security import get_current_user
from app.schemas.pdf import PDFGenerateRequest, PDFDocumentResponse, PDFVersionResponse
from app.services.pdf_generator import pdf_generator
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

router = APIRouter()

@router.post("/pdf/generate", response_model=dict)
async def generate_pdf(data: PDFGenerateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    doc_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())

    title = data.title or "VERITYX Intelligence Verification Report"
    research_data = {}

    if data.research_project_id:
        proj = db_store.get_by_id("research_projects", data.research_project_id)
        if proj:
            title = data.title or proj.get("title", title)
            gaps = db_store.query("information_gaps", lambda g: g.get("research_project_id") == data.research_project_id)
            conflicts = db_store.query("conflicts", lambda c: c.get("research_project_id") == data.research_project_id)
            tasks = db_store.query("verification_tasks", lambda t: t.get("research_project_id") == data.research_project_id)
            claims = db_store.query("claims", lambda c: c.get("research_project_id") == data.research_project_id)
            research_data = {
                "summary": proj.get("summary"),
                "readiness_score": proj.get("readiness_score"),
                "information_gaps": gaps,
                "conflicts": conflicts,
                "verification_checklist": tasks,
                "claims": claims,
            }

    # Generate PDF bytes via ReportLab
    pdf_bytes = pdf_generator.generate_report(
        title=title,
        research_data=research_data,
        version=1,
        changes_summary="Initial Verified Release"
    )

    storage_path = f"{user_id}/{doc_id}_v1.pdf"
    db_store.pdf_binaries[storage_path] = pdf_bytes

    doc_record = {
        "id": doc_id,
        "user_id": user_id,
        "research_project_id": data.research_project_id,
        "opportunity_id": data.opportunity_id,
        "title": title,
        "current_version": 1,
    }
    auth_token = current_user.get("token")
    db_store.insert("pdf_documents", doc_record)
    await supabase_service.insert("pdf_documents", doc_record, auth_token=auth_token)

    ver_record = {
        "id": version_id,
        "pdf_document_id": doc_id,
        "version_number": 1,
        "storage_path": storage_path,
        "download_url": f"/api/v1/pdf/{doc_id}/download?version=1",
        "change_summary": "Initial Verified Release",
        "research_snapshot": research_data,
    }
    db_store.insert("pdf_versions", ver_record)
    sb_ver = {k: v for k, v in ver_record.items() if k != "download_url"}
    await supabase_service.insert("pdf_versions", sb_ver, auth_token=auth_token)

    return {
        "document": doc_record,
        "version": ver_record,
        "download_url": f"/api/v1/pdf/{doc_id}/download",
    }

@router.get("/pdf", response_model=List[dict])
async def list_pdfs(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    auth_token = current_user.get("token")
    docs = db_store.query("pdf_documents", lambda d: d.get("user_id") == user_id)
    if not docs and auth_token:
        docs = await supabase_service.query("pdf_documents", {"user_id": f"eq.{user_id}"}, auth_token=auth_token)
    results = []
    for d in docs:
        doc_id = d["id"]
        versions = db_store.query("pdf_versions", lambda v: v.get("pdf_document_id") == doc_id)
        if not versions and auth_token:
            versions = await supabase_service.query("pdf_versions", {"pdf_document_id": f"eq.{doc_id}"}, auth_token=auth_token)
        d_copy = dict(d)
        d_copy["versions"] = versions
        d_copy["latest_download_url"] = f"/api/v1/pdf/{doc_id}/download"
        results.append(d_copy)
    return results

@router.get("/pdf/{pdf_id}", response_model=dict)
async def get_pdf_details(pdf_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    doc = db_store.get_by_id("pdf_documents", pdf_id)
    if not doc and auth_token:
        res = await supabase_service.query("pdf_documents", {"id": f"eq.{pdf_id}"}, auth_token=auth_token)
        doc = res[0] if res else None

    if not doc:
        raise HTTPException(status_code=404, detail="PDF Document not found")

    versions = db_store.query("pdf_versions", lambda v: v.get("pdf_document_id") == pdf_id)
    if not versions and auth_token:
        versions = await supabase_service.query("pdf_versions", {"pdf_document_id": f"eq.{pdf_id}"}, auth_token=auth_token)
    doc_copy = dict(doc)
    doc_copy["versions"] = versions
    doc_copy["latest_download_url"] = f"/api/v1/pdf/{pdf_id}/download"
    return doc_copy

@router.get("/pdf/{pdf_id}/versions", response_model=List[dict])
async def get_pdf_versions(pdf_id: str, current_user: dict = Depends(get_current_user)):
    auth_token = current_user.get("token")
    versions = db_store.query("pdf_versions", lambda v: v.get("pdf_document_id") == pdf_id)
    if not versions and auth_token:
        versions = await supabase_service.query("pdf_versions", {"pdf_document_id": f"eq.{pdf_id}"}, auth_token=auth_token)
    return versions

@router.post("/pdf/{pdf_id}/regenerate", response_model=dict)
async def regenerate_living_pdf(
    pdf_id: str,
    changes_summary: Optional[str] = "Updated with latest verified source modifications",
    current_user: dict = Depends(get_current_user)
):
    auth_token = current_user.get("token")
    doc = db_store.get_by_id("pdf_documents", pdf_id)
    if not doc and auth_token:
        res = await supabase_service.query("pdf_documents", {"id": f"eq.{pdf_id}"}, auth_token=auth_token)
        doc = res[0] if res else None

    if not doc:
        raise HTTPException(status_code=404, detail="PDF Document not found")

    user_id = current_user["sub"]
    new_version_num = doc.get("current_version", 1) + 1

    research_data = {}
    if doc.get("research_project_id"):
        pid = doc["research_project_id"]
        proj = db_store.get_by_id("research_projects", pid)
        if not proj and auth_token:
            p_res = await supabase_service.query("research_projects", {"id": f"eq.{pid}"}, auth_token=auth_token)
            proj = p_res[0] if p_res else None

        gaps = db_store.query("information_gaps", lambda g: g.get("research_project_id") == pid)
        if not gaps and auth_token:
            gaps = await supabase_service.query("information_gaps", {"research_project_id": f"eq.{pid}"}, auth_token=auth_token)
        conflicts = db_store.query("conflicts", lambda c: c.get("research_project_id") == pid)
        if not conflicts and auth_token:
            conflicts = await supabase_service.query("conflicts", {"research_project_id": f"eq.{pid}"}, auth_token=auth_token)
        tasks = db_store.query("verification_tasks", lambda t: t.get("research_project_id") == pid)
        if not tasks and auth_token:
            tasks = await supabase_service.query("verification_tasks", {"research_project_id": f"eq.{pid}"}, auth_token=auth_token)
        claims = db_store.query("claims", lambda c: c.get("research_project_id") == pid)
        if not claims and auth_token:
            claims = await supabase_service.query("claims", {"research_project_id": f"eq.{pid}"}, auth_token=auth_token)

        research_data = {
            "summary": proj.get("summary") if proj else "",
            "readiness_score": proj.get("readiness_score") if proj else {},
            "information_gaps": gaps,
            "conflicts": conflicts,
            "verification_checklist": tasks,
            "claims": claims,
        }

    # Generate updated version bytes
    pdf_bytes = pdf_generator.generate_report(
        title=doc.get("title", "VERITYX Intelligence Report"),
        research_data=research_data,
        version=new_version_num,
        changes_summary=changes_summary
    )

    storage_path = f"{user_id}/{pdf_id}_v{new_version_num}.pdf"
    db_store.pdf_binaries[storage_path] = pdf_bytes

    # Update document version count
    db_store.update("pdf_documents", pdf_id, {"current_version": new_version_num})
    await supabase_service.update("pdf_documents", pdf_id, {"current_version": new_version_num}, auth_token=auth_token)

    ver_record = {
        "id": str(uuid.uuid4()),
        "pdf_document_id": pdf_id,
        "version_number": new_version_num,
        "storage_path": storage_path,
        "download_url": f"/api/v1/pdf/{pdf_id}/download?version={new_version_num}",
        "change_summary": changes_summary,
        "research_snapshot": research_data,
    }
    db_store.insert("pdf_versions", ver_record)
    sb_ver = {k: v for k, v in ver_record.items() if k != "download_url"}
    await supabase_service.insert("pdf_versions", sb_ver, auth_token=auth_token)

    # In-app notification for new Living PDF version
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "opportunity_id": doc.get("opportunity_id"),
        "notification_type": "status_update",
        "title": f"Living PDF Version {new_version_num}.0 Available",
        "message": f"A new version of '{doc.get('title')}' was generated: {changes_summary}.",
    }
    db_store.insert("notifications", notif)
    await supabase_service.insert("notifications", notif, auth_token=auth_token)

    return {
        "message": f"Living PDF regenerated to Version {new_version_num}.0",
        "version": ver_record,
        "download_url": f"/api/v1/pdf/{pdf_id}/download?version={new_version_num}",
    }

@router.get("/pdf/{pdf_id}/download")
async def download_pdf(pdf_id: str, version: Optional[int] = None):
    doc = db_store.get_by_id("pdf_documents", pdf_id)
    if not doc:
        raise HTTPException(status_code=404, detail="PDF document not found")

    target_version = version or doc.get("current_version", 1)
    ver = db_store.query(
        "pdf_versions",
        lambda v: v.get("pdf_document_id") == pdf_id and v.get("version_number") == target_version
    )
    
    if not ver:
        raise HTTPException(status_code=404, detail=f"Version {target_version} not found for this document")

    storage_path = ver[0]["storage_path"]
    pdf_bytes = db_store.pdf_binaries.get(storage_path)

    if not pdf_bytes:
        # Re-generate on demand if buffer was evacuated
        pdf_bytes = pdf_generator.generate_report(
            title=doc.get("title", "VERITYX Intelligence Report"),
            research_data=ver[0].get("research_snapshot") or {},
            version=target_version,
            changes_summary=ver[0].get("change_summary")
        )
        db_store.pdf_binaries[storage_path] = pdf_bytes

    clean_filename = f"VERITYX_{pdf_id[:8]}_v{target_version}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"'
        }
    )

