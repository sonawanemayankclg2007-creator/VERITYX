import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public & Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { AuthCallback } from './pages/auth/AuthCallback';

// Dedicated Platform Pages in EXACT MANDATED ORDER:
// 1. Smart Deadline Guardian (Priority 1)
// 2. AI Eligibility & Readiness Analyzer (Priority 2)
// 3. Discover Opportunities
// 4. AI Research & Assessment
// 5. Progress & Follow-up Tracking
// 6. Opportunity Health Status
// 7. Notifications Center
// 8. My Profile
// 9. Settings
import { Dashboard } from './pages/Dashboard';
import { DeadlineGuardianPage } from './pages/guardian/DeadlineGuardianPage';
import { EligibilityAnalyzerPage } from './pages/eligibility/EligibilityAnalyzerPage';
import { DiscoverOpportunitiesPage } from './pages/opportunities/DiscoverOpportunitiesPage';
import { ResearchList } from './pages/research/ResearchList';
import { NewResearch } from './pages/research/NewResearch';
import { ResearchDetail } from './pages/research/ResearchDetail';
import { ProgressTrackingPage } from './pages/progress/ProgressTrackingPage';
import { OpportunityHealthPage } from './pages/health/OpportunityHealthPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfileSettings } from './pages/profile/ProfileSettings';
import { SettingsPage } from './pages/settings/SettingsPage';
import { SourceMonitoring } from './pages/monitoring/SourceMonitoring';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Application Routes wrapped in SaaS AppLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                {/* Default Landing */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* 1. Smart Deadline Guardian (Priority 1) */}
                <Route path="/deadline-guardian" element={<DeadlineGuardianPage />} />

                {/* 2. AI Eligibility & Readiness Analyzer (Priority 2) */}
                <Route path="/eligibility-analyzer" element={<EligibilityAnalyzerPage />} />

                {/* 3. Discover Opportunities */}
                <Route path="/discover" element={<DiscoverOpportunitiesPage />} />

                {/* 4. AI Research & Assessment */}
                <Route path="/research" element={<ResearchList />} />
                <Route path="/research/new" element={<NewResearch />} />
                <Route path="/research/:id" element={<ResearchDetail />} />

                {/* 5. Progress & Follow-up Tracking */}
                <Route path="/progress-tracking" element={<ProgressTrackingPage />} />

                {/* 6. Opportunity Health Status */}
                <Route path="/health-status" element={<OpportunityHealthPage />} />

                {/* 7. Notifications Center */}
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* 8. My Profile */}
                <Route path="/profile" element={<ProfileSettings />} />

                {/* 9. Settings */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* Backward Compatibility Aliases */}
                <Route path="/opportunities" element={<Navigate to="/deadline-guardian" replace />} />
                <Route path="/monitoring" element={<SourceMonitoring />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
