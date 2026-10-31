import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  FileText,
  Bookmark,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { DynamicEligibilityAnalyzer } from '../../components/eligibility/DynamicEligibilityAnalyzer';
import { useAuth } from '../../contexts/AuthContext';

export const EligibilityAnalyzerPage: React.FC = () => {
  const { user } = useAuth();
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history'>('analyzer');

  const fetchSavedReports = async () => {
    setLoadingReports(true);
    try {
      const token = (user as any)?.token || (user as any)?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8000/api/v1/eligibility/reports', { headers });
      if (res.ok) {
        const data = await res.json();
        setSavedReports(data || []);
      }
    } catch (err) {
      console.warn('Failed to load assessment history:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchSavedReports();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                Signature Feature • Priority 2
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Deterministic Rule Compliance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-purple-400" />
              Dynamic AI Eligibility & Readiness Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Verify your official eligibility before paying application fees. Generates dynamic criteria forms tailored specifically for Railway, Defence, Scholarships, and Tech Jobs with explainable Selection Readiness Scoring (0-100).
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'analyzer'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyzer Form</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchSavedReports();
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Reports ({savedReports.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'analyzer' ? (
        <DynamicEligibilityAnalyzer onOpportunityTracked={fetchSavedReports} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Your Previous Eligibility & Readiness Assessments</span>
            </h3>
            <button
              onClick={fetchSavedReports}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh History
            </button>
          </div>

          {loadingReports ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              Loading saved evaluation dossiers...
            </div>
          ) : savedReports.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">No Saved Reports Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Run an evaluation using the analyzer form to generate and save your official eligibility determination.
              </p>
              <button
                onClick={() => setActiveTab('analyzer')}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
              >
                Go to Analyzer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedReports.map(rep => {
                const isEligible = rep.overall_status === 'Eligible';
                const isConditional = rep.overall_status === 'Conditionally Eligible';

                return (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition space-y-4 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                          {rep.category}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1">{rep.opportunity_title}</h4>
                        <span className="text-[11px] text-slate-400">
                          Assessed: {new Date(rep.assessed_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            isEligible
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isConditional
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {rep.overall_status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300 mt-1">
                          Score: {rep.readiness_score}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      {rep.readiness_explanation}
                    </p>

                    {rep.recommendations && rep.recommendations.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-purple-300 block mb-1">Key Action:</span>
                        <p className="truncate">• {rep.recommendations[0]}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

