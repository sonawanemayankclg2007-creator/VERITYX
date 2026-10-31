import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Compass,
  FileText,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';

export const ResearchList: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data: any = await api.get('/research');
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this research dossier?')) return;
    try {
      await api.delete(`/research/${id}`);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Research Dossiers</h1>
          <p className="text-sm text-gray-400 mt-1">
            Information gap detection, source verification records, and evidence conflict analysis.
          </p>
        </div>
        <Link
          to="/research/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-xs hover:opacity-90 shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Analysis</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 bg-[#111827] rounded-3xl border border-white/5">
          Loading intelligence archives...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#111827] border border-white/10 space-y-3">
          <FileSearch className="w-10 h-10 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Research Analyses Yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Input multiple sources or paste guidelines to detect missing criteria, conflicting dates, and unverified requirements.
          </p>
          <Link
            to="/research/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Start First Analysis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const score = p.readiness_score?.score || 70;
            return (
              <Link
                key={p.id}
                to={`/research/${p.id}`}
                className="flex flex-col justify-between p-6 rounded-3xl bg-[#111827] border border-white/10 hover:border-purple-500/40 hover:bg-[#151D30] transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                        score >= 75
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : score >= 50
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {score}% Readiness
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="text-gray-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete dossier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-white mt-3 group-hover:text-purple-300 transition-colors line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                    {p.summary || p.research_question || 'Comparative multi-source intelligence report.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-mono text-[11px]">{p.sources_count || 1} Sources</span>
                    <span className="text-amber-400 font-mono text-[11px]">{p.gaps_count || 0} Gaps</span>
                    <span className="text-rose-400 font-mono text-[11px]">{p.conflicts_count || 0} Conflicts</span>
                  </div>
                  <span className="text-purple-400 flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                    Inspect <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

