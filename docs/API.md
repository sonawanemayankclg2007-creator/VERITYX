# VERITYX — REST API Specification

Base Endpoint: `/api/v1`

## Authentication
Requests should supply the Supabase Auth session token via standard HTTP Bearer header:
```http
Authorization: Bearer <supabase_access_token>
```

---

## 1. Research & Gap Detection
- `POST /api/v1/research`
  - Ingests multiple sources (URLs or raw text)
  - Executes AI gap detection & conflict radar
  - Returns created project, extracted claims, gaps, conflicts, and verification checklist
- `GET /api/v1/research`
  - Lists all research projects owned by the user with aggregate counts
- `GET /api/v1/research/{research_id}`
  - Returns complete dossier with sources, claims, gaps, conflicts, and tasks
- `DELETE /api/v1/research/{research_id}`
  - Deletes research project
- `POST /api/v1/research/{research_id}/reanalyze`
  - Re-evaluates claims and gaps against updated sources

---

## 2. Sources
- `POST /api/v1/sources`
  - Ingests a new source for an existing project
- `POST /api/v1/sources/upload`
  - Uploads a document file or circular text
- `POST /api/v1/sources/{source_id}/refresh`
  - Re-fetches web source and checks for changes

---

## 3. Opportunities & Deadlines
- `POST /api/v1/opportunities/track`
  - Tracks a new opportunity and registers default reminder intervals `[7, 3, 2, 1, 0]`
- `GET /api/v1/opportunities`
  - Returns user's opportunities with calculated days remaining
- `PATCH /api/v1/opportunities/{opportunity_id}/status`
  - Updates status: `Not Started` | `In Progress` | `Registered` | `Completed` | `Not Interested`
- `DELETE /api/v1/opportunities/{opportunity_id}`

---

## 4. Living PDF Intelligence
- `POST /api/v1/pdf/generate`
  - Generates initial ReportLab PDF (Version 1.0)
- `GET /api/v1/pdf`
  - Lists PDF documents
- `GET /api/v1/pdf/{pdf_id}/versions`
  - Retrieves version history and changelogs
- `POST /api/v1/pdf/{pdf_id}/regenerate`
  - Increments version number (v2.0, v3.0) with custom changelog
- `GET /api/v1/pdf/{pdf_id}/download`
  - Streams binary application/pdf file with optional `?version=X` parameter

---

## 5. Monitoring & Change Detection
- `POST /api/v1/monitoring/check`
  - Executes live diff against tracked sources
- `GET /api/v1/monitoring/changes`
  - Lists detected changes marked as `Potential Change — Verification Required`
- `POST /api/v1/monitoring/verify`
  - Marks change as `Verified Change` or `Disputed`

