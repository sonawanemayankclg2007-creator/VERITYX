import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Award, 
  Clock, 
  ChevronRight, 
  Layers, 
  Bookmark, 
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CriterionRequirement {
  id: string;
  criterion_type: string;
  label: string;
  official_requirement: string;
  is_mandatory: boolean;
  input_type: string;
  options?: string[];
  min_value?: number;
  max_value?: number;
  unit?: string;
  help_text?: string;
}

interface OpportunityCriteria {
  opportunity_id?: string;
  title: string;
  organization?: string;
  category: string;
  official_notification_url?: string;
  application_deadline?: string;
  criteria_list: CriterionRequirement[];
  required_documents: string[];
  medical_disclaimer?: string;
}

interface CriterionEvaluationResult {
  criterion_id: string;
  label: string;
  official_requirement: string;
  user_input: string;
  status: string;
  explanation: string;
}

interface ReadinessBreakdown {
  qualifications_score: number;
  certificates_score: number;
  skills_score: number;
  preparation_progress_score: number;
  profile_completeness_score: number;
}

interface EligibilityAssessmentReport {
  id: string;
  opportunity_title: string;
  category: string;
  overall_status: string;
  readiness_score: number;
  readiness_explanation: string;
  readiness_breakdown: ReadinessBreakdown;
  criteria_evaluations: CriterionEvaluationResult[];
  strengths: string[];
  missing_requirements: string[];
  required_certificates: string[];
  weaknesses_and_gaps: string[];
  recommendations: string[];
  next_steps: string[];
  verification_warnings: string[];
  assessed_at: string;
}

interface Props {
  onOpportunityTracked?: () => void;
  initialOpportunityTitle?: string;
}

