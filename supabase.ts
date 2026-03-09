import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Store the client on window so Vite HMR re-evaluations of this module
// reuse the same instance instead of spawning a new one each time.
// Multiple clients cause token-refresh storms and auth lock contention.
declare global {
  interface Window { __supabaseClient?: SupabaseClient; }
}

if (!window.__supabaseClient) {
  window.__supabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = window.__supabaseClient;
