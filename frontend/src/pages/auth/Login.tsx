import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  Search,
  Compass,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Please verify your email address before signing in. Check your inbox for the confirmation link.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setSuccessMsg('Authentication successful. Redirecting...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(`Google OAuth Note: ${error.message}. Ensure Google provider is enabled in your Supabase dashboard.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google signin failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        setForgotMsg(`Error: ${error.message}`);
      } else {
        setForgotMsg('Password reset link sent! Check your inbox to set a new password.');
      }
    } catch (err: any) {
      setForgotMsg(`Error: ${err.message}`);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 bg-[#0F1424] shadow-2xl">
        
        {/* LEFT COLUMN: Intelligence Platform Identity */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#121A33] via-[#0D1326] to-[#0A0D1B] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-glow">
                <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-extrabold text-2xl tracking-tighter">VX</span>
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-wider text-white">VERITYX</span>
            </div>

            <div className="mt-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Verification & Opportunity Intelligence
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 leading-tight">
                Welcome back to VERITYX
              </h1>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Continue your research, verify critical eligibility criteria, and stay updated on important deadlines.
              </p>
            </div>

            {/* Abstract Live Radar Card */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <Compass className="w-3.5 h-3.5 text-purple-400" /> Evidence Conflict Radar
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Active
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-300 space-y-1">
                <div className="flex justify-between items-center text-gray-400 text-[10px]">
                  <span>Source A: Official Portal</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
                <div className="flex justify-between items-center text-gray-400 text-[10px]">
                  <span>Source B: Social Forum</span>
                  <span className="text-rose-400">Contradiction</span>
                </div>
              </div>
            </div>

            <ul className="mt-8 space-y-2.5 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Persistent multi-source research dossiers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Automated change detection & hash audits</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Prioritized verification checklist engine</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-xs text-gray-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Encrypted Enterprise Authentication</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form */}
        <div className="lg:col-span-7 bg-[#111827] p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome back</h2>
              <p className="text-gray-400 text-sm mt-1.5">
                Continue your research and stay updated on the information that matters.
              </p>
            </div>

            {/* Error or Success alerts */}
            {errorMsg && (
              <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Google Login Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all hover:border-purple-500/40 disabled:opacity-50 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111827] px-3 text-gray-500 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 font-semibold hover:text-purple-300 underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-white">Reset Your Password</h3>
            <p className="text-xs text-gray-400 mt-1">
              Enter your registered email address and we'll send a secure password reset link.
            </p>

            {forgotMsg && (
              <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                {forgotMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