export const DynamicEligibilityAnalyzer: React.FC<Props> = ({ onOpportunityTracked, initialOpportunityTitle }) => {
  const { user, profile } = useAuth();
  const [templates, setTemplates] = useState<OpportunityCriteria[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-railway-alp');
  const [activeCriteria, setActiveCriteria] = useState<OpportunityCriteria | null>(null);
  
  // Custom criteria extraction
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('govt_job');
  const [customText, setCustomText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Candidate Form Inputs
  const [age, setAge] = useState<number>(24);
  const [socialCategory, setSocialCategory] = useState<string>('General');
  const [criteriaResponses, setCriteriaResponses] = useState<Record<string, any>>({});
  const [availableDocs, setAvailableDocs] = useState<string[]>([
    '10th / Matriculation Certificate (DOB Proof)',
    'Aadhaar Card'
  ]);

  // Assessment State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState<EligibilityAssessmentReport | null>(null);
  const [isTracked, setIsTracked] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch verified templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/eligibility/templates');
      if (res.ok) {
        const data: OpportunityCriteria[] = await res.json();
        setTemplates(data);
        if (data.length > 0) {
          const defaultTmpl = data.find(t => t.title.toLowerCase().includes(initialOpportunityTitle?.toLowerCase() || '')) || data[0];
          setSelectedTemplateId(defaultTmpl.opportunity_id || data[0].opportunity_id || '');
          setActiveCriteria(defaultTmpl);
          initResponses(defaultTmpl);
        }
      }
    } catch (err) {
      console.warn('Templates fetch error, using fallback:', err);
    }
  };

  const initResponses = (tmpl: OpportunityCriteria) => {
    const initial: Record<string, any> = {};
    tmpl.criteria_list.forEach(c => {
      if (c.criterion_type === 'age') {
        initial[c.id] = age;
      } else if (c.options && c.options.length > 0) {
        initial[c.id] = c.options[0];
      } else if (c.min_value !== undefined) {
        initial[c.id] = c.min_value;
      } else {
        initial[c.id] = '';
      }
    });
    setCriteriaResponses(initial);
  };

  const handleTemplateChange = (tmplId: string) => {
    setIsCustomMode(false);
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find(t => t.opportunity_id === tmplId);
    if (tmpl) {
      setActiveCriteria(tmpl);
      initResponses(tmpl);
      setAssessmentReport(null);
      setIsTracked(false);
    }
  };

  const handleExtractCustom = async () => {
    if (!customTitle || !customText) {
      alert('Please provide opportunity title and notification text');
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/eligibility/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          category: customCategory,
          notification_text: customText
        })
      });
      if (res.ok) {
        const data: OpportunityCriteria = await res.json();
        setActiveCriteria(data);
        initResponses(data);
        setIsCustomMode(false);
      }
    } catch (err) {
      console.error('Criteria extraction failed:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!activeCriteria) return;
    setIsEvaluating(true);

    const token = (user as any)?.token || (user as any)?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const candidatePayload = {
      opportunity_id: activeCriteria.opportunity_id,
      opportunity_title: activeCriteria.title,
      category: activeCriteria.category,
      user_category: profile?.user_category || 'Student',
      age: Number(age),
      social_category: socialCategory,
      criteria_responses: criteriaResponses,
      available_documents: availableDocs,
      skills: profile?.skills || ['Problem Solving']
    };

    try {
      const res = await fetch('http://localhost:8000/api/v1/eligibility/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          criteria: activeCriteria,
          candidate: candidatePayload
        })
      });

      if (res.ok) {
        const report: EligibilityAssessmentReport = await res.json();
        setAssessmentReport(report);
      } else {
        const errData = await res.json();
        alert(`Evaluation error: ${errData.detail || 'Failed to verify'}`);
      }
    } catch (err) {
      console.error('Evaluation call failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTrackOpportunity = async () => {
    if (!activeCriteria) return;
    setTrackingLoading(true);

    const token = (user as any)?.token || (user as any)?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('http://localhost:8000/api/v1/opportunities/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: activeCriteria.title,
          organization: activeCriteria.organization || 'Official Agency',
          opportunity_type: activeCriteria.category,
          official_url: activeCriteria.official_notification_url || 'https://verityx.ai',
          application_deadline: activeCriteria.application_deadline || '2026-12-31',
          application_status: 'In Progress',
          monitoring_enabled: true
        })
      });

      if (res.ok) {
        setIsTracked(true);
        if (onOpportunityTracked) onOpportunityTracked();
      }
    } catch (err) {
      console.error('Tracking failed:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  const toggleDoc = (doc: string) => {
    if (availableDocs.includes(doc)) {
      setAvailableDocs(availableDocs.filter(d => d !== doc));
    } else {
      setAvailableDocs([...availableDocs, doc]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Eligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
          </span>
        );
      case 'Conditionally Eligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" /> Conditionally Eligible
          </span>
        );
      case 'Not Eligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" /> Not Eligible
          </span>
        );
      case 'Insufficient Information':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Info className="w-3.5 h-3.5" /> Missing Information
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <HelpCircle className="w-3.5 h-3.5" /> Verification Required
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="relative z-10 mb-8 border-b border-slate-800/80 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-purple-400 uppercase bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/50">
                  Signature AI Engine
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Deterministic Verification
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Dynamic AI Eligibility & Readiness Analyzer
              </h2>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Target Category Profile</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-purple-300 border border-slate-700">
              {profile?.user_category || 'Student'} Focus
            </span>
          </div>
        </div>
        <p className="text-slate-300 text-sm mt-3 max-w-3xl">
          <strong className="text-white">Know your eligibility before you apply.</strong> Select verified government notifications or paste custom criteria. Our deterministic engine verifies age relaxations, educational degrees, medical standards, and calculates your explainable Selection Readiness Score.
        </p>

        {/* Opportunity Category Quick Selector */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {templates.map(tmpl => {
            const isSelected = selectedTemplateId === tmpl.opportunity_id && !isCustomMode;
            return (
              <button
                key={tmpl.opportunity_id}
                onClick={() => handleTemplateChange(tmpl.opportunity_id || '')}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {tmpl.category === 'railway' && '🚂'}
                {tmpl.category === 'defence' && '🎖️'}
                {tmpl.category === 'scholarship' && '🎓'}
                {tmpl.category === 'college_admission' && '🏛️'}
                {tmpl.category === 'private_job' && '💼'}
                {tmpl.category === 'exam' && '📜'}
                <span>{tmpl.title}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              isCustomMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/40 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <span>✨ Custom / Paste Notice</span>
          </button>
        </div>
      </div>

      {/* Custom Mode Extraction Banner */}
      {isCustomMode && (
        <div className="mb-8 p-5 bg-slate-800/80 border border-indigo-500/30 rounded-xl relative z-10 animate-fadeIn">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Extract Criteria from Notification Circular with Gemini
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Opportunity Title</label>
              <input
                type="text"
                placeholder="e.g. SSC CGL 2026 Inspector Recruitment"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Category</label>
              <select
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="govt_job">Government Job / SSC</option>
                <option value="railway">Railway Recruitment</option>
                <option value="defence">Defence / Armed Forces</option>
                <option value="scholarship">Scholarship & Grants</option>
                <option value="college_admission">College Admission</option>
                <option value="private_job">Private Industry / Tech Job</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-300 font-medium block mb-1">Paste Notification Text / Eligibility Clauses</label>
            <textarea
              rows={4}
              placeholder="Paste gazette section on Age Limit, Minimum Qualifications, Medical Standards, and Reservation Rules..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200"
            />
          </div>
          <button
            onClick={handleExtractCustom}
            disabled={isExtracting}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Parsing with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Parse & Generate Dynamic Form
              </>
            )}
          </button>
        </div>
      )}

      {/* Active Opportunity & Dynamic Candidate Form */}
      {activeCriteria && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Left Column: Dynamic Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-purple-400 uppercase">
                  {activeCriteria.organization || 'Official Opportunity'}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeCriteria.title}</h3>
                {activeCriteria.application_deadline && (
                  <p className="text-xs text-amber-300 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5" /> Deadline: {activeCriteria.application_deadline}
                  </p>
                )}
              </div>
              {activeCriteria.official_notification_url && (
                <a
                  href={activeCriteria.official_notification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 underline"
                >
                  Notice <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Candidate Common Baseline: Age & Social Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Your Age (as on closing date)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={14}
                    max={65}
                    value={age}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAge(val);
                      // update age in responses too
                      const ageCrit = activeCriteria.criteria_list.find(c => c.criterion_type === 'age');
                      if (ageCrit) {
                        setCriteriaResponses(prev => ({ ...prev, [ageCrit.id]: val }));
                      }
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-medium focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-400">years old</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Social Reservation Category
                </label>
                <select
                  value={socialCategory}
                  onChange={e => setSocialCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
                >
                  <option value="General">General (Unreserved)</option>
                  <option value="OBC">OBC (+3 Years Relaxation)</option>
                  <option value="SC">SC (+5 Years Relaxation)</option>
                  <option value="ST">ST (+5 Years Relaxation)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {socialCategory === 'OBC' && '✨ Permissible relaxation up to +3 years.'}
                  {(socialCategory === 'SC' || socialCategory === 'ST') && '✨ Permissible relaxation up to +5 years.'}
                  {socialCategory === 'General' && 'Standard age brackets apply without category extension.'}
                  {socialCategory === 'EWS' && 'Income certificate under ₹8 Lakhs mandatory.'}
                </span>
              </div>
            </div>

            {/* Dynamic Specific Criteria Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Opportunity Specific Verification Questions
              </h4>

              {activeCriteria.criteria_list
                .filter(c => c.criterion_type !== 'age')
                .map(crit => {
                  const val = criteriaResponses[crit.id] ?? '';
                  return (
                    <div
                      key={crit.id}
                      className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          {crit.label}
                          {crit.is_mandatory && (
                            <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-900/50">
                              Mandatory
                            </span>
                          )}
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5">
                        <span className="text-slate-500 font-semibold">Official Requirement:</span> {crit.official_requirement}
                      </p>

                      {/* Select Input */}
                      {crit.input_type === 'select' && crit.options && (
                        <select
                          value={val}
                          onChange={e => setCriteriaResponses({ ...criteriaResponses, [crit.id]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
                        >
                          {crit.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* Number Input */}
                      {crit.input_type === 'number' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder={crit.help_text || 'Enter value'}
                            value={val}
                            onChange={e => setCriteriaResponses({ ...criteriaResponses, [crit.id]: Number(e.target.value) })}
                            className="w-48 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
                          />
                          {crit.unit && <span className="text-xs text-slate-400 font-medium">{crit.unit}</span>}
                        </div>
                      )}

                      {/* Text Input */}
                      {crit.input_type === 'text' && (
                        <input
                          type="text"
                          placeholder={crit.help_text || 'Enter detail'}
                          value={val}
                          onChange={e => setCriteriaResponses({ ...criteriaResponses, [crit.id]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500"
                        />
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Document Readiness Checklist */}
            {activeCriteria.required_documents.length > 0 && (
              <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Mark Certificates Currently Available & In Hand
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Document verification contributes 20% to your Selection Readiness Score.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCriteria.required_documents.map((doc, idx) => {
                    const hasDoc = availableDocs.includes(doc);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDoc(doc)}
                        className={`text-left p-2.5 rounded-lg border text-xs flex items-center gap-2 transition ${
                          hasDoc
                            ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            hasDoc
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {hasDoc && '✓'}
                        </div>
                        <span className="truncate">{doc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Trigger */}
            <div className="pt-2">
              <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Official Regulations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Verify My Eligibility & Readiness Score
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Assessment Results (5 cols) */}
          <div className="lg:col-span-5">
            {assessmentReport ? (
              <div className="space-y-6 sticky top-6">
                {/* Result Card */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-400 font-medium">Evaluation Result</span>
                    {getStatusBadge(assessmentReport.overall_status)}
                  </div>

                  {/* Readiness Score Meter */}
                  <div className="mb-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-slate-800">
                      <div className="text-center">
                        <span className={`text-2xl font-black ${getScoreColor(assessmentReport.readiness_score)}`}>
                          {assessmentReport.readiness_score}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">/ 100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-white">Selection Readiness</span>
                        <span className={getScoreColor(assessmentReport.readiness_score)}>
                          {assessmentReport.readiness_score >= 80 ? 'High Fit' : assessmentReport.readiness_score >= 50 ? 'Moderate Fit' : 'Low / Action Needed'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getScoreBg(assessmentReport.readiness_score)}`}
                          style={{ width: `${assessmentReport.readiness_score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {assessmentReport.readiness_explanation}
                      </p>
                    </div>
                  </div>

                  {/* Score Breakdown Bars */}
                  <div className="mb-6 space-y-2 border-b border-slate-800 pb-5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Readiness Breakdown
                    </h5>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Core Qualifications</span>
                        <span className="font-semibold">{assessmentReport.readiness_breakdown.qualifications_score} / 40</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${(assessmentReport.readiness_breakdown.qualifications_score / 40) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Document Readiness</span>
                        <span className="font-semibold">{assessmentReport.readiness_breakdown.certificates_score} / 20</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${(assessmentReport.readiness_breakdown.certificates_score / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Skills & Domain Match</span>
                        <span className="font-semibold">{assessmentReport.readiness_breakdown.skills_score} / 20</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${(assessmentReport.readiness_breakdown.skills_score / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {assessmentReport.strengths.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Advantages
                      </h5>
                      <ul className="space-y-1">
                        {assessmentReport.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Requirements or Warnings */}
                  {assessmentReport.missing_requirements.length > 0 && (
                    <div className="mb-4 p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl">
                      <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1">
                        <XCircle className="w-3.5 h-3.5" /> Eligibility Barriers Detected
                      </h5>
                      <ul className="space-y-1">
                        {assessmentReport.missing_requirements.map((item, idx) => (
                          <li key={idx} className="text-xs text-rose-300 flex items-start gap-1.5">
                            <span>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Certificates Pending */}
                  {assessmentReport.required_certificates.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl">
                      <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Mandatory Certificates to Procure
                      </h5>
                      <ul className="space-y-1">
                        {assessmentReport.required_certificates.map((cert, idx) => (
                          <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                            <span>•</span>
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medical Disclaimer */}
                  {assessmentReport.verification_warnings.length > 0 && (
                    <div className="mb-5 p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl text-[11px] text-purple-200/80">
                      <span className="font-semibold text-purple-300 block mb-0.5">⚠️ Medical Standard Disclaimer:</span>
                      {assessmentReport.verification_warnings[0]}
                    </div>
                  )}

                  {/* Action Roadmap */}
                  {assessmentReport.recommendations.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Personalized Improvement Plan
                      </h5>
                      <div className="space-y-2">
                        {assessmentReport.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-800/60 rounded-lg text-xs text-slate-200 border border-slate-700/60 flex items-start gap-2">
                            <span className="font-bold text-purple-400">{idx + 1}.</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Button */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleTrackOpportunity}
                      disabled={isTracked || trackingLoading}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                        isTracked
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                      }`}
                    >
                      {isTracked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tracked with Deadline Guardian
                        </>
                      ) : trackingLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" /> Track in Deadline Guardian
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="text-white font-bold text-base mb-1">Awaiting Profile Verification</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                  Fill in your age, degree, and physical standards on the left, then click <strong>Verify My Eligibility</strong> to generate your deterministic report and Selection Readiness Score.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Rule Compliance Check
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

