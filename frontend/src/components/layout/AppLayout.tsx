import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { Footer } from './Footer';
import { GeminiAssistantModal } from '../assistant/GeminiAssistantModal';
import { NotificationPopupAlert } from '../notifications/NotificationPopupAlert';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const data: any = await api.get('/notifications');
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      // Ignore background errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const timer = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(timer);
    }
  }, [user]);

  // If user is not logged in, render simple layout
  if (!user) {
    return <div className="min-h-screen bg-[#0B0F19] text-gray-100">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-[#0B0F19] text-gray-100 antialiased">
      {/* Collapsible SaaS Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenAssistant={() => setAssistantOpen(true)}
          unreadNotificationsCount={unreadCount}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Global Conversational Gemini Assistant */}
      <GeminiAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

      {/* Automatic Urgent Notification Popup Alert */}
      <NotificationPopupAlert />
    </div>
  );
};
