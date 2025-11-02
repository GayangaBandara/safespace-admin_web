import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Create client with proper typing for the specific schema
export const supabase = createClient<Database, 'public'>(
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

// Service role client for database operations (bypasses RLS)
export const supabaseAdmin = createClient<Database, 'public'>(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-client-info': 'safespace-admin-service',
        'apikey': supabaseServiceRoleKey || supabaseAnonKey
      }
    },
    db: {
      schema: 'public'
    }
  }
);