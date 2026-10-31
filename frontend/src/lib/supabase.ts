import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cfdzutredjuweiszdias.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[VERITYX] Supabase URL or Publishable Key is missing from frontend environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

