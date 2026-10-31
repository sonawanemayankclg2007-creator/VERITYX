import pytest
import httpx
import jwt
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.supabase_client import supabase_service

client = TestClient(app)

SUPABASE_URL = settings.SUPABASE_URL.rstrip('/')
PUBLISHABLE_KEY = settings.SUPABASE_ANON_KEY

# ---------------------------------------------------------------------------
# 1. Supabase Project & Auth Configuration Verification
# ---------------------------------------------------------------------------
def test_supabase_live_connectivity_and_auth_settings():
    """Verify live Supabase endpoint and provider settings"""
    with httpx.Client(timeout=10.0) as http_client:
        res = http_client.get(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers={"apikey": PUBLISHABLE_KEY}
        )
        assert res.status_code == 200, f"Supabase auth settings check failed: {res.text}"
        data = res.json()
        
        # Verify providers enabled in Supabase
        external = data.get("external", {})
        assert external.get("google") is True, "Google OAuth provider is not enabled in Supabase!"
        assert external.get("email") is True, "Email provider is not enabled in Supabase!"
        assert data.get("disable_signup") is False, "Signups are disabled in Supabase!"

def test_google_oauth_authorize_flow():
    """Verify that Google OAuth correctly initializes and generates Google consent redirect"""
    with httpx.Client(timeout=10.0) as http_client:
        redirect_to = f"{settings.FRONTEND_URL}/auth/callback"
        res = http_client.get(
            f"{SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to={redirect_to}",
            headers={"apikey": PUBLISHABLE_KEY},
            follow_redirects=False
        )
        # Should return a 302 redirect to Google OAuth login
        assert res.status_code == 302, f"Expected 302 redirect from Supabase OAuth, got {res.status_code}"
        location = res.headers.get("location", "")
        assert "accounts.google.com" in location, f"Expected redirect to accounts.google.com, got {location}"
        assert "client_id=" in location
        assert "response_type=code" in location

def test_supabase_password_reset_flow():
    """Test password reset trigger on Supabase Auth"""
    with httpx.Client(timeout=10.0) as http_client:
        res = http_client.post(
            f"{SUPABASE_URL}/auth/v1/recover",
            headers={"apikey": PUBLISHABLE_KEY, "Content-Type": "application/json"},
            json={"email": "researcher@example.com"}
        )
        # Supabase returns 200 (or 429 if email rate limit reached on Free Tier)
        assert res.status_code in (200, 429), f"Unexpected status on recover: {res.status_code} {res.text}"

def test_supabase_database_tables_accessible():
    """Verify that Supabase PostgreSQL tables exist and are accessible via PostgREST"""
    with httpx.Client(timeout=10.0) as http_client:
        headers = {
            "apikey": PUBLISHABLE_KEY,
            "Authorization": f"Bearer {PUBLISHABLE_KEY}"
        }
        for table in ["profiles", "research_projects", "sources", "claims", "information_gaps", "tracked_opportunities"]:
            res = http_client.get(f"{SUPABASE_URL}/rest/v1/{table}?limit=1", headers=headers)
            assert res.status_code == 200, f"Table {table} query failed with status {res.status_code}: {res.text}"

