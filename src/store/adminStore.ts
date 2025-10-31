import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { clearAuthData } from '../lib/clearAuthData';

interface AdminState {
  admin: Database['public']['Tables']['admins']['Row'] | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  fetchAdminProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      loading: false,
      error: null,
      initialized: false,

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        try {
          // Clear existing state first
          set({ loading: true, error: null, admin: null });
          
          console.log('Attempting login for:', email);
          
          // Sign in with Supabase Auth
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            console.error('Sign in error:', signInError);
            throw new Error(signInError.message);
          }

          if (!authData?.user) {
            console.error('No user data received');
            throw new Error('Authentication failed - no user data received');
          }

          // Just update with basic user info, we'll fetch admin details later
          set({
            admin: {
              id: authData.user.id,
              email: authData.user.email!,
              full_name: authData.user.user_metadata?.full_name || null,
              role: 'moderator',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            loading: false,
            error: null,
            initialized: true
          });
        } catch (error) {
          set({
            admin: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Login failed',
            initialized: true
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ loading: true, error: null });
          const success = await clearAuthData();
          if (!success) throw new Error('Failed to clear auth data');
          set({
            admin: null,
            loading: false,
            error: null,
            initialized: true
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Logout failed',
            initialized: true
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, username: string) => {
        try {
          set({ loading: true, error: null });

          // Check if email already exists in admins table
          const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (existingAdmin) {
            throw new Error('An account with this email already exists');
          }

          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: username
              },
              emailRedirectTo: `${window.location.origin}/login`
            }
          });

          if (signUpError) throw signUpError;
          if (!authData.user?.id) throw new Error('Signup failed');

          const { data: admin, error: adminError } = await (supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('admins') as any)
            .insert({
              id: authData.user.id,
              email,
              full_name: username,
              role: 'pending'
            })
            .select()
            .single();

          if (adminError) throw adminError;
          if (!admin) throw new Error('Failed to create admin profile');

          set({
            admin,
            loading: false,
            error: null,
            initialized: true
          });
        } catch (error) {
          set({
            admin: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Signup failed',
            initialized: true
          });
          throw error;
        }
      },

      fetchAdminProfile: async () => {
        try {
          set({ loading: true, error: null });

          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (!session?.user) {
            set({
              admin: null,
              loading: false,
              initialized: true
            });
            return;
          }

          const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (adminError) {
            if (adminError.code === 'PGRST116') {
              set({
                admin: null,
                loading: false,
                initialized: true
              });
              return;
            }
            throw adminError;
          }

          if (!admin) {
            set({
              admin: null,
              loading: false,
              initialized: true
            });
            return;
          }

          set({
            admin,
            loading: false,
            error: null,
            initialized: true
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
            initialized: true
          });
        }
      },
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        admin: state.admin,
        initialized: state.initialized
      })
    }
  )
);