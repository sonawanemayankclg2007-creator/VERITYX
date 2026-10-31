-- ========================================================================
-- VERITYX — Benchmark & Development Seed Data
-- Clearly labeled as sample/benchmark research projects for demonstration
-- ========================================================================

-- Note: Because research_projects references auth.users(id), in actual usage,
-- records are created under the signed-in user's UID.
-- This seed file can be executed in the Supabase SQL editor when a test user exists,
-- or through our backend initialization test harness.

DO $$
DECLARE
    test_user_id UUID;
    sample_proj_id UUID := gen_random_uuid();
    source_official UUID := gen_random_uuid();
    source_blog UUID := gen_random_uuid();
    claim_1 UUID := gen_random_uuid();
    claim_2 UUID := gen_random_uuid();
    gap_1 UUID := gen_random_uuid();
    opp_1 UUID := gen_random_uuid();
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Insert Sample Research Project
        INSERT INTO public.research_projects (
            id, user_id, title, research_question, research_goal, summary, readiness_score, status
        ) VALUES (
            sample_proj_id,
            test_user_id,
            'Central Railway Apprentice Recruitment 2026 Verification',
            'What are the official eligibility criteria, stipend, and cutoff dates for 10th+ITI applicants?',
            'Verify inconsistent information across portal announcements vs social media coaching blogs.',
            'Analysis identified a critical discrepancy regarding age relaxation cutoff dates and certificate verification timeline.',
            '{"score": 68, "explanation": "Key eligibility criteria verified against official gazette, but certificate verification venue and exact cutoff date conflict between sources.", "coverage_score": 75, "evidence_quality_score": 80, "unresolved_conflicts": 1, "freshness_score": 60, "critical_missing_information": "Official clarification on NCVT certificate submission deadline."}'::jsonb,
            'completed'
        ) ON CONFLICT DO NOTHING;

        -- Sources
        INSERT INTO public.sources (
            id, research_project_id, user_id, url, title, source_type, publication_date, freshness_status, verification_status
        ) VALUES 
        (
            source_official, sample_proj_id, test_user_id,
            'https://rrccr.com/announcements/apprentice-2026.pdf',
            'Railway Recruitment Cell (Central Railway) Official Notification',
            'pdf',
            '2026-09-15',
            'current',
            'verified_official'
        ),
        (
            source_blog, sample_proj_id, test_user_id,
            'https://examupdates-portal.in/railway-apprentice-dates',
            'ExamUpdates Education Blog — Railway Apprentice Guidelines',
            'webpage',
            '2025-11-20',
            'potentially_outdated',
            'unverified'
        ) ON CONFLICT DO NOTHING;

        -- Claims
        INSERT INTO public.claims (
            id, research_project_id, source_id, claim_text, claim_type, confidence, evidence_text
        ) VALUES
        (
            claim_1, sample_proj_id, source_official,
            'Candidate must have completed 15 years and not exceeded 24 years as on 15/10/2026.',
            'eligibility',
            0.98,
            'Section 3.1: Age Criteria: Minimum age 15 years completed, maximum 24 years as on the notification closing date 15-10-2026.'
        ),
        (
            claim_2, sample_proj_id, source_blog,
            'Maximum age limit is 26 years for general candidates as per revised 2025 order.',
            'eligibility',
            0.45,
            'The coaching portal claims general candidates enjoy a 2-year general relaxation for all apprentice batches.'
        ) ON CONFLICT DO NOTHING;

        -- Conflict
        INSERT INTO public.conflicts (
            research_project_id, claim_a_id, claim_b_id, description, confidence, status, recommended_action
        ) VALUES (
            sample_proj_id, claim_1, claim_2,
            'Conflict on Maximum Age Limit: Official notification states 24 years cutoff; secondary coaching portal claims 26 years.',
            0.94,
            'unresolved',
            'Rely strictly on Official RRC Gazette notification (24 years). Do not pay application fees if exceeding 24 unless SC/ST/OBC category relaxation applies.'
        ) ON CONFLICT DO NOTHING;

        -- Information Gap
        INSERT INTO public.information_gaps (
            id, research_project_id, title, description, importance, confidence, status, recommended_action
        ) VALUES (
            gap_1, sample_proj_id,
            'Missing Medical Fitness Certificate Format for PwBD Applicants',
            'Neither source specifies whether the central civil surgeon format or state district hospital format is mandatory.',
            'critical',
            0.90,
            'open',
            'Contact RRC Mumbai helpdesk or review Annexure IV of the main notification before physical document verification.'
        ) ON CONFLICT DO NOTHING;

        -- Verification Task
        INSERT INTO public.verification_tasks (
            research_project_id, information_gap_id, title, description, priority, status, due_date
        ) VALUES (
            sample_proj_id, gap_1,
            'Verify Annexure IV Medical Format with RRC Helpdesk',
            'Call the official RRC Central Railway enquiry counter to confirm accepted disability certificate issuance authority.',
            'critical',
            'pending',
            '2026-11-05'
        ) ON CONFLICT DO NOTHING;

        -- Tracked Opportunity
        INSERT INTO public.tracked_opportunities (
            id, user_id, research_project_id, title, organization, opportunity_type, official_url,
            application_start_date, application_deadline, application_status, monitoring_enabled
        ) VALUES (
            opp_1, test_user_id, sample_proj_id,
            'Central Railway Apprentice Engagement 2026',
            'Railway Recruitment Cell, Central Railway (CR)',
            'railway',
            'https://rrccr.com',
            '2026-09-20',
            '2026-11-15',
            'In Progress',
            true
        ) ON CONFLICT DO NOTHING;

        -- Opportunity Dates
        INSERT INTO public.opportunity_dates (
            opportunity_id, date_type, date_value, verification_status
        ) VALUES 
        (opp_1, 'start_date', '2026-09-20', 'verified'),
        (opp_1, 'deadline', '2026-11-15', 'verified'),
        (opp_1, 'document_verification', '2026-12-10', 'tentative')
        ON CONFLICT DO NOTHING;

        -- Reminder Preferences
        INSERT INTO public.reminder_preferences (
            user_id, opportunity_id, reminder_intervals, email_enabled, push_enabled, in_app_enabled
        ) VALUES (
            test_user_id, opp_1, '{7, 3, 2, 1, 0}', true, true, true
        ) ON CONFLICT DO NOTHING;

        -- Sample Notification
        INSERT INTO public.notifications (
            user_id, opportunity_id, notification_type, title, message
        ) VALUES (
            test_user_id, opp_1, 'deadline_reminder',
            'Deadline Reminder: Central Railway Apprentice 2026',
            'Your application is currently marked In Progress. The application closes in 16 days on 2026-11-15.'
        ) ON CONFLICT DO NOTHING;

    END IF;
END $$;

