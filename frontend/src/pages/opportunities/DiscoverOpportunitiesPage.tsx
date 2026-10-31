import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

export const DiscoverOpportunitiesPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackedIds, setTrackedIds] = useState<string[]>([]);

  const userCat = profile?.user_category || 'Student';

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      // 1. Fetch category recommendations from backend
      const recRes = await fetch(`http://localhost:8000/api/v1/eligibility/recommendations?category=${userCat}`);
      let recs: any[] = [];
      if (recRes.ok) {
        const data = await recRes.json();
        recs = data.recommendations || [];
      }

      // 2. Fetch verified templates from backend
      const tmplRes = await fetch('http://localhost:8000/api/v1/eligibility/templates');
      let tmpls: any[] = [];
      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        tmpls = tmplData.map((t: any) => ({
          id: t.opportunity_id,
          title: t.title,
          organization: t.organization,
          category: t.category,
          application_deadline: t.application_deadline,
          action_url: t.official_notification_url,
          fit_reason: `Official verified ${t.category} circular with deterministic eligibility criteria.`,
          key_eligibility: t.criteria_list?.map((c: any) => c.label).slice(0, 2).join(', ')
        }));
      }

      // Merge and deduplicate by title
      const combined = [...tmpls, ...recs];
      const seen = new Set();
      const unique = combined.filter(item => {
        if (!item.title || seen.has(item.title.toLowerCase())) return false;
        seen.add(item.title.toLowerCase());
        return true;
      });

      setOpportunities(unique);
    } catch (err) {
      console.warn('Failed loading discover opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [userCat]);

  const handleTrack = async (opp: any) => {
    try {
      await api.post('/opportunities/track', {
        title: opp.title,
        organization: opp.organization || 'Official Institution',
        opportunity_type: opp.category,
        application_deadline: opp.application_deadline || '2026-12-31',
        official_url: opp.action_url || 'https://verityx.ai',
        application_status: 'Not Started',
        monitoring_enabled: true
      });
      setTrackedIds(prev => [...prev, opp.title]);
    } catch (err) {
      console.error('Tracking error:', err);
    }
  };

  const filtered = opportunities.filter(opp => {
    const matchesCategory =
      selectedCategory === 'all' || opp.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.organization && opp.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.fit_reason && opp.fit_reason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/40">
                Discovery Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Curated for {userCat}s
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Search className="w-7 h-7 text-purple-400" />
              Discover Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Explore active government circulars, defence recruitments, scholarships, university counselling, and corporate engineering roles. One-click verification and tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search verified opportunities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'All Opportunities' },
            { id: 'railway', label: 'Railway' },
            { id: 'defence', label: 'Defence' },
            { id: 'scholarship', label: 'Scholarships' },
            { id: 'college_admission', label: 'College' },
            { id: 'private_job', label: 'Tech Jobs' },
            { id: 'exam', label: 'Civil Services' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedCategory === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Scanning verified circulars and opportunities...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No Matching Opportunities</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different category tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((opp, idx) => {
            const isTracked = trackedIds.includes(opp.title);

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                      {opp.category || 'General'}
                    </span>
                    {opp.application_deadline && (
                      <span className="text-amber-400 font-mono text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {opp.application_deadline}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {opp.organization || 'Official Issuing Authority'}
                  </p>

                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      <strong className="text-purple-300">Why It Fits:</strong> {opp.fit_reason}
                    </p>
                    {opp.key_eligibility && (
                      <p className="text-slate-400 text-[10px]">
                        <strong className="text-slate-300">Key Criteria:</strong> {opp.key_eligibility}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => {
                      navigate('/eligibility-analyzer');
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Check Eligibility
                  </button>

                  <div className="flex items-center gap-2">
                    {opp.action_url && (
                      <a
                        href={opp.action_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Open Official Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleTrack(opp)}
                      disabled={isTracked}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        isTracked
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                      }`}
                    >
                      {isTracked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Tracked
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3" /> Track
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

