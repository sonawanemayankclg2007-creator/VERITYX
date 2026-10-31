import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Shield,
  Bell,
  Clock,
  Key,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  GraduationCap,
  Briefcase,
  UserCheck,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ProfileSettings: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [userCategory, setUserCategory] = useState<'Student' | 'Employee' | 'Unemployed'>(
    profile?.user_category || 'Student'
  );
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || 'B.Tech / College Degree');
  const [interestsStr, setInterestsStr] = useState(
    (profile?.target_interests || ['Competitive Exams', 'Scholarships', 'Tech Opportunities']).join(', ')
  );
  const [skillsStr, setSkillsStr] = useState(
    (profile?.skills || ['Coding', 'Problem Solving', 'Data Analysis']).join(', ')
  );

  const [emailNotifs, setEmailNotifs] = useState(profile?.notification_preferences?.email ?? true);
  const [pushNotifs, setPushNotifs] = useState(profile?.notification_preferences?.push ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(profile?.notification_preferences?.in_app ?? true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);

    const parsedInterests = interestsStr
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    const parsedSkills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const { error } = await updateProfile({
      full_name: fullName,
      username: username,
      timezone: timezone,
      user_category: userCategory,
      education_level: educationLevel,
      target_interests: parsedInterests,
      skills: parsedSkills,
      notification_preferences: {
        email: emailNotifs,
        push: pushNotifs,
        in_app: inAppNotifs,
      },
    });

    if (error) {
      setProfileMsg({ text: error.message, isError: true });
    } else {
      setProfileMsg({ text: 'Profile preferences and category saved successfully!', isError: false });
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
            Profile & Intelligence Preferences
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">Account & Category Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Customize your persona category, education details, and alert preferences to power personalized AI recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: User Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-[#111827] border border-white/10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 mx-auto flex items-center justify-center text-white font-extrabold text-3xl shadow-glow mb-4">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </div>
            <h3 className="font-bold text-lg text-white">{profile?.full_name || 'Verified User'}</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
            
            <div className="mt-4 pt-3 border-t border-slate-800 text-left space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Category:</span>
                <span className="font-semibold text-purple-300">{userCategory}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Education:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">{educationLevel}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Account Security:</span>
                <span className="font-semibold text-emerald-400">Verified</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from VERITYX</span>
          </button>
        </div>

        {/* Right Column: Edit Profile & Password */}
        <div className="md:col-span-2 space-y-8">
          {/* Profile Form */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>Persona & Eligibility Profile</span>
            </h3>

            {profileMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  profileMsg.isError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {profileMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
              {/* Persona Category Selector (Phase 3) */}
              <div>
                <label className="block text-xs font-bold text-white mb-2">
                  Primary User Category (Personalizes Recommendations)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserCategory('Student')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      userCategory === 'Student'
                        ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold">Student</span>
                    <span className="text-[10px] text-slate-400">Scholarships & Exams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserCategory('Employee')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      userCategory === 'Employee'
                        ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold">Employee</span>
                    <span className="text-[10px] text-slate-400">Career & Upskilling</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserCategory('Unemployed')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      userCategory === 'Unemployed'
                        ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">Job Seeker</span>
                    <span className="text-[10px] text-slate-400">Govt & Skill Schemes</span>
                  </button>
                </div>
              </div>

              {/* Education & Interests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="10th / Matriculation">10th / Matriculation</option>
                    <option value="12th / Senior Secondary (PCM)">12th (Physics, Chemistry & Math)</option>
                    <option value="12th / Senior Secondary (Non-PCM)">12th (Commerce / Arts / Non-PCM)</option>
                    <option value="ITI / Trade Diploma">ITI Trade Certification</option>
                    <option value="Polytechnic Diploma">3-Year Polytechnic Diploma</option>
                    <option value="B.Tech / B.E. / BCA / MCA">B.Tech / B.E. / BCA / MCA</option>
                    <option value="Bachelor's Degree (General)">Bachelor's Degree (BA / B.Com / B.Sc)</option>
                    <option value="Master's Degree / Post-Graduate">Master's Degree / Post-Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Timezone</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Target Interests (Comma-separated)
                </label>
                <input
                  type="text"
                  value={interestsStr}
                  onChange={(e) => setInterestsStr(e.target.value)}
                  placeholder="e.g. Railway ALP, Defence NDA, Software Engineering, Central Scholarships"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Key Skills & Qualifications (Comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Python, React, Mechanical Maintenance, Mathematics"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-gray-300 mb-2">Notification Channels</label>
                <div className="space-y-2 text-xs text-gray-300">
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="rounded border-gray-700 bg-white/5 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Email alerts for upcoming deadlines & official extensions (5d, 3d, 1d)</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={inAppNotifs}
                      onChange={(e) => setInAppNotifs(e.target.checked)}
                      className="rounded border-gray-700 bg-white/5 text-purple-600 focus:ring-purple-500"
                    />
                    <span>In-app Smart Deadline Guardian radar and progress follow-up checks</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Profile...' : 'Save Profile & Preferences'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Change Password</span>
            </h3>

            {passwordMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  passwordMsg.isError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {passwordMsg.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
