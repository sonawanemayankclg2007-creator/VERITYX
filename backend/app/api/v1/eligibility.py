"""
VERITYX AI 2.0 - Dynamic AI Eligibility & Selection Readiness Analyzer Routes
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.schemas.eligibility import (
    OpportunityCriteria,
    CandidateProfileInput,
    EligibilityAssessmentReport,
    AIAssistantRequest,
    AIAssistantResponse,
    FollowUpResponse
)
from app.services.eligibility_engine import EligibilityEvaluationEngine
from app.services.deadline_guardian import deadline_guardian
from app.services.ai_engine import ai_engine
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

router = APIRouter()

class ExtractCriteriaRequest(BaseModel):
    title: str
    category: str
    notification_text: str
    url: Optional[str] = None

class EvaluateRequest(BaseModel):
    criteria: OpportunityCriteria
    candidate: CandidateProfileInput

@router.get("/eligibility/templates", response_model=List[OpportunityCriteria])
async def list_templates():
    """Returns verified opportunity templates across Railway, Defence, Scholarships, Jobs, etc."""
    return EligibilityEvaluationEngine.get_all_templates()

@router.get("/eligibility/templates/{template_id}", response_model=OpportunityCriteria)
async def get_template(template_id: str):
    """Returns a specific verified opportunity template."""
    tmpl = EligibilityEvaluationEngine.get_template(template_id)
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl

@router.post("/eligibility/extract", response_model=OpportunityCriteria)
async def extract_criteria(data: ExtractCriteriaRequest):
    """Uses Gemini to parse notification text or guidelines into structured criteria."""
    extracted = await ai_engine.extract_eligibility_criteria(
        notification_text=data.notification_text,
        title=data.title,
        category=data.category
    )
    if data.url and not extracted.get("official_notification_url"):
        extracted["official_notification_url"] = data.url
    return OpportunityCriteria.model_validate(extracted)

@router.post("/eligibility/evaluate", response_model=EligibilityAssessmentReport)
async def evaluate_eligibility(
    data: EvaluateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Deterministic rule checking engine:
    Evaluates age, relaxations, educational qualifications, physical/medical parameters,
    calculates AI Opportunity Readiness Score (0-100), and provides actionable next steps.
    """
    user_id = current_user.get("sub", "00000000-0000-0000-0000-000000000000")
    auth_token = current_user.get("token")

    report = EligibilityEvaluationEngine.evaluate(data.criteria, data.candidate)
    report.user_id = user_id

    # Enrich with Gemini personalized guidance if API key available
    try:
        guidance = await ai_engine.generate_personalized_guidance(
            report.model_dump(),
            data.candidate.model_dump()
        )
        if guidance.get("priority_action_items"):
            for act in guidance["priority_action_items"][:2]:
                if act not in report.recommendations:
                    report.recommendations.append(act)
        if guidance.get("preparation_roadmap"):
            for rm in guidance["preparation_roadmap"][:2]:
                if rm not in report.next_steps:
                    report.next_steps.append(rm)
        if guidance.get("timeline_warning"):
            report.verification_warnings.append(guidance["timeline_warning"])
    except Exception as e:
        print(f"[Eligibility] Guidance generation note: {e}")

    # Persist report in local store and Supabase
    report_dict = report.model_dump()
    db_store.insert("eligibility_reports", report_dict)

    # Also log assessment notification
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "opportunity_id": data.criteria.opportunity_id or report.id,
        "notification_type": "eligibility_result",
        "title": f"Eligibility Assessed: {report.opportunity_title}",
        "message": f"Result: {report.overall_status} (Readiness Score: {report.readiness_score}/100). Check improvement recommendations.",
        "created_at": datetime.utcnow().isoformat()
    }
    db_store.insert("notifications", notif)
    if auth_token:
        try:
            await supabase_service.insert("notifications", notif, auth_token=auth_token)
        except Exception:
            pass

    return report

@router.get("/eligibility/reports", response_model=List[EligibilityAssessmentReport])
async def list_reports(current_user: dict = Depends(get_current_user)):
    """Returns saved eligibility assessment reports for the authenticated user."""
    user_id = current_user.get("sub", "00000000-0000-0000-0000-000000000000")
    items = db_store.query("eligibility_reports", lambda r: r.get("user_id") == user_id)
    items.sort(key=lambda x: x.get("assessed_at", ""), reverse=True)
    return [EligibilityAssessmentReport.model_validate(i) for i in items]

