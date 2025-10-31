import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'safespace-admin-auth',
      storage: localStorage, // Fallback to standard localStorage for now
      flowType: 'pkce' // More secure authentication flow
    },
    global: {
      headers: {
        'x-application-name': 'safespace-admin'
      }
    },
    db: {
      schema: 'public'
    }
  }
);