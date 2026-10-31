import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Trash2,
  Bell,
  Sparkles,
  Download,
  FileDown,
} from 'lucide-react';
import { api } from '../../lib/api';

export const OpportunityTracker: React.FC = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Opportunity Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [oppType, setOppType] = useState('railway');
  const [officialUrl, setOfficialUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [submitting, setSubmitting] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const data: any = await api.get('/opportunities');
      setOpportunities(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleTrackNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        title,
        organization,
        opportunity_type: oppType,
        official_url: officialUrl || null,
        application_start_date: startDate || null,
        application_deadline: deadline || null,
        application_status: status,
        monitoring_enabled: true,
      };

      await api.post('/opportunities/track', payload);
      setModalOpen(false);
      setTitle('');
      setOrganization('');
      setOfficialUrl('');
      setStartDate('');
      setDeadline('');
      fetchOpportunities();
    } catch (err: any) {
      alert(`Error tracking opportunity: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (oppId: string, newStatus: string) => {
    try {
      await api.patch(`/opportunities/${oppId}/status`, { application_status: newStatus });
      setOpportunities(opportunities.map((o) => (o.id === oppId ? { ...o, application_status: newStatus } : o)));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (oppId: string) => {
    if (!window.confirm('Stop tracking this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${oppId}`);
      setOpportunities(opportunities.filter((o) => o.id !== oppId));
    } catch (err: any) {
      console.error(err);
    }
  };

  const statusOptions = ['Not Started', 'In Progress', 'Registered', 'Completed', 'Not Interested'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Smart Opportunity Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track recruitment, scholarships, and competitive examinations with Smart Deadline Guardian.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-xs hover:opacity-90 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Opportunity</span>
        </button>
      </div>

      {/* Grid of Opportunities */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 bg-[#111827] rounded-3xl border border-white/5">
          Loading monitored opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#111827] border border-white/10 space-y-3">
          <Clock className="w-10 h-10 text-cyan-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Tracked Opportunities</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Click "Track New Opportunity" to monitor application deadlines, exam dates, and receive automated change notifications.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Track First Opportunity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const days = opp.days_remaining;
            const isUrgent = days !== null && days !== undefined && days <= 7;
            return (
              <div
                key={opp.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-[#111827] border border-white/10 hover:border-cyan-500/40 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-white/5 text-purple-300">
                      {opp.opportunity_type}
                    </span>

                    <button
                      onClick={() => handleDelete(opp.id)}
                      className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mt-2 leading-snug">{opp.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{opp.organization || 'Official Authority'}</p>

                  {opp.official_url && (
                    <a
                      href={opp.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline mt-2 break-all"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  {/* Countdown Card */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Deadline:
                    </span>
                    <span className="font-semibold text-white font-mono">
                      {opp.application_deadline || 'Not Specified'}
                    </span>
                  </div>

                  {days !== null && days !== undefined && (
                    <div
                      className={`p-3 rounded-xl text-center text-xs font-mono font-bold ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}
                    >
                      {days > 0 ? `🚨 Closing in ${days} days` : (days === 0 ? '⚠️ Deadline Today!' : 'Expired')}
                    </div>
                  )}

                  {/* Application Status Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Application Status:
                    </label>
                    <select
                      value={opp.application_status}
                      onChange={(e) => handleStatusChange(opp.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Track Opportunity Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-white">Track New Opportunity</h3>
            <p className="text-xs text-gray-400 mt-1">
              Add a recruitment notice, scholarship, or admission to enable Smart Deadline Guardian and official change monitoring.
            </p>

            <form onSubmit={handleTrackNew} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Staff Selection Commission CGL 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Organization / Authority</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. SSC / Central Railway"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Category</label>
                  <select
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="railway">Railway Recruitment</option>
                    <option value="govt">Government Job</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="admission">College Admission</option>
                    <option value="exam">Competitive Exam</option>
                    <option value="internship">Internship</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  placeholder="https://ssc.gov.in"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Application Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Initial Application Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Track Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

