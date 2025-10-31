import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

interface AdminState {
  admin: Database['public']['Tables']['admins']['Row'] | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  fetchAdminProfile: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      loading: true,
      error: null,
      initialized: false,
      clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    try {
      console.log('Starting login process for:', email);
      set({ loading: true, error: null });
      
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth response:', { authData, signInError });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error(signInError.message);
      }

      if (!authData.user) {
        console.error('No user data in auth response');
        throw new Error('No user data returned from authentication');
      }

      console.log('Fetching admin profile for user:', authData.user.id);
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('Admin profile response:', { admin, adminError });

      if (adminError) {
        console.error('Admin fetch error:', adminError);
        if (adminError.code === 'PGRST116') {
          throw new Error('Account not found. Please contact system administrator.');
        }
        throw adminError;
      }

      if (!admin) {
        console.error('No admin record found');
        throw new Error('No admin account found');
      }

      console.log('Login successful, setting admin state:', admin);
      set({ admin, loading: false, error: null, initialized: true });
    } catch (error) {
      set({ 
        admin: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred',
        initialized: true 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ admin: null, loading: false, error: null, initialized: true });
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

      // First create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user?.id) {
        throw new Error('No user ID returned from signup');
      }

      // Then create the admin record
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

      if (adminError) {
        throw new Error(`Failed to create admin profile: ${adminError.message}`);
      }

      set({ admin, loading: false, error: null, initialized: true });
    } catch (error) {
      set({
        admin: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        initialized: true
      });
      throw error;
    }
  },

  fetchAdminProfile: async () => {
    try {
      console.log('Fetching admin profile...');
      set({ loading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { session, sessionError });

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('No active session found');
        set({ admin: null, loading: false, initialized: true });
        return;
      }

      console.log('Found active session for user:', session.user.id);
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('Admin profile fetch result:', { admin, adminError });

      if (adminError) {
        console.error('Admin fetch error:', adminError);
        if (adminError.code === 'PGRST116') {
          set({ admin: null, loading: false, initialized: true });
          return;
        }
        set({ loading: false, error: adminError.message, initialized: true });
        return;
      }

      if (!admin) {
        console.log('No admin record found');
        set({ admin: null, loading: false, initialized: true });
        return;
      }

      console.log('Setting admin state:', admin);
      set({ admin, loading: false, error: null, initialized: true });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
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