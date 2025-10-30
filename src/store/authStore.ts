import { create } from 'zustand';
import { AuthService } from '../lib/authService';
import type { Database } from '../types/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  fetchUserProfile: async () => {
    try {
      set({ loading: true, error: null });
      const user = await AuthService.getCurrentUser();
      set({ user, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false 
      });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const user = await AuthService.login(email, password);
      set({ user, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await AuthService.logout();
      set({ user: null, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Logout failed',
        loading: false 
      });
      throw error;
    }
  },

  signup: async (email: string, password: string, username: string) => {
    try {
      set({ loading: true, error: null });
      const user = await AuthService.signUpWithEmailPassword(email, password, username);
      set({ user, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        loading: false
      });
      throw error;
    }
  },
}));