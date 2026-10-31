"""
Unit and integration tests for VERITYX AI 2.0 Dynamic AI Eligibility Analyzer,
Deadline Guardian, and AI Assistant.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.eligibility_engine import EligibilityEvaluationEngine, VERIFIED_OPPORTUNITY_TEMPLATES
from app.services.deadline_guardian import deadline_guardian
from app.schemas.eligibility import CandidateProfileInput, OpportunityCriteria

client = TestClient(app)

def test_templates_endpoint():
    res = client.get("/api/v1/eligibility/templates")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    ids = [t["opportunity_id"] for t in data]
    assert "tmpl-railway-alp" in ids
    assert "tmpl-defence-nda" in ids
    assert "tmpl-scholarship-central" in ids

def test_railway_alp_eligible():
    alp_tmpl = EligibilityEvaluationEngine.get_template("tmpl-railway-alp")
    assert alp_tmpl is not None

    # Candidate with matching criteria
    candidate = CandidateProfileInput(
        opportunity_id="tmpl-railway-alp",
        opportunity_title=alp_tmpl.title,
        category="railway",
        age=24,
        social_category="General",
        education_level="10th Pass + ITI (Relevant Trade)",
        criteria_responses={
            "alp-age": 24,
            "alp-education": "10th Pass + ITI (Relevant Trade)",
            "alp-vision": "6/6 without glasses (Normal Colour Vision)"
        },
        available_documents=[
            "10th / Matriculation Certificate (DOB Proof)",
            "ITI Certificate (NCVT/SCVT) OR Engineering Diploma",
            "Aadhaar Card"
        ]
    )

    report = EligibilityEvaluationEngine.evaluate(alp_tmpl, candidate)
    assert report.overall_status in ("Eligible", "Conditionally Eligible")
    assert report.readiness_score >= 60
    assert len(report.strengths) >= 2

def test_railway_alp_age_relaxation():
    alp_tmpl = EligibilityEvaluationEngine.get_template("tmpl-railway-alp")
    # OBC candidate age 32 (standard max is 30, OBC gets +3 = 33)
    candidate = CandidateProfileInput(
        opportunity_id="tmpl-railway-alp",
        opportunity_title=alp_tmpl.title,
        category="railway",
        age=32,
        social_category="OBC",
        education_level="3 Years Polytechnic Diploma (Mechanical/Electrical/Electronics/Auto)",
        criteria_responses={
            "alp-age": 32,
            "alp-education": "3 Years Polytechnic Diploma (Mechanical/Electrical/Electronics/Auto)",
            "alp-vision": "6/6 without glasses (Normal Colour Vision)"
        }
    )

    report = EligibilityEvaluationEngine.evaluate(alp_tmpl, candidate)
    assert report.overall_status == "Conditionally Eligible"
    assert any("relaxation" in c.lower() for c in report.required_certificates)

def test_railway_alp_disqualified_vision():
    alp_tmpl = EligibilityEvaluationEngine.get_template("tmpl-railway-alp")
    candidate = CandidateProfileInput(
        opportunity_id="tmpl-railway-alp",
        opportunity_title=alp_tmpl.title,
        category="railway",
        age=22,
        social_category="General",
        criteria_responses={
            "alp-age": 22,
            "alp-education": "10th Pass + ITI (Relevant Trade)",
            "alp-vision": "Colour Blind or Defective Vision"
        }
    )
    report = EligibilityEvaluationEngine.evaluate(alp_tmpl, candidate)
    assert report.overall_status == "Not Eligible"
    assert report.readiness_score <= 25

def test_defence_nda_height_criteria():
    nda_tmpl = EligibilityEvaluationEngine.get_template("tmpl-defence-nda")
    assert nda_tmpl is not None

    # Candidate with below height (152cm < 157cm min)
    candidate = CandidateProfileInput(
        opportunity_id="tmpl-defence-nda",
        opportunity_title=nda_tmpl.title,
        category="defence",
        age=18,
        height_cm=152,
        criteria_responses={
            "nda-age": 18,
            "nda-education": "12th Pass with Physics, Chemistry & Mathematics (PCM)",
            "nda-height": 152,
            "nda-chest": "Satisfies 77 cm unexpanded with >= 5 cm expansion"
        }
    )
    report = EligibilityEvaluationEngine.evaluate(nda_tmpl, candidate)
    assert report.overall_status == "Not Eligible"
    assert any("height" in m.lower() for m in report.missing_requirements)

def test_scholarship_income_criteria():
    sch_tmpl = EligibilityEvaluationEngine.get_template("tmpl-scholarship-central")
    assert sch_tmpl is not None

    # Family income above ceiling (6 LPA > 4.5 LPA ceiling)
    candidate = CandidateProfileInput(
        opportunity_id="tmpl-scholarship-central",
        opportunity_title=sch_tmpl.title,
        category="scholarship",
        age=19,
        family_annual_income=600000,
        criteria_responses={
            "sch-income": 600000,
            "sch-education": 75,
            "sch-enrolled": "Regular Full-Time College Student"
        }
    )
    report = EligibilityEvaluationEngine.evaluate(sch_tmpl, candidate)
    assert report.overall_status == "Not Eligible"

def test_deadline_guardian_metrics():
    # Far future deadline
    m1 = deadline_guardian.calculate_deadline_metrics("2028-12-31")
    assert m1["has_deadline"] is True
    assert m1["days_remaining"] > 100
    assert m1["is_overdue"] is False

    # Overdue deadline
    m2 = deadline_guardian.calculate_deadline_metrics("2020-01-01")
    assert m2["has_deadline"] is True
    assert m2["is_overdue"] is True
    assert m2["urgency_level"] == "overdue"

def test_evaluate_endpoint():
    alp_tmpl = EligibilityEvaluationEngine.get_template("tmpl-railway-alp")
    payload = {
        "criteria": alp_tmpl.model_dump(),
        "candidate": {
            "opportunity_id": "tmpl-railway-alp",
            "opportunity_title": alp_tmpl.title,
            "category": "railway",
            "age": 25,
            "social_category": "General",
            "education_level": "10th Pass + ITI (Relevant Trade)",
            "criteria_responses": {
                "alp-age": 25,
                "alp-education": "10th Pass + ITI (Relevant Trade)",
                "alp-vision": "6/6 without glasses (Normal Colour Vision)"
            },
            "available_documents": [
                "10th / Matriculation Certificate (DOB Proof)",
                "ITI Certificate (NCVT/SCVT) OR Engineering Diploma"
            ]
        }
    }
    res = client.post("/api/v1/eligibility/evaluate", json=payload)
    assert res.status_code == 200
    report = res.json()
    assert "overall_status" in report
    assert "readiness_score" in report
    assert report["readiness_score"] > 50

def test_recommendations_endpoint():
    res = client.get("/api/v1/eligibility/recommendations?category=Student&interests=coding,defence")
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Student"
    assert len(data["recommendations"]) >= 3

