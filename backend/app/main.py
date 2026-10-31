import os
import asyncio
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.research import router as research_router
from app.api.v1.sources import router as sources_router
from app.api.v1.opportunities import router as opportunities_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.pdf import router as pdf_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.eligibility import router as eligibility_router
from app.services.deadline_guardian import deadline_guardian
from app.services.supabase_client import supabase_service
from app.db.local_store import db_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize benchmark opportunity & research project for immediate demonstration
    bench_proj_id = "00000000-0000-0000-0000-000000000001"
    bench_opp_id = "00000000-0000-0000-0000-000000000002"
    dev_user_id = "00000000-0000-0000-0000-000000000000"

    if not db_store.get_by_id("research_projects", bench_proj_id):
        # Seed initial benchmark project
        db_store.insert("research_projects", {
            "id": bench_proj_id,
            "user_id": dev_user_id,
            "title": "Central Railway Apprentice Recruitment 2026 Verification",
            "research_question": "What are the official eligibility criteria, stipend, and cutoff dates for 10th+ITI applicants?",
            "research_goal": "Verify inconsistent information across portal announcements vs secondary coaching blogs.",
            "summary": "Synthesized official Railway Recruitment Cell notifications with secondary coaching guides. Identified significant conflict regarding age relaxation cutoff dates and an unverified document verification format.",
            "readiness_score": {
                "score": 68,
                "explanation": "Core eligibility criteria confirmed in official gazette, but final date closing and certificate format require direct verification.",
                "coverage_score": 75,
                "evidence_quality_score": 80,
                "unresolved_conflicts": 1,
                "freshness_score": 65,
                "critical_missing_information": "Official clarification on Annexure IV Medical Format"
            },
            "status": "completed"
        })

        db_store.insert("sources", {
            "id": "src-official-1",
            "research_project_id": bench_proj_id,
            "user_id": dev_user_id,
            "url": "https://rrccr.com/announcements/apprentice-2026.pdf",
            "title": "Railway Recruitment Cell (Central Railway) Official Gazette",
            "source_type": "pdf",
            "source_content": "Section 3.1: Minimum age 15 years, maximum 24 years as on 15-10-2026. Application closing date: 15-11-2026.",
            "publication_date": "2026-09-15",
            "freshness_status": "current",
            "verification_status": "verified_official"
        })

        db_store.insert("sources", {
            "id": "src-blog-2",
            "research_project_id": bench_proj_id,
            "user_id": dev_user_id,
            "url": "https://examupdates-portal.in/railway-apprentice-dates",
            "title": "ExamUpdates Educational Coaching Portal",
            "source_type": "webpage",
            "source_content": "The coaching portal claims general candidates enjoy a 2-year general relaxation for all apprentice batches, pushing max age to 26 years.",
            "publication_date": "2025-11-20",
            "freshness_status": "potentially_outdated",
            "verification_status": "unverified"
        })

        db_store.insert("claims", {
            "id": "claim-1",
            "research_project_id": bench_proj_id,
            "source_id": "src-official-1",
            "claim_text": "Candidate must have completed 15 years and not exceeded 24 years as on 15/10/2026.",
            "claim_type": "eligibility",
            "confidence": 0.98,
            "evidence_text": "Section 3.1: Age Criteria: Minimum age 15 years completed, maximum 24 years as on closing date."
        })

        db_store.insert("claims", {
            "id": "claim-2",
            "research_project_id": bench_proj_id,
            "source_id": "src-blog-2",
            "claim_text": "Maximum age limit is 26 years for general candidates as per revised 2025 order.",
            "claim_type": "eligibility",
            "confidence": 0.45,
            "evidence_text": "Coaching portal claims 2-year general relaxation applied across all apprentice batches."
        })

        db_store.insert("conflicts", {
            "id": "conf-1",
            "research_project_id": bench_proj_id,
            "claim_a_id": "claim-1",
            "claim_b_id": "claim-2",
            "description": "Conflict on Maximum Age Cutoff: Official gazette states 24 years; secondary coaching portal claims 26 years.",
            "confidence": 0.94,
            "status": "unresolved",
            "recommended_action": "Rely strictly on Official RRC Gazette notification (24 years). Do not pay application fee if exceeding 24 unless SC/ST/OBC category relaxation applies."
        })

        db_store.insert("information_gaps", {
            "id": "gap-1",
            "research_project_id": bench_proj_id,
            "title": "Missing Medical Fitness Certificate Format for PwBD Applicants",
            "description": "Neither source specifies whether state district hospital format or central surgeon format is mandatory for document verification.",
            "importance": "critical",
            "confidence": 0.90,
            "status": "open",
            "recommended_action": "Contact RRC Mumbai helpdesk or review Annexure IV of the primary gazette notification before physical verification."
        })

        db_store.insert("verification_tasks", {
            "id": "task-1",
            "research_project_id": bench_proj_id,
            "title": "Verify Annexure IV Medical Format with RRC Helpdesk",
            "description": "Call the official RRC Central Railway enquiry counter to confirm accepted disability certificate issuance authority.",
            "priority": "critical",
            "status": "pending",
            "due_date": "2026-11-05"
        })

        # Seed tracked opportunity
        db_store.insert("tracked_opportunities", {
            "id": bench_opp_id,
            "user_id": dev_user_id,
            "research_project_id": bench_proj_id,
            "title": "Central Railway Apprentice Engagement 2026",
            "organization": "Railway Recruitment Cell, Central Railway (CR)",
            "opportunity_type": "railway",
            "official_url": "https://rrccr.com",
            "application_start_date": "2026-09-20",
            "application_deadline": "2026-11-15",
            "application_status": "In Progress",
            "monitoring_enabled": True
        })

        db_store.insert("opportunity_dates", {
            "id": "date-1",
            "opportunity_id": bench_opp_id,
            "date_type": "start_date",
            "date_value": "2026-09-20",
            "verification_status": "verified"
        })
        db_store.insert("opportunity_dates", {
            "id": "date-2",
            "opportunity_id": bench_opp_id,
            "date_type": "deadline",
            "date_value": "2026-11-15",
            "verification_status": "verified"
        })

        db_store.insert("notifications", {
            "id": "notif-1",
            "user_id": dev_user_id,
            "opportunity_id": bench_opp_id,
            "notification_type": "deadline_reminder",
            "title": "Smart Deadline Reminder: Central Railway Apprentice 2026",
            "message": "Your application is currently marked 'In Progress'. The official deadline closes on 2026-11-15.",
        })

    # Start automatic background notification worker (Phase 6)
    async def automatic_notification_guardian_worker():
        while True:
            try:
                opportunities = db_store.query("tracked_opportunities")
                for opp in opportunities:
                    user_id = opp.get("user_id")
                    if not user_id:
                        continue

                    app_status = (opp.get("application_status") or "").lower()
                    if app_status in ("completed", "registered", "not interested"):
                        continue

                    existing_notifs = db_store.query("notifications", lambda n: n.get("user_id") == user_id)

                    # Automated deadline reminders (5d, 3d, 1d, 0d, overdue)
                    new_alerts = deadline_guardian.generate_scheduled_notifications(user_id, opp, existing_notifs)
                    for alert in new_alerts:
                        db_store.insert("notifications", alert)
                        try:
                            await supabase_service.insert("notifications", alert)
                        except Exception:
                            pass

                    # Automated 4-day progress follow-up check
                    follow_up_needed, days_elapsed = deadline_guardian.check_four_day_follow_up_needed(opp)
                    if follow_up_needed:
                        has_follow_up = any(
                            n.get("opportunity_id") == opp["id"] and "Progress Follow-up" in n.get("title", "") and not n.get("read_at")
                            for n in existing_notifs
                        )
                        if not has_follow_up:
                            follow_up_alert = {
                                "id": str(uuid.uuid4()),
                                "user_id": user_id,
                                "opportunity_id": opp["id"],
                                "notification_type": "status_update",
                                "title": f"Progress Follow-up: {opp.get('title')}",
                                "message": f"Your application has been in progress for {days_elapsed} days. Let us know if you submitted, need more time, or need AI guidance.",
                                "priority": "medium",
                                "created_at": deadline_guardian.now_ist().isoformat()
                            }
                            db_store.insert("notifications", follow_up_alert)
                            try:
                                await supabase_service.insert("notifications", follow_up_alert)
                            except Exception:
                                pass
            except Exception as e:
                print(f"[Scheduler] Background notice: {e}")

            await asyncio.sleep(60)

    scheduler_task = asyncio.create_task(automatic_notification_guardian_worker())
    print(f"[{settings.PROJECT_NAME}] Startup complete. Server listening on {settings.BACKEND_URL}")
    try:
        yield
    finally:
        scheduler_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Assisted Information Gap Detection, Verification & Opportunity Intelligence Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite frontend & client access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Register API v1 Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(research_router, prefix=settings.API_V1_STR, tags=["Research & Gaps"])
app.include_router(sources_router, prefix=settings.API_V1_STR, tags=["Sources"])
app.include_router(opportunities_router, prefix=settings.API_V1_STR, tags=["Opportunities"])
app.include_router(notifications_router, prefix=settings.API_V1_STR, tags=["Notifications"])
app.include_router(pdf_router, prefix=settings.API_V1_STR, tags=["Living PDF"])
app.include_router(monitoring_router, prefix=settings.API_V1_STR, tags=["Source Monitoring"])
app.include_router(eligibility_router, prefix=settings.API_V1_STR, tags=["Eligibility & Readiness"])

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "Don't Just Find Information. Discover What You're Missing.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

