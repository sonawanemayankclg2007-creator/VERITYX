import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  ClipboardCheck,
  CalendarClock,
  TrendingUp,
  Brain,
  Activity,
  Bell,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Award,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = profile?.user_category || 'Student';

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [oppRes, notifRes, repRes]: [any, any, any] = await Promise.all([
        api.get('/opportunities').catch(() => []),
        api.get('/notifications').catch(() => ({ notifications: [], unread_count: 0 })),
        api.get('/eligibility/reports').catch(() => [])
      ]);

      setOpportunities(oppRes || []);
      setNotifications(notifRes.notifications || []);
      setReports(repRes || []);

      // Load personalized recommendations
      const recRes = await fetch(`http://localhost:8000/api/v1/eligibility/recommendations?category=${currentCategory}`);
      if (recRes.ok) {
        const data = await recRes.json();
        setRecommendations(data.recommendations?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentCategory]);

  const urgentDeadlines = opportunities.filter(
    o => o.days_remaining !== null && o.days_remaining <= 5 && !o.is_overdue
  );
  const inProgressCount = opportunities.filter(o => o.application_status === 'In Progress').length;
  const completedCount = opportunities.filter(
    o => o.application_status === 'Completed' || o.application_status === 'Registered'
  ).length;

  // Active follow-up check
  const followUpDueOpp = opportunities.find(
    o => o.application_status === 'In Progress' && o.follow_up_due
  );

  // Urgent notification for banner
  const urgentNotification = notifications.find(
    n => !n.read_at && (n.priority === 'critical' || n.priority === 'high')
  );

  // Calculate average readiness score if reports exist
  const avgReadiness = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.readiness_score || 0), 0) / reports.length)
    : 85;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Welcome Message & Quick Navigation Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                VERITYX AI Platform
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-200 border border-slate-700">
                {currentCategory} Focus
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Your personalized opportunity command center. Discover verified announcements, evaluate eligibility criteria, and safeguard critical application deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/discover"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Discover Opportunities</span>
            </Link>
            <Link
              to="/eligibility-analyzer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-2 transition"
            >
              <ClipboardCheck className="w-4 h-4 text-purple-400" />
              <span>Check Eligibility</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Important Notifications & Follow-up Alert Banner */}
      {followUpDueOpp ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-700/50">
                  Application Follow-up Due
                </span>
                <span className="text-xs text-slate-400">Application In Progress</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                "{followUpDueOpp.title}" has been in progress for 4+ days.
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Update your application progress or request personalized guidance from Gemini AI.
              </p>
            </div>
          </div>

          <Link
            to="/progress-tracking"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-center shadow transition"
          >
            <span>Update Progress</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : urgentNotification ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{urgentNotification.title}</h4>
              <p className="text-[11px] text-slate-300">{urgentNotification.message}</p>
            </div>
          </div>
          <Link
            to="/notifications"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
          >
            <span>View Alert</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : null}

      {/* 3. Core Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Saved Opportunities */}
        <Link
          to="/discover"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition">
              Saved Opportunities
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{opportunities.length}</p>
          <span className="text-[11px] text-purple-300 mt-1 block">
            {opportunities.length === 1 ? '1 active opportunity' : `${opportunities.length} active opportunities`}
          </span>
        </Link>

        {/* Metric 2: Upcoming Deadlines */}
        <Link
          to="/deadline-guardian"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 transition">
              Upcoming Deadlines
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{urgentDeadlines.length}</p>
          <span className="text-[11px] text-cyan-400 mt-1 block">
            Closing within 5 days
          </span>
        </Link>

        {/* Metric 3: Eligibility & Readiness Score */}
        <Link
          to="/eligibility-analyzer"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition">
              Readiness Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{avgReadiness}%</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {reports.length > 0 ? `${reports.length} assessments completed` : 'Assessment Ready'}
          </span>
        </Link>

        {/* Metric 4: Application Progress */}
        <Link
          to="/progress-tracking"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-300 transition">
              Application Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{inProgressCount}</p>
          <span className="text-[11px] text-indigo-300 mt-1 block">
            {completedCount} submitted & verified
          </span>
        </Link>
      </div>

      {/* 4. Two-Column Content: Upcoming Deadlines & Personalized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upcoming Deadlines & Recent Activities (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Upcoming Application Deadlines</h2>
              </div>
              <Link
                to="/deadline-guardian"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All Deadlines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                Loading deadlines...
              </div>
            ) : opportunities.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs text-slate-400">No opportunities tracked yet.</p>
                <Link
                  to="/discover"
                  className="inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                >
                  Discover Opportunities
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.slice(0, 4).map(opp => {
                  const days = opp.days_remaining;
                  const isOverdue = opp.is_overdue || (days !== null && days < 0);
                  const isUrgent = days !== null && days <= 3 && !isOverdue;
                  const health = opp.health_status || (isOverdue ? 'Overdue' : isUrgent ? 'At Risk' : 'On Track');

                  return (
                    <div
                      key={opp.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                            {opp.opportunity_type || 'General'}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                              health === 'On Track'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : health === 'At Risk'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : health === 'Overdue'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            ● {health}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                          {opp.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          Cutoff: {opp.deadline_ist || opp.application_deadline || 'No Deadline'}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {days !== null && (
                          <span
                            className={`text-xs font-mono font-bold block ${
                              isOverdue
                                ? 'text-rose-400'
                                : isUrgent
                                ? 'text-amber-400 animate-pulse'
                                : 'text-cyan-400'
                            }`}
                          >
                            {isOverdue ? 'Cutoff Elapsed' : days === 0 ? 'Today' : `${days}d Left`}
                          </span>
                        )}
                        <Link
                          to="/deadline-guardian"
                          className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold mt-1 inline-block"
                        >
                          Manage →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white">Recent Activities</h2>
              </div>
              <Link
                to="/progress-tracking"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Track Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              {opportunities.length === 0 && reports.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity recorded.</p>
              ) : (
                <>
                  {reports.slice(0, 2).map(rep => (
                    <div key={rep.id} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-none">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Eligibility Assessed: {rep.opportunity_title}</p>
                          <span className="text-[10px] text-slate-400">Score: {rep.readiness_score}/100 • Status: {rep.overall_status}</span>
                        </div>
                      </div>
                      <Link to="/eligibility-analyzer" className="text-[10px] text-purple-400 hover:text-purple-300 font-medium">View Report</Link>
                    </div>
                  ))}

                  {opportunities.slice(0, 2).map(opp => (
                    <div key={opp.id} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-none">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                          <CalendarClock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Tracked: {opp.title}</p>
                          <span className="text-[10px] text-slate-400">Status: {opp.application_status || 'Not Started'}</span>
                        </div>
                      </div>
                      <Link to="/deadline-guardian" className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium">Manage</Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Personalized AI Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Recommended for {currentCategory}s</h2>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Discover More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                Finding opportunities for {currentCategory}s...
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition space-y-2 group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      {rec.category}
                    </span>
                    {rec.application_deadline && (
                      <span className="text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rec.application_deadline}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {rec.fit_reason}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <Link
                      to="/eligibility-analyzer"
                      className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" /> Check Eligibility
                    </Link>
                    <Link
                      to="/deadline-guardian"
                      className="text-slate-400 hover:text-white font-medium flex items-center gap-1"
                    >
                      <span>Track Deadline</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
