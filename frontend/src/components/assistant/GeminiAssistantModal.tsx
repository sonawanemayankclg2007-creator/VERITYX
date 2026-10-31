import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contextOpportunityId?: string;
}

export const GeminiAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  contextOpportunityId
}) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **VERITYX Opportunity Intelligence Assistant** powered by Google Gemini.

I can help you:
- Verify exact eligibility clauses and age relaxations (OBC, SC, ST, EWS).
- Check mandatory educational degrees and minimum percentages.
- Clarify physical & medical benchmarks for Railway & Defence exams.
- Outline steps to raise your Selection Readiness Score.

What would you like to verify today?`,
      suggested_actions: [
        'Am I eligible for Railway ALP?',
        'How does OBC age relaxation work?',
        'Required documents for Central Sector Scholarship'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const token = (user as any)?.token || (user as any)?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('http://localhost:8000/api/v1/eligibility/assistant', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend,
          context_opportunity_id: contextOpportunityId || null,
          conversation_history: historyPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            suggested_actions: data.suggested_actions || []
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I encountered a brief connection issue. Please check that the backend server is reachable.'
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the Gemini Assistant service. Please try again in a few moments.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 blur-sm" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">VERITYX Gemini Assistant</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Gemini 3.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Personalized Career, Eligibility & Deadline Guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 border border-slate-700/70 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.content}

                {/* Suggested Action Chips */}
                {m.suggested_actions && m.suggested_actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                    {m.suggested_actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => sendMessage(act)}
                        className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 rounded-lg text-[11px] text-purple-200 transition flex items-center gap-1"
                      >
                        <span>{act}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
                <span>Gemini is generating official guidance...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <form
            onSubmit={e => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about eligibility, deadlines, relaxation rules..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-purple-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

