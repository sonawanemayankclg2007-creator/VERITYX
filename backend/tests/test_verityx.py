import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import is_safe_url
from app.services.pdf_generator import pdf_generator

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "VERITYX"

def test_ssrf_safety_guard():
    # Should block localhost and internal network
    assert is_safe_url("http://localhost:8000") is False
    assert is_safe_url("http://127.0.0.1:8000") is False
    assert is_safe_url("http://169.254.169.254/latest/meta-data") is False
    assert is_safe_url("file:///etc/passwd") is False
    # Should allow valid public domains
    assert is_safe_url("https://www.google.com") is True
    assert is_safe_url("https://rrccr.com") is True

def test_create_and_query_research():
    payload = {
        "title": "National Merit Scholarship 2026 Test",
        "research_question": "What are the exact income criteria and application deadlines?",
        "research_goal": "Detect information gaps and contradictory statements.",
        "sources": [
            {
                "title": "Official Portal Guidelines",
                "source_type": "webpage",
                "source_content": "Candidates family income must not exceed 2.5 Lakh per annum. Closing date is 30/11/2026."
            },
            {
                "title": "Scholarship Alert Blog",
                "source_type": "webpage",
                "source_content": "Eligible candidates with family income up to 3.5 Lakh may apply. Last date is 15/12/2026."
            }
        ]
    }
    response = client.post("/api/v1/research", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert len(data["gaps"]) > 0
    assert "readiness_score" in data["project"]

def test_track_opportunity_and_status_update():
    payload = {
        "title": "SSC CGL Examination 2026",
        "organization": "Staff Selection Commission",
        "opportunity_type": "govt",
        "official_url": "https://ssc.gov.in",
        "application_deadline": "2026-12-15",
        "application_status": "Not Started"
    }
    res = client.post("/api/v1/opportunities/track", json=payload)
    assert res.status_code == 200
    opp_data = res.json()["opportunity"]
    opp_id = opp_data["id"]

    # Update status to "In Progress"
    status_res = client.patch(f"/api/v1/opportunities/{opp_id}/status", json={"application_status": "In Progress"})
    assert status_res.status_code == 200
    assert status_res.json()["opportunity"]["application_status"] == "In Progress"

def test_pdf_generation_and_download():
    # Generate living PDF
    res = client.post("/api/v1/pdf/generate", json={"title": "Test Living Intelligence Report"})
    assert res.status_code == 200
    pdf_info = res.json()
    doc_id = pdf_info["document"]["id"]

    # Test PDF download endpoint
    dl_res = client.get(f"/api/v1/pdf/{doc_id}/download")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert dl_res.content.startswith(b"%PDF")

