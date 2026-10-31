import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      try {
        // 1. Check for OAuth error responses in query parameters
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error_description') || searchParams.get('error');
        if (urlError) {
          if (isMounted) setError(urlError);
          return;
        }

        // 2. Check for PKCE authorization code in URL
        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('OAuth code exchange error:', exchangeError);
            if (isMounted) setError(exchangeError.message);
            return;
          }
          if (data.session && isMounted) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // 3. Check for existing or hash-derived session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (isMounted) setError(sessionError.message);
          return;
        }

        if (session && isMounted) {
          // Successfully authenticated!
          navigate('/dashboard', { replace: true });
          return;
        }

        // 4. Listen for auth state change (e.g. Implicit hash parsing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          if (s && isMounted) {
            navigate('/dashboard', { replace: true });
          } else if (event === 'SIGNED_OUT') {
            if (isMounted) setError('Google Authentication was not completed or was cancelled.');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'OAuth authentication exchange failed.');
        }
      }
    };

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111827] border border-rose-500/30 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">OAuth Verification Note</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{error}</p>
          <p className="text-xs text-purple-400 mt-4 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
            Note: If you haven't enabled Google OAuth in your Supabase dashboard yet, please enable the Google Provider under Authentication &gt; Providers.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
          >
            <span>Return to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-gray-400">
      <div className="relative w-14 h-14 mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <ShieldCheck className="w-7 h-7 text-purple-400 absolute inset-0 m-auto" />
      </div>
      <h3 className="text-base font-semibold text-white">Completing Secure Authentication</h3>
      <p className="text-xs text-gray-400 mt-1">Exchanging cryptographic session tokens with Supabase...</p>
    </div>
  );
};
