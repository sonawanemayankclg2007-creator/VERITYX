-- ========================================================================
-- VERITYX — Complete Database Schema & Migrations
-- Tables, RLS Policies, Indexes, and Automatic User Profile Triggers
-- ========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 2. RESEARCH PROJECTS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    research_question TEXT,
    research_goal TEXT,
    summary TEXT,
    readiness_score JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 3. SOURCES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT,
    title TEXT NOT NULL,
    source_type TEXT DEFAULT 'webpage',
    source_content TEXT,
    content_hash TEXT,
    publication_date DATE,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    freshness_status TEXT DEFAULT 'current',
    verification_status TEXT DEFAULT 'unverified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 4. CLAIMS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    claim_type TEXT DEFAULT 'factual',
    confidence FLOAT DEFAULT 0.85,
    evidence_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 5. INFORMATION GAPS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.information_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    importance TEXT DEFAULT 'high',
    confidence FLOAT DEFAULT 0.85,
    status TEXT DEFAULT 'open',
    recommended_action TEXT,
    related_source_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 6. CONFLICTS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    claim_a_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    claim_b_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.85,
    status TEXT DEFAULT 'unresolved',
    recommended_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 7. VERIFICATION TASKS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    information_gap_id UUID REFERENCES public.information_gaps(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 8. TRACKED OPPORTUNITIES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracked_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES public.research_projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    organization TEXT,
    opportunity_type TEXT DEFAULT 'other',
    official_url TEXT,
    application_start_date DATE,
    application_deadline DATE,
    application_status TEXT DEFAULT 'Not Started',
    monitoring_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 9. OPPORTUNITY DATES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunity_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.tracked_opportunities(id) ON DELETE CASCADE,
    date_type TEXT NOT NULL,
    date_value DATE NOT NULL,
    source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    verification_status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 10. SOURCE SNAPSHOTS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    content_snapshot TEXT,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 11. SOURCE CHANGES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.tracked_opportunities(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    change_summary TEXT NOT NULL,
    verification_status TEXT DEFAULT 'Potential Change — Verification Required',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 12. REMINDER PREFERENCES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.tracked_opportunities(id) ON DELETE CASCADE,
    reminder_intervals INTEGER[] DEFAULT '{7, 3, 2, 1, 0}',
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, opportunity_id)
);

-- ------------------------------------------------------------------------
-- 13. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.tracked_opportunities(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 14. PDF DOCUMENTS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES public.research_projects(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.tracked_opportunities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    current_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 15. PDF VERSIONS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_document_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    source_snapshot JSONB,
    research_snapshot JSONB,
    change_summary TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pdf_document_id, version_number)
);

