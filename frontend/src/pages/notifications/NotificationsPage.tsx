import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../lib/api';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Dismiss error:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.read_at;
    if (filterType === 'priority') return n.priority === 'critical' || n.priority === 'high';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                Automated Notification Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {unreadCount} Unread Alerts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Bell className="w-7 h-7 text-purple-400" />
              Notifications Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Automated smart alerts delivered according to official deadlines (5d, 3d, 1d, final day) and 4-day application milestone follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            filterType === 'all'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            filterType === 'unread'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilterType('priority')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition ${
            filterType === 'priority'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Urgent & Critical
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Loading alerts from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-white text-base">No Notifications Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are fully caught up. When tracked deadlines approach or follow-ups trigger, notifications will automatically arrive here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(notif => {
            const isUnread = !notif.read_at;
            const priority = notif.priority || 'normal';

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isUnread
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-md'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                        priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : priority === 'medium'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recent'}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{notif.message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {notif.opportunity_id && (
                    <Link
                      to="/deadline-guardian"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>View Opportunity</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(notif.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

