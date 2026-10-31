import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { api } from '../../lib/api';

export const OpportunityHealthPage: React.FC = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/opportunities');
      setOpportunities(data || []);
    } catch (err) {
      console.error('Failed to load opportunities for health analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const onTrackCount = opportunities.filter(o => (o.health_status || 'On Track') === 'On Track').length;
  const atRiskCount = opportunities.filter(o => o.health_status === 'At Risk').length;
  const overdueCount = opportunities.filter(o => o.health_status === 'Overdue' || (o.days_remaining !== null && o.days_remaining < 0)).length;
  const completedCount = opportunities.filter(o => o.application_status === 'Completed' || o.application_status === 'Registered').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                Health Radar • Risk & Readiness Analysis
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Real-Time Cutoff Verification
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="w-7 h-7 text-emerald-400" />
              Opportunity Health Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Monitors the risk velocity of all active applications. Calculates deadlines, missing certificate roadblocks, and time remaining to recommend precise next actions.
            </p>
          </div>
        </div>
      </div>

      {/* Health Overview Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> On Track
            </span>
            <span className="text-[10px] font-mono text-slate-500">&gt; 3 Days Left</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">{onTrackCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Timelines well within bounds</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> At Risk
            </span>
            <span className="text-[10px] font-mono text-amber-500 animate-pulse">Urgent</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">{atRiskCount}</p>
          <span className="text-[11px] text-amber-300/80 mt-1 block">Cutoff in ≤ 3 days</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Overdue
            </span>
            <span className="text-[10px] font-mono text-rose-500">Expired</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">{overdueCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Closing window passed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Completed
            </span>
            <span className="text-[10px] font-mono text-blue-500">Archived</span>
          </div>
          <p className="text-3xl font-black text-white mt-2">{completedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Submitted applications</span>
        </div>
      </div>

      {/* Detailed Health Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Computing opportunity health diagnostics...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-white text-base">No Tracked Opportunities for Diagnostics</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Track opportunities in Smart Deadline Guardian to monitor their real-time health metrics.
          </p>
          <button
            onClick={() => navigate('/deadline-guardian')}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
          >
            Go to Deadline Guardian
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Health Radar & Actionable Next Steps</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map(opp => {
              const days = opp.days_remaining;
              const isOverdue = opp.is_overdue || (days !== null && days < 0);
              const isAtRisk = days !== null && days <= 3 && !isOverdue;
              const isCompleted = opp.application_status === 'Completed' || opp.application_status === 'Registered';
              const health = isCompleted ? 'Completed' : isOverdue ? 'Overdue' : isAtRisk ? 'At Risk' : 'On Track';

              // Meaningful next action based on health
              let nextAction = 'Continue preparation and review application forms.';
              if (health === 'At Risk') {
                nextAction = 'Submit application within 24 hours to avoid portal downtime or gateway failures.';
              } else if (health === 'Overdue') {
                nextAction = 'Application period has closed. Check official portal for answer key / results schedule.';
              } else if (health === 'Completed') {
                nextAction = 'Application submitted. Keep downloaded PDF receipt and fee acknowledgement safe.';
              } else if (opp.application_status === 'Not Started') {
                nextAction = 'Run Dynamic Eligibility check to verify required certificates before registering.';
              }

              return (
                <div
                  key={opp.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                          {opp.opportunity_type || 'General'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
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
                      <h4 className="font-bold text-base text-white">{opp.title}</h4>
                      <p className="text-xs text-slate-400">{opp.organization || 'Official Agency'}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {opp.deadline_ist || opp.application_deadline || 'No Deadline'}
                      </span>
                      {days !== null && (
                        <span
                          className={`text-xs font-mono font-bold mt-1 block ${
                            isOverdue
                              ? 'text-rose-400'
                              : isAtRisk
                              ? 'text-amber-400 animate-pulse'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isOverdue ? 'Cutoff Elapsed' : days === 0 ? 'Closing Today' : `${days} Days Left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic Action Box */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                      Recommended Next Action
                    </span>
                    <p className="text-slate-200 leading-relaxed">{nextAction}</p>
                  </div>

                  {/* Footer Action Links */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => navigate('/eligibility-analyzer')}
                      className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Check Eligibility
                    </button>
                    <button
                      onClick={() => navigate('/progress-tracking')}
                      className="text-slate-400 hover:text-white font-medium flex items-center gap-1"
                    >
                      <span>Update Status</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

