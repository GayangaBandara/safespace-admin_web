import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

interface AdminState {
  admin: Database['public']['Tables']['admins']['Row'] | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  fetchAdminProfile: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          throw new Error('Account not found. Please contact system administrator.');
        }
        throw adminError;
      }

      if (!admin) {
        throw new Error('No admin account found');
      }

      set({ admin, loading: false, error: null });
    } catch (error) {
      set({ 
        admin: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ admin: null, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
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

      set({ admin, loading: false, error: null });
    } catch (error) {
      set({
        admin: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
      throw error;
    }
  },

  fetchAdminProfile: async () => {
    try {
      set({ loading: true, error: null });
      
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;

      if (!user) {
        set({ admin: null, loading: false });
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          set({ admin: null, loading: false });
          return;
        }
        console.error('Error fetching admin profile:', adminError);
        set({ loading: false, error: adminError.message });
        return;
      }

      if (!admin) {
        set({ admin: null, loading: false });
        return;
      }

      set({ admin, loading: false, error: null });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      });
    }
  },
}));