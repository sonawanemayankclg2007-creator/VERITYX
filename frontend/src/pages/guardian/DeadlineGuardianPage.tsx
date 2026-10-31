import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Edit3
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export const DeadlineGuardianPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Opportunity Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newCategory, setNewCategory] = useState('railway');
  const [newDeadline, setNewDeadline] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPriority, setNewPriority] = useState('high');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) {
      alert('Please provide opportunity title and deadline date.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/opportunities/track', {
        title: newTitle,
        organization: newOrg || 'Official Organization',
        opportunity_type: newCategory,
        application_deadline: newDeadline,
        official_url: newUrl || 'https://verityx.ai',
        application_status: 'Not Started',
        monitoring_enabled: true
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewOrg('');
      setNewDeadline('');
      setNewUrl('');
      await fetchOpportunities();
    } catch (err) {
      console.error('Create opportunity error:', err);
      alert('Failed to save opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (oppId: string, newStatus: string) => {
    try {
      await api.patch(`/opportunities/${oppId}/status`, {
        application_status: newStatus
      });
      setOpportunities(prev =>
        prev.map(o => (o.id === oppId ? { ...o, application_status: newStatus } : o))
      );
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleDelete = async (oppId: string) => {
    if (!confirm('Are you sure you want to stop tracking this opportunity?')) return;
    try {
      await api.delete(`/opportunities/${oppId}`);
      setOpportunities(prev => prev.filter(o => o.id !== oppId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filtered = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.organization && opp.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'urgent') {
      return opp.days_remaining !== null && opp.days_remaining <= 3 && opp.days_remaining >= 0;
    }
    if (filterStatus === 'in_progress') {
      return opp.application_status === 'In Progress';
    }
    if (filterStatus === 'overdue') {
      return opp.is_overdue || (opp.days_remaining !== null && opp.days_remaining < 0);
    }
    if (filterStatus === 'completed') {
      return opp.application_status === 'Completed' || opp.application_status === 'Registered';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                Automated Deadline Radar
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Indian Standard Time (IST)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Clock className="w-7 h-7 text-cyan-400" />
              Smart Deadline Guardian
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Never miss an official application window again. Automatically schedules alerts at 5 days, 3 days, 1 day, and on closing day. Evaluates deadlines in official IST time with automated 4-day progress follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Track New Opportunity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tracked deadlines..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'urgent', label: 'Urgent (≤3 Days)' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterStatus === tab.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Syncing Deadline Radar with Official Cutoffs...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No Opportunities Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No opportunities matching "${searchQuery}".`
              : 'You have not added any opportunities in this filter. Click below to begin tracking.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
          >
            Track First Opportunity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(opp => {
            const days = opp.days_remaining;
            const isOverdue = opp.is_overdue || (days !== null && days < 0);
            const isUrgent = days !== null && days <= 3 && !isOverdue;
            const health = opp.health_status || (isOverdue ? 'Overdue' : isUrgent ? 'At Risk' : 'On Track');

            return (
              <div
                key={opp.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                      {opp.opportunity_type || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
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

                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {opp.organization || 'Official Institution'}
                  </p>

                  {/* Deadline Box */}
                  <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Cutoff Date</span>
                      <span className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {opp.deadline_ist || opp.application_deadline || 'Open'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Time Left</span>
                      {days !== null && days !== undefined ? (
                        <span
                          className={`text-xs font-mono font-bold ${
                            isOverdue
                              ? 'text-rose-400'
                              : isUrgent
                              ? 'text-amber-400 animate-pulse'
                              : 'text-cyan-400'
                          }`}
                        >
                          {isOverdue ? 'Cutoff Elapsed' : days === 0 ? 'Today (Final Hours)' : `${days} Days Left`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Open</span>
                      )}
                    </div>
                  </div>

                  {/* Current Application Status selector */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <select
                      value={opp.application_status || 'Not Started'}
                      onChange={e => handleStatusChange(opp.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Registered">Registered</option>
                      <option value="Completed">Completed</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      navigate('/eligibility-analyzer');
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Check Eligibility</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {opp.official_url && (
                      <a
                        href={opp.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Open Official Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(opp.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete tracking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Opportunity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Track New Opportunity</h3>
            <p className="text-xs text-slate-400 mb-5">
              Add any government exam, defence recruitment, scholarship, or job to monitor deadlines.
            </p>

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC CSE 2027 Prelims"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Union Public Service Commission"
                    value={newOrg}
                    onChange={e => setNewOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="railway">Railway</option>
                    <option value="defence">Defence</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="exam">Competitive Exam</option>
                    <option value="college_admission">College Admission</option>
                    <option value="private_job">Private Job / Tech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Notification / Portal URL</label>
                  <input
                    type="url"
                    placeholder="https://official-portal.gov.in"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Start Monitoring'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

