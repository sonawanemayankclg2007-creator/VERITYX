import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileSearch,
  Sparkles,
  Layers,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  RefreshCw,
  FileDown,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Plus,
  GitBranch,
  BookOpen,
  ListChecks,
  CheckCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { KnowledgeGapGraph } from '../../components/graph/KnowledgeGapGraph';

export const ResearchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<any | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pdfDocs, setPdfDocs] = useState<any[]>([]);

  // Default to 'gaps' so Information Gaps & Missing Information are immediately visible
  const [activeTab, setActiveTab] = useState<'gaps' | 'findings' | 'radar' | 'checklist' | 'graph' | 'freshness' | 'pdf'>('gaps');
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<any | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const data: any = await api.get(`/research/${id}`);
      setProject(data.project);
      setSources(data.sources || []);
      setClaims(data.claims || []);
      setGaps(data.gaps || []);
      setConflicts(data.conflicts || []);
      setTasks(data.tasks || []);

      if (data.project?.status === 'processing') {
        setProcessingStatus({
          current_step: data.project.current_step || 1,
          step_label: data.project.step_label || 'Analyzing Research Sources',
          progress_pct: data.project.progress_pct || 15,
        });
      } else {
        setProcessingStatus(null);
      }

      // Fetch linked PDFs
      const pdfs: any = await api.get('/pdf').catch(() => []);
      setPdfDocs(pdfs.filter((p: any) => p.research_project_id === id));
    } catch (err) {
      console.error('Error fetching research details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Polling if in processing state
  useEffect(() => {
    if (!id || !processingStatus || project?.status !== 'processing') return;

    const timer = setInterval(async () => {
      try {
        const st: any = await api.get(`/research/${id}/status`);
        if (st.status === 'completed') {
          clearInterval(timer);
          fetchProjectDetails();
        } else if (st.status === 'failed') {
          clearInterval(timer);
          fetchProjectDetails();
        } else {
          setProcessingStatus(st);
        }
      } catch (err) {
        console.warn('Status poll note:', err);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [id, processingStatus, project?.status]);

  const handleGeneratePDF = async () => {
    if (!id) return;
    setGeneratingPdf(true);
    setPdfSuccess(null);
    try {
      const res: any = await api.post('/pdf/generate', {
        research_project_id: id,
        title: project?.title || 'VERITYX Living Report',
      });
      setPdfSuccess('Living PDF generated successfully!');
      // Refresh PDF list
      const pdfs: any = await api.get('/pdf').catch(() => []);
      setPdfDocs(pdfs.filter((p: any) => p.research_project_id === id));
      setActiveTab('pdf');
    } catch (err: any) {
      alert(`Error generating PDF: ${err.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleRegenerateVersion = async (docId: string) => {
    try {
      await api.post(`/pdf/${docId}/regenerate`, {});
      const pdfs: any = await api.get('/pdf').catch(() => []);
      setPdfDocs(pdfs.filter((p: any) => p.research_project_id === id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs">Loading research intelligence dossier...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
          <FileSearch className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-gray-400">
          The requested research initiative could not be found or has not completed yet.
        </p>
        <Link to="/research" className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-xs font-semibold">
          Return to Research Dossiers
        </Link>
      </div>
    );
  }

  if (project?.status === 'processing') {
    const curStep = processingStatus?.current_step || project.current_step || 1;
    const curLabel = processingStatus?.step_label || project.step_label || 'Understanding Research Topic';
    const curPct = processingStatus?.progress_pct || project.progress_pct || 15;

    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="p-8 rounded-3xl bg-[#0f172a] border border-purple-500/40 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest font-bold">
                  Step {curStep} of 8
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{curLabel}</h3>
              </div>
            </div>
            <span className="text-3xl font-extrabold font-mono text-purple-400">{curPct}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${curPct}%` }}
            />
          </div>

          <p className="text-xs text-gray-400 text-center">
            VERITYX Universal Engine is conducting live multi-source analysis with Gemini AI. This page will update automatically when complete.
          </p>
        </div>
      </div>
    );
  }

  const readiness = project.readiness_score || {};
  const score = readiness.score || 70;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link to="/research" className="hover:text-white transition-colors">Research</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-200 truncate max-w-xs">{project.title}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPdf}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow disabled:opacity-50"
          >
            {generatingPdf ? (
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Generate Living PDF</span>
          </button>
        </div>
      </div>

      {/* Main Title & Executive Assessment Report Header */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-white/10 space-y-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                VERITYX Assessment Report
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Analysis Complete
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {project.title}
            </h1>
            {project.research_question && (
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="font-semibold text-purple-400">Primary Inquiry:</span> {project.research_question}
              </p>
            )}
            {project.research_goal && (
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Goal:</span> {project.research_goal}
              </p>
            )}
          </div>

          {/* Decision Readiness Gauge */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono block">
              Decision Readiness Score
            </span>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span
                className={`text-4xl font-extrabold font-mono ${
                  score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-gray-500 font-mono">/ 100</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-tight">
              {score >= 75 ? 'Low risk — ready for action' : 'Action items require clarification'}
            </p>
          </div>
        </div>

        {/* Readiness Breakdown Bar */}
        <div className="pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white/5 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Information Coverage</span>
            <span className="font-bold text-white font-mono text-sm">{readiness.coverage_score || 75}%</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Evidence Quality</span>
            <span className="font-bold text-cyan-400 font-mono text-sm">{readiness.evidence_quality_score || 80}%</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Freshness Score</span>
            <span className="font-bold text-purple-400 font-mono text-sm">{readiness.freshness_score || 70}%</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Unresolved Conflicts</span>
            <span className="font-bold text-rose-400 font-mono text-sm">{conflicts.length}</span>
          </div>
        </div>

        {/* Final Executive Summary / Synthesis */}
        <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl text-xs text-gray-200 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Synthesis & Assessment Report:</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {project.summary}
          </p>
          {readiness.critical_missing_information && (
            <div className="mt-2 pt-2 border-t border-purple-500/20 text-amber-300 flex items-center gap-2 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span><strong>Primary Decision Blocker:</strong> {readiness.critical_missing_information}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 space-x-1 sm:space-x-4 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('gaps')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gaps'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Information Gaps ({gaps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'findings'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Research Findings & Claims ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('radar')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'radar'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Evidence Conflict Radar ({conflicts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Recommendations ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'graph'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Interactive Knowledge Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('freshness')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'freshness'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`py-3 px-4 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pdf'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileDown className="w-4 h-4" />
          <span>Living PDF ({pdfDocs.length})</span>
        </button>
      </div>

      {/* TAB 1: Information Gaps & Missing Information */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Information Gaps & Missing Criteria</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Critical missing data points that ordinary search summaries omit. Resolve these before committing time or fees.
              </p>
            </div>
          </div>

          {gaps.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#111827] rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-white">No Critical Information Gaps Detected</p>
              <p>All core eligibility, fee, and deadline parameters are represented across the analyzed sources.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gaps.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-[#111827] border border-white/10 hover:border-amber-500/30 transition-all space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        g.importance === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      Importance: {g.importance}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Status: {g.status}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{g.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{g.description}</p>

                  {g.recommended_action && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                      <span className="font-bold block text-amber-400 mb-0.5">Actionable Recommendation:</span>
                      {g.recommended_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Research Findings & Extracted Claims */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Research Findings & Extracted Claims</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Factual claims extracted directly from provided sources with evidence quotes and confidence scores.
            </p>
          </div>

          {claims.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#111827] rounded-2xl border border-white/5">
              No claims extracted from the current sources.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="p-4 rounded-2xl bg-[#111827] border border-white/10 hover:border-emerald-500/30 transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {c.claim_type || 'Factual'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Confidence: {Math.round((c.confidence || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">{c.claim_text}</p>

                  {c.evidence_text && (
                    <blockquote className="p-2.5 rounded-lg bg-black/40 border-l-2 border-emerald-500 text-xs text-gray-400 italic">
                      "{c.evidence_text}"
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Evidence Conflict Radar */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-400" />
              <span>Evidence Conflict Radar</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cross-source claim discrepancies and contradictory eligibility rules between notices.
            </p>
          </div>

          {conflicts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#111827] rounded-2xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-semibold text-white">No Contradictions Detected</p>
              <p>All provided sources agree on dates, criteria, and operational guidelines.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-5 rounded-2xl bg-[#111827] border border-rose-500/20 space-y-4 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                      Divergence Detected ({Math.round((conf.confidence || 0.85) * 100)}% Confidence)
                    </span>
                    <span className="text-[11px] text-gray-400">Status: {conf.status}</span>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">{conf.description}</p>

                  {conf.recommended_action && (
                    <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200">
                      <span className="font-bold block text-rose-400 mb-1">Resolution Protocol:</span>
                      {conf.recommended_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Recommendations & Action Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-cyan-400" />
              <span>Prioritized Recommendations & Verification Tasks</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Check off recommended actions before submitting applications or making financial commitments.
            </p>
          </div>

          <div className="space-y-2.5">
            {tasks.map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-4 rounded-xl bg-[#111827] border border-white/10 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-gray-700 bg-white/5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{t.description}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                    t.priority === 'critical'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-white/5 text-gray-300'
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Knowledge Gap Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Interactive Knowledge Gap Graph (React Flow)</span>
            </h3>
            <span className="text-xs text-gray-400">Click any node to inspect evidence quotes</span>
          </div>

          <KnowledgeGapGraph
            projectTitle={project.title}
            sources={sources}
            claims={claims}
            gaps={gaps}
            conflicts={conflicts}
            tasks={tasks}
          />
        </div>
      )}

      {/* TAB 6: Sources & Freshness */}
      {activeTab === 'freshness' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Source Freshness & Authority Audit</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Evaluated for publication dates, official authority, and validity.
            </p>
          </div>

          <div className="space-y-3">
            {sources.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                      {s.source_type}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        s.freshness_status === 'current'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {s.freshness_status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs mt-1.5">{s.title}</h4>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-0.5 break-all"
                    >
                      <span>{s.url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                  {s.source_content && (
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 italic">
                      "{s.source_content}"
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] text-gray-400 flex-shrink-0">
                  <p>Published: <span className="text-gray-200">{s.publication_date || 'Unspecified'}</span></p>
                  <p className="text-[10px] text-gray-500">Verification: {s.verification_status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: Living PDF Documents */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Living PDF Version Management</h3>
              <p className="text-xs text-gray-400">
                Immutable, timestamped intelligence snapshots updated whenever official sources change.
              </p>
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPdf}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Living Report</span>
            </button>
          </div>

          {pdfDocs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#111827] rounded-2xl border border-white/5 space-y-2">
              <FileDown className="w-8 h-8 text-purple-400 mx-auto" />
              <p className="font-semibold text-white">No Living PDF Generated Yet</p>
              <p>Click "Generate Living PDF" above to build a multi-page ReportLab PDF report.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pdfDocs.map((doc) => (
                <div key={doc.id} className="p-6 rounded-2xl bg-[#111827] border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Living PDF: Version {doc.current_version}.0
                      </span>
                      <h4 className="font-bold text-base text-white mt-1.5">{doc.title}</h4>
                      <p className="text-xs text-gray-400">Document ID: {doc.id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegenerateVersion(doc.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
                        title="Increment Version"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Increment Version</span>
                      </button>

                      <a
                        href={api.getDownloadUrl(`/pdf/${doc.id}/download`)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF (v{doc.current_version}.0)</span>
                      </a>
                    </div>
                  </div>

                  {/* Version Changelog List */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Version Timeline:
                    </span>
                    {(doc.versions || []).map((v: any) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-purple-300">v{v.version_number}.0</span>
                          <span className="text-gray-300">{v.change_summary || 'Verified Release'}</span>
                        </div>
                        <a
                          href={api.getDownloadUrl(`/pdf/${doc.id}/download?version=${v.version_number}`)}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Download className="w-3 h-3" /> Get v{v.version_number}.0
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
