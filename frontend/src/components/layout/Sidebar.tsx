import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Search,
  ClipboardCheck,
  CalendarClock,
  Brain,
  TrendingUp,
  Activity,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadNotificationsCount = 0
}) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  // EXACT SIDEBAR MENU ORDER MANDATED BY SPECIFICATION:
  // MAIN MENU:
  // 1. Discover Opportunities — Search icon
  // 2. AI Eligibility & Readiness Analyzer — Clipboard Check icon
  // 3. Smart Deadline Guardian — Calendar Clock icon
  // 4. AI Research & Assessment — Brain icon
  // 5. Progress & Follow-up Tracking — Trending Up icon
  // 6. Opportunity Health Status — Activity icon
  // 7. Notifications — Bell icon
  // ACCOUNT:
  // 8. My Profile — User icon
  // 9. Settings — Settings icon
  const mainMenuItems = [
    {
      name: 'Discover Opportunities',
      path: '/discover',
      icon: Search
    },
    {
      name: 'AI Eligibility & Readiness Analyzer',
      path: '/eligibility-analyzer',
      icon: ClipboardCheck,
      badge: 'AI Core',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    },
    {
      name: 'Smart Deadline Guardian',
      path: '/deadline-guardian',
      icon: CalendarClock,
      badge: 'IST Radar',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    },
    {
      name: 'AI Research & Assessment',
      path: '/research',
      icon: Brain
    },
    {
      name: 'Progress & Follow-up Tracking',
      path: '/progress-tracking',
      icon: TrendingUp
    },
    {
      name: 'Opportunity Health Status',
      path: '/health-status',
      icon: Activity
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      unreadBadge: unreadNotificationsCount
    }
  ];

  const accountMenuItems = [
    {
      name: 'My Profile',
      path: '/profile',
      icon: User
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D121F] border-r border-slate-800 text-slate-300 select-none">
      {/* Brand & Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden"
          onClick={onCloseMobile}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[1.5px] flex-shrink-0 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-[#0D121F] rounded-[9px] flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-black text-lg tracking-tighter">
                VX
              </span>
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">VERITYX</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40">
                  AI 2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5 tracking-tight truncate max-w-[140px]">
                Opportunity Intelligence
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Dashboard Overview */}
        <div>
          <NavLink
            to="/dashboard"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Dashboard Overview</span>}
          </NavLink>
        </div>

        {/* MAIN MENU */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
              Main Menu
            </span>
          )}
          <nav className="space-y-1">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-purple-600/20 text-white border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate">
                        {item.name}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.badge && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      {item.unreadBadge !== undefined && item.unreadBadge > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {item.unreadBadge > 9 ? '9+' : item.unreadBadge}
                        </span>
                      )}
                    </div>
                  )}

                  {collapsed && item.unreadBadge !== undefined && item.unreadBadge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* ACCOUNT */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
              Account
            </span>
          )}
          <nav className="space-y-1">
            {accountMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-purple-600/20 text-white border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0A0E17]/60">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <NavLink
              to="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-[10px] text-purple-300 truncate font-mono">
                  {profile?.user_category || 'Student'}
                </span>
              </div>
            </NavLink>
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <NavLink
              to="/profile"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs"
              title={profile?.full_name || 'My Profile'}
            >
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-screen sticky top-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
