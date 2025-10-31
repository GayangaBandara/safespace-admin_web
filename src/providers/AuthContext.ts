import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  session: Session | null;
}

export const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
  isAuthenticated: false,
  session: null
});