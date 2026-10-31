import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
  MessageSquare,
  Award,
  ArrowRight
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { GeminiAssistantModal } from '../../components/assistant/GeminiAssistantModal';

export const ProgressTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Gemini Assistant
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantOppId, setAssistantOppId] = useState<string | undefined>(undefined);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/opportunities');
      setOpportunities(data || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleFollowUp = async (oppId: string, responseType: 'completed' | 'still_in_progress' | 'need_help') => {
    setActionLoading(oppId);
    try {
      const token = (user as any)?.token || (user as any)?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8000/api/v1/opportunities/${oppId}/followup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          opportunity_id: oppId,
          response_type: responseType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.guidance || 'Progress updated successfully!');
        await fetchOpportunities();
        if (responseType === 'need_help') {
          setAssistantOppId(oppId);
          setAssistantOpen(true);
        }
      }
    } catch (err) {
      console.error('Follow-up error:', err);
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionSuccess(null), 6000);
    }
  };

  const inProgressOpps = opportunities.filter(o => o.application_status === 'In Progress');
  const completedOpps = opportunities.filter(o => o.application_status === 'Completed' || o.application_status === 'Registered');
  const notStartedOpps = opportunities.filter(o => !o.application_status || o.application_status === 'Not Started');

  const filteredOpps = opportunities.filter(o => {
    if (activeStage === 'in_progress') return o.application_status === 'In Progress';
    if (activeStage === 'completed') return o.application_status === 'Completed' || o.application_status === 'Registered';
    if (activeStage === 'not_started') return !o.application_status || o.application_status === 'Not Started';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                Milestone & Follow-up Tracking
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Persistent 4-Day Interval Checks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-purple-400" />
              Progress & Follow-up Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Maintain steady momentum on your applications. When an opportunity is marked <strong>In Progress</strong>, VERITYX automatically tracks elapsed days and triggers gentle check-ins to assist you through form completion.
            </p>
          </div>
        </div>
      </div>

      {/* Global Success Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveStage('in_progress')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeStage === 'in_progress'
              ? 'bg-purple-950/40 border-purple-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{inProgressOpps.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active application efforts</span>
        </div>

        <div
          onClick={() => setActiveStage('completed')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeStage === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Completed & Applied</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{completedOpps.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Successfully submitted</span>
        </div>

        <div
          onClick={() => setActiveStage('not_started')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeStage === 'not_started'
              ? 'bg-blue-950/40 border-blue-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-300">Not Started</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{notStartedOpps.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting application kickoff</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveStage('all')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            activeStage === 'all'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Applications ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveStage('in_progress')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            activeStage === 'in_progress'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          In Progress ({inProgressOpps.length})
        </button>
        <button
          onClick={() => setActiveStage('completed')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            activeStage === 'completed'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Completed ({completedOpps.length})
        </button>
      </div>

      {/* Opportunity Progress Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Synchronizing progress records...</span>
        </div>
      ) : filteredOpps.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-white text-base">No Applications in this View</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Mark an opportunity as "In Progress" to unlock automated follow-ups and AI assistance.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpps.map(opp => {
            const isCompleted = opp.application_status === 'Completed' || opp.application_status === 'Registered';
            const isInProgress = opp.application_status === 'In Progress';
            const isActing = actionLoading === opp.id;

            return (
              <div
                key={opp.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                        {opp.opportunity_type || 'General'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isInProgress
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {opp.application_status || 'Not Started'}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-white">{opp.title}</h3>
                    <p className="text-xs text-slate-400">{opp.organization || 'Official Agency'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Deadline: {opp.deadline_ist || opp.application_deadline || 'Open'}
                    </span>
                    {opp.days_remaining !== null && (
                      <span className="text-xs font-bold text-cyan-400 mt-0.5 block">
                        {opp.days_remaining > 0 ? `${opp.days_remaining} Days Remaining` : 'Cutoff Elapsed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive 4-Day Follow-up Action Block for In Progress */}
                {isInProgress && (
                  <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">4-Day Milestone Check-in</span>
                      </div>
                      <span className="text-[10px] text-purple-300 font-mono">
                        {opp.follow_up_days_elapsed ? `${opp.follow_up_days_elapsed} Days Elapsed` : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      How is this application coming along? Choose an option to update your timeline:
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleFollowUp(opp.id, 'completed')}
                        disabled={isActing}
                        className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed / Applied</span>
                      </button>

                      <button
                        onClick={() => handleFollowUp(opp.id, 'still_in_progress')}
                        disabled={isActing}
                        className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Still In Progress (+3 Days)</span>
                      </button>

                      <button
                        onClick={() => handleFollowUp(opp.id, 'need_help')}
                        disabled={isActing}
                        className="px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Need Help (Gemini AI)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Celebration Banner */}
                {isCompleted && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Application Submitted! Pending reminders cancelled.
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Completed: {new Date(opp.updated_at || opp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gemini Assistant Modal */}
      <GeminiAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextOpportunityId={assistantOppId}
      />
    </div>
  );
};

