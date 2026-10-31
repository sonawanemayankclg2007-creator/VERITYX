import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  GitPullRequest,
  Check,
  Layers,
} from 'lucide-react';

export const Signup: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const calculateStrength = () => {
    let score = 0;
    if (hasMinLength) score += 25;
    if (hasUpper) score += 25;
    if (hasLower) score += 25;
    if (hasNumber) score += 25;
    return score;
  };
  const strength = calculateStrength();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Password must satisfy all security requirements (8+ chars, upper, lower, number).');
      return;
    }
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const { error, user } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          setErrorMsg('Supabase Free Tier email rate limit reached. Please sign in with Google or try again shortly.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        if (user && user.identities && user.identities.length === 0) {
          setErrorMsg('An account with this email already exists. Please sign in.');
        } else {
          setSuccessMsg(
            'Account created successfully! If email confirmation is enabled, please verify your inbox before logging in.'
          );
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected registration error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(`Google OAuth Note: ${error.message}. Ensure Google provider is enabled in your Supabase dashboard.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google signup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 bg-[#0F1424] shadow-2xl">
        
        {/* LEFT COLUMN: Platform Intelligence & Branding */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#121A33] via-[#0D1326] to-[#0A0D1B] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-glow">
                <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-extrabold text-2xl tracking-tighter">VX</span>
                </div>
              </div>
              <span className="font-extrabold text-2xl tracking-wider text-white">VERITYX</span>
            </div>

            {/* Tagline & Pitch */}
            <div className="mt-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Digital Dark Spot Platform
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 leading-tight">
                Don't Just Find Information. Discover What You're Missing.
              </h1>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Discover what is missing. Verify what matters. Never miss an important update across education, careers, and public opportunities.
              </p>
            </div>

            {/* Abstract Intelligence Visualization Widget */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-400" /> Information Gap Detector
                </span>
                <span className="text-emerald-400 font-mono font-medium">99.4% Factual</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 w-4/5 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-300">
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                  <p className="font-bold text-white text-xs">0 False</p>
                  <p className="text-gray-400 text-[10px]">Claims</p>
                </div>
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                  <p className="font-bold text-amber-400 text-xs">Radar</p>
                  <p className="text-gray-400 text-[10px]">Conflicts</p>
                </div>
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                  <p className="font-bold text-cyan-400 text-xs">Living</p>
                  <p className="text-gray-400 text-[10px]">PDF v2.0</p>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <ul className="mt-8 space-y-2.5 text-xs text-gray-300">
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Evidence-backed claim and conflict comparison</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Smart deadline reminders & change alerts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Dynamic Living PDFs with version diff tracking</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-xs text-gray-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>256-Bit Secure Encryption</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Signup Card */}
        <div className="lg:col-span-7 bg-[#111827] p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Create your VERITYX account</h2>
              <p className="text-gray-400 text-sm mt-1.5">
                Start discovering information gaps and tracking the opportunities that matter to you.
              </p>
            </div>

            {/* Error & Success Feedback Banners */}
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

            {/* Google Signup Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
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

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111827] px-3 text-gray-500 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
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

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Strength:</span>
                      <span
                        className={`font-semibold ${
                          strength === 100
                            ? 'text-emerald-400'
                            : strength >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {strength === 100 ? 'Strong' : strength >= 50 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength === 100
                            ? 'bg-emerald-500 w-full'
                            : strength >= 50
                            ? 'bg-amber-500 w-1/2'
                            : 'bg-rose-500 w-1/4'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400 pt-1">
                      <span className={hasMinLength ? 'text-emerald-400' : ''}>• 8+ characters</span>
                      <span className={hasUpper ? 'text-emerald-400' : ''}>• Uppercase letter</span>
                      <span className={hasLower ? 'text-emerald-400' : ''}>• Lowercase letter</span>
                      <span className={hasNumber ? 'text-emerald-400' : ''}>• Number</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border text-white placeholder-gray-500 text-sm focus:outline-none transition-all ${
                      confirmPassword && !passwordsMatch
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-700 bg-white/5 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
                  I agree to the <span className="text-purple-400 underline">Terms of Service</span> and{' '}
                  <span className="text-purple-400 underline">Privacy Policy</span>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-xs text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 font-semibold hover:text-purple-300 underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

