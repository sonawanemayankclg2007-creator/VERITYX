import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, X, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export const NotificationPopupAlert: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const checkAlerts = async () => {
    if (!user) return;
    try {
      const data: any = await api.get('/notifications');
      const unreadList = (data.notifications || []).filter(
        (n: any) => !n.read_at && !dismissedIds.has(n.id)
      );

      // Prioritize critical and high priority alerts
      const urgent = unreadList.find((n: any) => n.priority === 'critical' || n.priority === 'high');
      const alertToShow = urgent || unreadList[0];

      if (alertToShow && (!activeAlert || activeAlert.id !== alertToShow.id)) {
        setActiveAlert(alertToShow);
      }
    } catch (e) {
      // Quiet fail
    }
  };

  useEffect(() => {
    if (user) {
      // Check after a brief delay on mount, then periodically
      const initialTimer = setTimeout(checkAlerts, 2000);
      const interval = setInterval(checkAlerts, 30000);
      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [user, dismissedIds]);

  const handleDismiss = () => {
    if (activeAlert) {
      setDismissedIds(prev => new Set(prev).add(activeAlert.id));
      setActiveAlert(null);
    }
  };

  const handleAction = async () => {
    if (!activeAlert) return;
    try {
      await api.patch(`/notifications/${activeAlert.id}/read`);
    } catch (e) {}

    const oppId = activeAlert.opportunity_id;
    handleDismiss();

    if (oppId) {
      navigate('/deadline-guardian');
    } else {
      navigate('/notifications');
    }
  };

  if (!activeAlert) return null;

  const isCritical = activeAlert.priority === 'critical';
  const isHigh = activeAlert.priority === 'high';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slideUp">
      <div
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
          isCritical
            ? 'bg-rose-950/90 border-rose-500/50 text-white shadow-rose-900/40'
            : isHigh
            ? 'bg-amber-950/90 border-amber-500/50 text-white shadow-amber-900/40'
            : 'bg-slate-900/95 border-purple-500/40 text-white shadow-purple-900/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300'
                  : isHigh
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {isCritical ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  {activeAlert.priority || 'Notice'} Alert
                </span>
                <span className="text-[10px] text-slate-400">Just Now</span>
              </div>
              <h4 className="text-xs font-bold mt-1 text-white line-clamp-1">
                {activeAlert.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                {activeAlert.message}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            title="Dismiss"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            onClick={handleDismiss}
            className="text-[11px] text-slate-400 hover:text-white transition"
          >
            Remind me later
          </button>
          <button
            onClick={handleAction}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1 transition"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