# ---------------------------------------------------------------------------
# 2. JWT Authentication Context & RLS Compliance Tests
# ---------------------------------------------------------------------------
def generate_mock_user_jwt(user_id: str, email: str) -> str:
    """Generate a JWT representing an authenticated user session"""
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": 9999999999
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def test_authenticated_user_context():
    """Verify backend correctly extracts user identity and token from auth header"""
    test_user_id = str(uuid.uuid4())
    test_token = generate_mock_user_jwt(test_user_id, "user1@verityx.ai")
    
    headers = {"Authorization": f"Bearer {test_token}"}
    res = client.get("/api/v1/research", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_rls_isolation_between_different_users():
    """Verify that user A cannot see user B's research projects"""
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())
    
    token_a = generate_mock_user_jwt(user_a_id, "usera@verityx.ai")
    token_b = generate_mock_user_jwt(user_b_id, "userb@verityx.ai")
    
    # Create project as User A
    payload_a = {
        "title": "Private Project of User A",
        "research_question": "Confidential question",
        "research_goal": "RLS policy verification",
        "sources": [{"title": "User A Private Doc", "source_type": "text", "source_content": "User A content"}]
    }
    res_a = client.post("/api/v1/research", json=payload_a, headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    project_a_id = res_a.json()["id"]
    
    # List projects as User A -> should contain project_a
    list_a = client.get("/api/v1/research", headers={"Authorization": f"Bearer {token_a}"}).json()
    assert any(p["id"] == project_a_id for p in list_a)
    
    # List projects as User B -> MUST NOT contain project_a
    list_b = client.get("/api/v1/research", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert not any(p["id"] == project_a_id for p in list_b), "RLS breach! User B was able to see User A's project!"

# ---------------------------------------------------------------------------
# 3. Database Persistence & End-to-End Feature Flows
# ---------------------------------------------------------------------------
def test_full_research_analysis_persistence_flow():
    """Test full creation, gap detection, conflict analysis, and retrieval flow"""
    user_id = str(uuid.uuid4())
    token = generate_mock_user_jwt(user_id, "researcher@verityx.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "title": "Indian Railways Apprenticeship Examination 2026",
        "research_question": "What are the age limits and application deadlines?",
        "research_goal": "Detect information gaps and contradictory statements.",
        "sources": [
            {
                "title": "Official RRC Gazetted Notice",
                "source_type": "webpage",
                "source_content": "Candidates must be between 15 and 24 years old. Last date to submit is 15-11-2026. Application fee is Rs. 100."
            },
            {
                "title": "Coaching Institute Exam Bulletin",
                "source_type": "webpage",
                "source_content": "Upper age limit extended up to 28 years. Last date to submit is 30-11-2026."
            }
        ]
    }
    
    # 1. Create project
    create_res = client.post("/api/v1/research", json=payload, headers=headers)
    assert create_res.status_code == 200
    data = create_res.json()
    pid = data["id"]
    
    assert data["project"]["title"] == payload["title"]
    assert len(data["sources"]) == 2
    assert len(data["claims"]) > 0
    assert len(data["gaps"]) > 0
    assert len(data["conflicts"]) > 0
    assert len(data["tasks"]) > 0
    
    # 2. Retrieve project details by ID
    get_res = client.get(f"/api/v1/research/{pid}", headers=headers)
    assert get_res.status_code == 200
    details = get_res.json()
    assert details["project"]["id"] == pid
    assert len(details["sources"]) == 2
    assert len(details["claims"]) > 0
    assert len(details["gaps"]) > 0
    assert len(details["conflicts"]) > 0
    assert len(details["tasks"]) > 0

def test_opportunity_tracking_and_notification_flow():
    """Test tracking an opportunity, updating status, and generating audit notifications"""
    user_id = str(uuid.uuid4())
    token = generate_mock_user_jwt(user_id, "student@verityx.ai")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "title": "Graduate Aptitude Test in Engineering (GATE) 2026",
        "organization": "IIT Kharagpur",
        "opportunity_type": "exam",
        "official_url": "https://gate2026.iitkgp.ac.in",
        "application_deadline": "2026-10-31",
        "application_status": "Not Started"
    }
    
    # 1. Track opportunity
    res = client.post("/api/v1/opportunities/track", json=payload, headers=headers)
    assert res.status_code == 200
    opp_id = res.json()["opportunity"]["id"]
    
    # 2. Verify notifications generated
    notif_res = client.get("/api/v1/notifications", headers=headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]
    assert len(notifs) > 0
    assert any(n.get("opportunity_id") == opp_id for n in notifs)
    
    # 3. Update status to In Progress
    status_res = client.patch(
        f"/api/v1/opportunities/{opp_id}/status",
        json={"application_status": "In Progress"},
        headers=headers
    )
    assert status_res.status_code == 200
    assert status_res.json()["opportunity"]["application_status"] == "In Progress"