@router.get("/eligibility/reports/{report_id}", response_model=EligibilityAssessmentReport)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Returns a specific eligibility assessment report."""
    item = db_store.get_by_id("eligibility_reports", report_id)
    if not item:
        raise HTTPException(status_code=404, detail="Assessment report not found")
    return EligibilityAssessmentReport.model_validate(item)

@router.get("/eligibility/recommendations")
async def get_category_recommendations(
    category: str = Query("Student", description="Student, Employee, or Unemployed"),
    interests: Optional[str] = Query(None, description="Comma-separated interests"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    education: Optional[str] = Query(None, description="Candidate education level"),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns personalized opportunity recommendations powered by Gemini
    tailored to the user's category (Student, Employee, Unemployed) and custom profile.
    """
    interest_list = [i.strip() for i in interests.split(",")] if interests else []
    skill_list = [s.strip() for s in skills.split(",")] if skills else []

    recs = await ai_engine.generate_category_recommendations(
        user_category=category,
        interests=interest_list,
        skills=skill_list,
        education=education
    )
    return {"category": category, "recommendations": recs}

@router.post("/eligibility/assistant", response_model=AIAssistantResponse)
async def run_ai_assistant(
    data: AIAssistantRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Global conversational Gemini Assistant. Answers user queries on eligibility,
    rules, deadlines, certificate formats, and study plans.
    """
    context_opp = None
    if data.context_opportunity_id:
        context_opp = db_store.get_by_id("tracked_opportunities", data.context_opportunity_id)

    history_dicts = [{"role": h.role, "content": h.content} for h in data.conversation_history]
    res = await ai_engine.chat_assistant(
        message=data.message,
        history=history_dicts,
        context_opp=context_opp
    )
    return AIAssistantResponse.model_validate(res)

@router.post("/opportunities/{opportunity_id}/followup")
async def submit_progress_follow_up(
    opportunity_id: str,
    data: FollowUpResponse,
    current_user: dict = Depends(get_current_user)
):
    """
    Handles 4-day progress follow-up responses:
    - 'completed': marks application as Completed / Applied.
    - 'still_in_progress': acknowledges ongoing effort and resets follow-up timer.
    - 'need_help': connects with Gemini guidance and suggests next actions.
    """
    user_id = current_user.get("sub")
    auth_token = current_user.get("token")

    opp = db_store.get_by_id("tracked_opportunities", opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    now_iso = datetime.utcnow().isoformat()
    updates: Dict[str, Any] = {"last_followup_at": now_iso}

    response_type = data.response_type.lower()
    guidance_message = ""

    if response_type == "completed":
        updates["application_status"] = "Completed"
        updates["next_followup_at"] = None
        guidance_message = "Congratulations on completing your submission! Keep your application acknowledgement slip and fee receipt safely stored."
    elif response_type == "still_in_progress":
        # Schedule another follow-up after 3 days
        next_dt = datetime.utcnow() + timedelta(days=3)
        updates["next_followup_at"] = next_dt.isoformat()
        guidance_message = "Keep up the momentum! Another check-in has been scheduled in 3 days. Ensure your scanned documents match official specifications."
    elif response_type == "need_help":
        # Query Gemini AI for contextual assistance
        prompt_query = f"I am currently applying for '{opp.get('title')}' and need help with the next preparation or document submission steps. Provide 2 concise, practical recommendations."
        try:
            ai_res = await ai_engine.chat_assistant(
                message=prompt_query,
                history=[],
                context_opp=opp
            )
            guidance_message = ai_res.get("reply", "Gemini Assistant: Verify your photograph pixel dimensions and keep original caste/income certificates ready for spot upload.")
        except Exception:
            guidance_message = "Our Gemini Assistant is available to help clarify documents, check eligibility criteria, or outline preparation tips."

    db_store.update("tracked_opportunities", opportunity_id, updates)
    if auth_token:
        try:
            await supabase_service.update("tracked_opportunities", opportunity_id, updates, auth_token=auth_token)
        except Exception:
            pass

    # Add notification for follow-up
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "opportunity_id": opportunity_id,
        "notification_type": "status_update",
        "title": f"Follow-up Recorded: {data.response_type.replace('_', ' ').title()}",
        "message": guidance_message,
        "created_at": now_iso
    }
    db_store.insert("notifications", notif)
    if auth_token:
        try:
            await supabase_service.insert("notifications", notif, auth_token=auth_token)
        except Exception:
            pass

    return {
        "message": "Follow-up status recorded successfully",
        "response_type": data.response_type,
        "guidance": guidance_message,
        "opportunity_status": updates.get("application_status", opp.get("application_status"))
    }

