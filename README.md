# VERITYX — AI-Powered Information Gap Detection & Opportunity Intelligence Platform

> **"Don't Just Find Information. Discover What You're Missing."**  
> Official Problem Statement: **DIGITAL DARK SPOT** — AI-Assisted Information Gap Detection Platform

---

## 🌟 Executive Overview
In education, public recruitment, scholarships, and career decisions, information is fragmented across multiple circulars, forums, and portals. Ordinary search engines retrieve links and summarize content, but fail to answer:
- **What critical requirements are missing?**
- **Which claims between sources directly contradict each other?**
- **Whether eligibility criteria or dates reflect outdated cycles?**
- **What prioritized verification steps must be taken before committing fees or decisions?**

**VERITYX** solves this problem by ingesting multiple sources, extracting atomic factual claims with verbatim evidence, computing an explainable **Decision Readiness Score**, rendering an interactive **Knowledge Gap Graph (React Flow)**, guarding application deadlines with **Smart Deadline Guardian**, monitoring official sources for change detection, and generating versioned **Living PDF** intelligence reports.

---

## 🚀 Key Platform Features

1. **Digital Dark Spot & Information Gap Engine**: Automatically detects omissions such as unverified cutoff hours, unspecified document formats, and missing fee criteria.
2. **Evidence Conflict Radar**: Cross-examines multiple sources to pinpoint direct contradictions (e.g., age limits or deadline divergences) with confidence scores and recommended resolution protocols.
3. **Interactive Knowledge Gap Graph**: Visualizes research topics, sources (Blue), verified claims (Green), information gaps (Yellow), and contradictions (Red) using React Flow with zoom, pan, and interactive inspection.
4. **Information Freshness Detector**: Flags undated sources, past operational cycles, and expired criteria.
5. **Smart Deadline Guardian & Opportunity Tracker**: Monitors time-sensitive vacancies (Railway, Govt jobs, scholarships, college admissions) with live countdowns (`16 days left`, `Today`, `Expired`) and lifecycle stages (`Not Started`, `In Progress`, `Registered`, `Completed`, `Not Interested`).
6. **Official Source Monitoring & Change Detection**: Tracks SHA-256 content hashes, detects deadline extensions and eligibility revisions, marks items as *"Potential Change — Verification Required"*, and maintains an auditable diff log.
7. **ReportLab Living PDF Intelligence**: Generates publication-quality, multi-page PDF dossiers with cover page, executive summary, readiness score meters, gap tables, conflict radar, and version history increments (v1.0 -> v2.0).
8. **Premium Supabase Authentication**: Two-column responsive desktop layout, email/password complexity validation, password strength meters, confirmation match checks, and Google OAuth with PKCE session persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), TanStack Query, Lucide React, Zod |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, ReportLab, BeautifulSoup4, httpx, PyJWT, python-multipart |
| **Database & Auth** | Supabase PostgreSQL (`cfdzutredjuweiszdias`), Supabase Auth (Email & Google OAuth), Row Level Security (RLS) |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) via structured JSON schema parsing with intelligent heuristic fallbacks |

---

## 🏛️ System Architecture

```
                                  +------------------------------+
                                  |    VERITYX Web Client        |
                                  |   (React 18 + Vite + TS)     |
                                  +---------------+--------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
                         v                                                 v
           +-----------------------------+                  +-----------------------------+
           |       Supabase Cloud        |                  |       FastAPI Backend       |
           |  (cfdzutredjuweiszdias)     |                  |       (Port 8000)           |
           | - 16 PostgreSQL Tables      |<================>| - Google Gemini AI Engine   |
           | - Row Level Security (RLS)  |   Sync & Token   | - SSRF Filtered Web Scraper |
           | - Supabase Auth (OAuth/JWT) |   Verification   | - ReportLab PDF Generator   |
           | - Real-time Sessions        |                  | - SHA-256 Change Detector   |
           +-----------------------------+                  +-----------------------------+
```

---

## 🗄️ Database Structure (16 Tables)

1. `profiles`: Extended user accounts with avatar, timezone, and notification channels.
2. `research_projects`: Research initiatives, inquiries, summaries, and readiness scores.
3. `sources`: Ingested documents (URLs, PDFs, announcements), content hashes, and freshness statuses.
4. `claims`: Discrete extracted assertions with verbatim evidence quotes and confidence.
5. `information_gaps`: Unstated critical requirements with severity ratings.
6. `conflicts`: Contradictory statements between sources with resolution protocols.
7. `verification_tasks`: Prioritized checklist tasks linked to gaps and sources.
8. `tracked_opportunities`: Monitored vacancies, scholarships, and admissions with application lifecycle tracking.
9. `opportunity_dates`: Critical milestones (start date, deadline, admit card release, exam date, result).
10. `source_snapshots`: Content snapshots for historical auditing.
11. `source_changes`: Detected diffs, deadline extensions, and eligibility revisions.
12. `reminder_preferences`: User alert schedules (`[7, 3, 2, 1, 0]` days).
13. `notifications`: In-app and scheduled alert records.
14. `pdf_documents`: Living documents tied to research initiatives.
15. `pdf_versions`: Version history (v1.0, v2.0) with changelogs and snapshot metadata.
16. `notification_jobs`: Idempotent background reminder queue.

---

## ⚡ Quick Start & Installation

### 1. Configure Supabase Database
Your Supabase project is connected:
- **Project URL**: `https://cfdzutredjuweiszdias.supabase.co`
- **Publishable Key**: `sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp`

To execute the database schema:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/cfdzutredjuweiszdias](https://supabase.com/dashboard/project/cfdzutredjuweiszdias)
2. Go to **SQL Editor** -> **New query**.
3. Paste the contents of [`supabase/migrations/20261030000000_initial_schema.sql`](./supabase/migrations/20261030000000_initial_schema.sql).
4. Click **Run**. All 16 tables, triggers, and RLS policies are applied immediately.

---

### 2. Configure Google OAuth (Optional / Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create an **OAuth 2.0 Web Application** Client ID.
3. Under **Authorized redirect URIs**, enter:
   ```
   https://cfdzutredjuweiszdias.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID & Secret into your **Supabase Dashboard** under **Authentication** -> **Providers** -> **Google**.

---

### 3. Run the Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt python-multipart
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be active at: `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).

---

### 4. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`.

---

## 🧪 Running Tests
VERITYX includes automated unit and integration tests covering the API endpoints, SSRF guards, research generation, opportunity tracking, and PDF streaming:
```bash
python -m pytest
```
Output:
```
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\VERITYX
configfile: pytest.ini
testpaths: backend/tests
collected 5 items

backend\tests\test_verityx.py .....                                      [100%]
======================= 5 passed, 20 warnings in 52.51s =======================
```

---

## 🔒 Security Best Practices Implemented
- **SSRF Defense**: `is_safe_url()` blocks loopback, private IPv4/IPv6 subnets, and cloud metadata addresses (`169.254.169.254`).
- **Row Level Security**: Every table enforces user isolation (`auth.uid() = user_id`).
- **Protected Storage**: PDF binaries stream only through verified ownership endpoints.
- **Client Secret Isolation**: Only public client configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) is bundled on the frontend.

