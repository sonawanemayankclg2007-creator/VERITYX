import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass,
  FileSearch,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data: any = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      // Backend might be offline or starting up
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const target = notifications.find(n => n.id === id);
        return target && !target.read_at ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'AI Research', path: '/research', icon: FileSearch },
    { name: 'Track Opportunities', path: '/opportunities', icon: Layers },
    { name: 'Source Monitor', path: '/monitoring', icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[1.5px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-extrabold text-xl tracking-tighter">VX</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-white">VERITYX</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-medium border border-purple-500/30">AI 2.0</span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-0.5 font-medium tracking-tight hidden sm:block">Digital Dark Spot Intelligence</p>
          </div>
        </Link>

        {/* Navigation Links (when authenticated) */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 relative border border-white/5"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-white">Smart Alerts & Cutoffs</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                          {unreadCount} unread
                        </span>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5 mt-2 space-y-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">No new alerts or deadline notices.</p>
                      ) : (
                        notifications.map((n) => {
                          const priority = n.priority || 'normal';
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleMarkAsRead(n.id)}
                              className={`p-3 text-xs cursor-pointer hover:bg-white/5 transition-colors rounded-xl my-1 relative group ${
                                !n.read_at ? 'bg-purple-950/20 border-l-2 border-purple-500' : 'text-gray-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span
                                  className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                    priority === 'critical'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : priority === 'high'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : priority === 'medium'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {priority}
                                </span>
                                <button
                                  onClick={(e) => handleDismissNotification(n.id, e)}
                                  className="text-gray-500 hover:text-rose-400 p-0.5 opacity-60 group-hover:opacity-100 transition"
                                  title="Dismiss"
                                >
                                  ✕
                                </button>
                              </div>
                              <p className="font-semibold text-gray-200">{n.title}</p>
                              <p className="text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                                <span>{n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}</span>
                                {n.opportunity_id && (
                                  <Link
                                    to={`/opportunities`}
                                    onClick={() => setNotifsOpen(false)}
                                    className="text-purple-400 hover:text-purple-300 font-semibold"
                                  >
                                    View Opportunity →
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 hover:border-purple-500/50 bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-gray-200 hidden sm:block max-w-[120px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Account Settings
                    </Link>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        signOut();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 hover:opacity-90 shadow-glow transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