-- ------------------------------------------------------------------------
-- 16. NOTIFICATION JOBS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.tracked_opportunities(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_research_projects_user_id ON public.research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_research_project_id ON public.sources(research_project_id);
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_project_source ON public.claims(research_project_id, source_id);
CREATE INDEX IF NOT EXISTS idx_information_gaps_project ON public.information_gaps(research_project_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_project ON public.conflicts(research_project_id);
CREATE INDEX IF NOT EXISTS idx_verification_tasks_project ON public.verification_tasks(research_project_id);
CREATE INDEX IF NOT EXISTS idx_tracked_opportunities_user_id ON public.tracked_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_dates_opp_id ON public.opportunity_dates(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_source_snapshots_source_id ON public.source_snapshots(source_id);
CREATE INDEX IF NOT EXISTS idx_source_changes_opp_source ON public.source_changes(opportunity_id, source_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pdf_docs_user_id ON public.pdf_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_versions_doc_id ON public.pdf_versions(pdf_document_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_sched ON public.notification_jobs(status, scheduled_at);

-- ========================================================================
-- AUTOMATIC TIMESTAMPS TRIGGERS
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_research_projects_updated_at ON public.research_projects;
CREATE TRIGGER trg_research_projects_updated_at
BEFORE UPDATE ON public.research_projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_information_gaps_updated_at ON public.information_gaps;
CREATE TRIGGER trg_information_gaps_updated_at
BEFORE UPDATE ON public.information_gaps
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_verification_tasks_updated_at ON public.verification_tasks;
CREATE TRIGGER trg_verification_tasks_updated_at
BEFORE UPDATE ON public.verification_tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tracked_opportunities_updated_at ON public.tracked_opportunities;
CREATE TRIGGER trg_tracked_opportunities_updated_at
BEFORE UPDATE ON public.tracked_opportunities
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_pdf_documents_updated_at ON public.pdf_documents;
CREATE TRIGGER trg_pdf_documents_updated_at
BEFORE UPDATE ON public.pdf_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================================================
-- AUTOMATIC USER PROFILE CREATION FROM AUTH.USERS
-- (Works for both Email/Password and Google OAuth signups)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_full_name TEXT;
    extracted_avatar TEXT;
    extracted_username TEXT;
BEGIN
    -- Extract full name from raw_user_meta_data if available
    extracted_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Extract avatar URL if provided by Google OAuth
    extracted_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );

    -- Generate a default unique username
    extracted_username := COALESCE(
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'preferred_username',
        split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
    );

    INSERT INTO public.profiles (id, email, full_name, username, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        extracted_full_name,
        extracted_username,
        extracted_avatar
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.information_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Research Projects
CREATE POLICY "Users manage own research projects"
    ON public.research_projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Sources
CREATE POLICY "Users manage own sources"
    ON public.sources FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Claims
CREATE POLICY "Users manage claims via project"
    ON public.claims FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = claims.research_project_id AND rp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = claims.research_project_id AND rp.user_id = auth.uid()
        )
    );

-- 5. Information Gaps
CREATE POLICY "Users manage gaps via project"
    ON public.information_gaps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = information_gaps.research_project_id AND rp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = information_gaps.research_project_id AND rp.user_id = auth.uid()
        )
    );

-- 6. Conflicts
CREATE POLICY "Users manage conflicts via project"
    ON public.conflicts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = conflicts.research_project_id AND rp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = conflicts.research_project_id AND rp.user_id = auth.uid()
        )
    );

-- 7. Verification Tasks
CREATE POLICY "Users manage tasks via project"
    ON public.verification_tasks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = verification_tasks.research_project_id AND rp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.research_projects rp
            WHERE rp.id = verification_tasks.research_project_id AND rp.user_id = auth.uid()
        )
    );

-- 8. Tracked Opportunities
CREATE POLICY "Users manage own tracked opportunities"
    ON public.tracked_opportunities FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Opportunity Dates
CREATE POLICY "Users manage dates via opportunity"
    ON public.opportunity_dates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tracked_opportunities opp
            WHERE opp.id = opportunity_dates.opportunity_id AND opp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tracked_opportunities opp
            WHERE opp.id = opportunity_dates.opportunity_id AND opp.user_id = auth.uid()
        )
    );

-- 10. Source Snapshots
CREATE POLICY "Users manage snapshots via source"
    ON public.source_snapshots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sources s
            WHERE s.id = source_snapshots.source_id AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sources s
            WHERE s.id = source_snapshots.source_id AND s.user_id = auth.uid()
        )
    );

-- 11. Source Changes
CREATE POLICY "Users manage changes via opportunity"
    ON public.source_changes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tracked_opportunities opp
            WHERE opp.id = source_changes.opportunity_id AND opp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tracked_opportunities opp
            WHERE opp.id = source_changes.opportunity_id AND opp.user_id = auth.uid()
        )
    );

-- 12. Reminder Preferences
CREATE POLICY "Users manage own reminder preferences"
    ON public.reminder_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 13. Notifications
CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 14. PDF Documents
CREATE POLICY "Users manage own pdf documents"
    ON public.pdf_documents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 15. PDF Versions
CREATE POLICY "Users manage pdf versions via document"
    ON public.pdf_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pdf_documents pdf
            WHERE pdf.id = pdf_versions.pdf_document_id AND pdf.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pdf_documents pdf
            WHERE pdf.id = pdf_versions.pdf_document_id AND pdf.user_id = auth.uid()
        )
    );

-- 16. Notification Jobs
CREATE POLICY "Users manage own notification jobs"
    ON public.notification_jobs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================================================
-- STORAGE BUCKET INITIALIZATION (for PDF reports)
-- ========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('verityx_pdfs', 'verityx_pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verityx_pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view and download their own pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verityx_pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

