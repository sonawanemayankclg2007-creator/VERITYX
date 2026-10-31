# VERITYX — Database Schema & Data Dictionary

The persistent database runs on **Supabase PostgreSQL** (`cfdzutredjuweiszdias`). All tables are guarded by Row Level Security (RLS) ensuring that users only access their own research records and tracked opportunities.

## Table Catalog

### 1. `profiles`
Stores extended user profile metadata automatically populated on signup via an `AFTER INSERT ON auth.users` trigger.
- `id` (UUID, PK, FK -> auth.users)
- `email` (TEXT)
- `full_name` (TEXT)
- `username` (TEXT, UNIQUE)
- `avatar_url` (TEXT)
- `timezone` (TEXT)
- `notification_preferences` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `research_projects`
Primary initiative container for multi-source inquiries.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> auth.users)
- `title` (TEXT)
- `research_question` (TEXT)
- `research_goal` (TEXT)
- `summary` (TEXT)
- `readiness_score` (JSONB)
- `status` (TEXT: draft, analyzing, completed, archived)

### 3. `sources`
Ingested primary and secondary documents.
- `id` (UUID, PK)
- `research_project_id` (UUID, FK -> research_projects)
- `user_id` (UUID, FK -> auth.users)
- `url` (TEXT)
- `title` (TEXT)
- `source_type` (TEXT: webpage, pdf, announcement, document)
- `source_content` (TEXT)
- `content_hash` (TEXT)
- `publication_date` (DATE)
- `freshness_status` (TEXT: current, potentially_outdated, outdated, unknown)
- `verification_status` (TEXT: unverified, verified_official, verified_secondary, disputed)

### 4. `claims`
Discrete factual claims extracted from sources with verbatim evidence.
- `id` (UUID, PK)
- `research_project_id` (UUID, FK -> research_projects)
- `source_id` (UUID, FK -> sources)
- `claim_text` (TEXT)
- `claim_type` (TEXT: factual, requirement, deadline, eligibility, fee, policy)
- `confidence` (FLOAT)
- `evidence_text` (TEXT)

### 5. `information_gaps`
The core Digital Dark Spot record: unstated or missing critical requirements.
- `id` (UUID, PK)
- `research_project_id` (UUID, FK -> research_projects)
- `title` (TEXT)
- `description` (TEXT)
- `importance` (TEXT: critical, high, medium, low)
- `confidence` (FLOAT)
- `status` (TEXT: open, verifying, resolved, dismissed)
- `recommended_action` (TEXT)
- `related_source_ids` (UUID[])

### 6. `conflicts`
Contradictory assertions identified between two sources.
- `id` (UUID, PK)
- `research_project_id` (UUID, FK -> research_projects)
- `claim_a_id`, `claim_b_id` (UUID, FK -> claims)
- `description` (TEXT)
- `confidence` (FLOAT)
- `status` (TEXT: unresolved, resolved, disputed, false_positive)
- `recommended_action` (TEXT)

### 7. `verification_tasks`
Prioritized action items generated to resolve gaps and conflicts before making binding decisions.
- `id` (UUID, PK)
- `research_project_id` (UUID, FK -> research_projects)
- `information_gap_id` (UUID, FK -> information_gaps)
- `title` (TEXT)
- `description` (TEXT)
- `priority` (TEXT: critical, high, medium, low)
- `status` (TEXT: pending, in_progress, completed, deferred)
- `due_date` (DATE)

### 8. `tracked_opportunities`
User-monitored jobs, railway vacancies, scholarships, and exams.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> auth.users)
- `research_project_id` (UUID, FK -> research_projects)
- `title` (TEXT)
- `organization` (TEXT)
- `opportunity_type` (TEXT: railway, govt, scholarship, admission, exam, internship, other)
- `official_url` (TEXT)
- `application_start_date` (DATE)
- `application_deadline` (DATE)
- `application_status` (TEXT: Not Started, In Progress, Registered, Completed, Not Interested)
- `monitoring_enabled` (BOOLEAN)

### 9. `opportunity_dates`
Key milestones for an opportunity (e.g. Admit Card, Exam Date, Cutoff).

### 10. `source_snapshots` & 11. `source_changes`
Snapshots and audit diffs used by the Change Detection Engine.

### 12. `reminder_preferences` & 13. `notifications`
User alert preferences and in-app/email alerts.

### 14. `pdf_documents` & 15. `pdf_versions`
Living PDF records with incremental version history (v1.0, v2.0) and changelogs.

### 16. `notification_jobs`
Idempotent scheduled background queue for Smart Deadline Guardian.

