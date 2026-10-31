import React, { useState, useEffect } from 'react';
import {
  Bell,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
  GitCommit,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';

export const SourceMonitoring: React.FC = () => {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const fetchChanges = async () => {
    try {
      const data: any = await api.get('/monitoring/changes');
      setChanges(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const handleRunCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res: any = await api.post('/monitoring/check', {});
      setCheckResult(`Checked ${res.sources_checked_count} source(s). Found ${res.changes_detected_count} new potential update(s).`);
      fetchChanges();
    } catch (err: any) {
      setCheckResult(`Check notice: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyChange = async (changeId: string, newStatus: string) => {
    try {
      await api.post(`/monitoring/verify?change_id=${changeId}&status=${encodeURIComponent(newStatus)}`);
      setChanges(changes.map((c) => (c.id === changeId ? { ...c, verification_status: newStatus } : c)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Official Source Change Engine</h1>
          <p className="text-sm text-gray-400 mt-1">
            Automated hash audits, deadline extensions, and eligibility revision detection.
          </p>
        </div>
        <button
          onClick={handleRunCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-glow disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Scanning Sources...' : 'Check All Sources Now'}</span>
        </button>
      </div>

      {checkResult && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{checkResult}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 bg-[#111827] rounded-3xl border border-white/5">
          Loading audit logs...
        </div>
      ) : changes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#111827] border border-white/10 space-y-3">
          <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Sources In Sync</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No contradictory modifications or deadline alterations have been detected in your tracked sources.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map((c) => {
            const isPotential = c.verification_status.includes('Potential');
            return (
              <div
                key={c.id}
                className="p-6 rounded-3xl bg-[#111827] border border-white/10 hover:border-purple-500/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        isPotential
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {c.verification_status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Type: <span className="text-purple-300 font-semibold">{c.change_type}</span>
                    </span>
                  </div>

                  <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {c.detected_at ? new Date(c.detected_at).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-relaxed">{c.change_summary}</h3>
                  {(c.previous_value || c.new_value) && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Prior Recorded Value:</span>
                        <span className="text-gray-300 font-mono">{c.previous_value || 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20">
                        <span className="text-[10px] text-purple-400 uppercase font-mono block mb-1">New Detected Value:</span>
                        <span className="text-white font-mono font-bold">{c.new_value || 'Updated Content'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3 text-xs">
                  {isPotential ? (
                    <>
                      <button
                        onClick={() => handleVerifyChange(c.id, 'Disputed')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        Dispute / False Positive
                      </button>
                      <button
                        onClick={() => handleVerifyChange(c.id, 'Verified Change')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Verified Change</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Verified by User
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

