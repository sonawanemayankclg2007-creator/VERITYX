import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Clock,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();

  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [emailNotifs, setEmailNotifs] = useState(profile?.notification_preferences?.email ?? true);
  const [pushNotifs, setPushNotifs] = useState(profile?.notification_preferences?.push ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(profile?.notification_preferences?.in_app ?? true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [settingsMsg, setSettingsMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSettingsMsg(null);

    const { error } = await updateProfile({
      timezone: timezone,
      notification_preferences: {
        email: emailNotifs,
        push: pushNotifs,
        in_app: inAppNotifs,
      },
    });

    if (error) {
      setSettingsMsg({ text: error.message, isError: true });
    } else {
      setSettingsMsg({ text: 'Preferences updated successfully!', isError: false });
    }
    setSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'Password must be at least 8 characters long.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', isError: true });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMsg({ text: error.message, isError: true });
      } else {
        setPasswordMsg({ text: 'Password updated successfully.', isError: false });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ text: err.message, isError: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
              Account Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-purple-400" />
            Account Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Manage your notification dispatch channels, cutoff reminder rules, timezone synchronization, and account security.
          </p>
        </div>
      </div>

      {settingsMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
            settingsMsg.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {settingsMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{settingsMsg.text}</span>
        </div>
      )}

      {/* Preferences Form */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <span>Notification & Timezone Channels</span>
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Timezone for Deadline Evaluation
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Configured to Indian Standard Time (IST: UTC+5:30) for official exam and recruitment cutoffs.
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <label className="block text-xs font-bold text-white mb-2">Automated Alert Schedule</label>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>5 Days Before Deadline: Advance preparation alert</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>3 Days Before Deadline: Urgent document & fee verification</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>1 Day Before Deadline: Final 24 hours portal warning</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Deadline Day: Cutoff day server notification</span>
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={e => setEmailNotifs(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500"
                />
                <span>Email alerts for upcoming cutoff intervals and official extensions</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppNotifs}
                  onChange={e => setInAppNotifs(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500"
                />
                <span>In-app notifications and Smart Deadline Guardian radar indicators</span>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 transition shadow disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Management */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Security & Password</span>
        </h3>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              passwordMsg.isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {passwordMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

