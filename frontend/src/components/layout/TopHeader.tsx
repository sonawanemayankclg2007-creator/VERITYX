import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sparkles,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAssistant: () => void;
  unreadNotificationsCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  onOpenAssistant,
  unreadNotificationsCount = 0
}) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Page title resolution
  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/deadline-guardian')) return 'Smart Deadline Guardian';
    if (pathname.startsWith('/eligibility-analyzer')) return 'AI Eligibility & Readiness Analyzer';
    if (pathname.startsWith('/discover')) return 'Discover Opportunities';
    if (pathname.startsWith('/research')) return 'AI Research & Assessment';
    if (pathname.startsWith('/progress-tracking')) return 'Progress & Follow-up Tracking';
    if (pathname.startsWith('/health-status')) return 'Opportunity Health Status';
    if (pathname.startsWith('/notifications')) return 'Notifications Center';
    if (pathname.startsWith('/profile')) return 'My Profile';
    if (pathname.startsWith('/settings')) return 'Account Settings';
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    return 'Opportunity Intelligence';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider hidden sm:block">
            VERITYX Platform
          </span>
          <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search railway exams, defence, scholarships, jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
          />
        </div>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Gemini AI Assistant Quick Launch */}
        <button
          onClick={onOpenAssistant}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Ask Gemini AI</span>
        </button>

        {/* Notifications Icon Button */}
        <Link
          to="/notifications"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 relative border border-slate-800 transition"
          title="Notifications Center"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden sm:block max-w-[100px] truncate">
              {profile?.full_name || user?.email?.split('@')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                  {profile?.user_category || 'Student'}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
              >
                <User className="w-4 h-4 text-purple-400" />
                My Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Account Settings
              </Link>

              <div className="border-t border-slate-800 my-1" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  signOut();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

