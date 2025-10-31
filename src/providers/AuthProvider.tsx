import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminStore } from '../store/adminStore';
import { AuthContext } from './AuthContext';

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, loading, initialized, fetchAdminProfile } = useAdminStore();

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // If we have a session but no admin data, fetch it
          if (!admin) {
            await fetchAdminProfile();
          }

          // Redirect to dashboard if on a public route
          if (PUBLIC_ROUTES.includes(location.pathname)) {
            navigate('/dashboard', { replace: true });
          }
        } else {
          // No session, redirect to login if not on a public route
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On error, clear state and redirect to login
        useAdminStore.setState({
          admin: null,
          loading: false,
          initialized: true,
          error: error instanceof Error ? error.message : 'Authentication failed'
        });
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate('/login', { replace: true });
        }
      }
    }

    if (!initialized) {
      initAuth();
    }
  }, [initialized, admin, location.pathname, navigate]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_OUT') {
        useAdminStore.setState({
          admin: null,
          loading: false,
          initialized: true
        });
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate('/login', { replace: true });
        }
      } else if (event === 'SIGNED_IN' && session) {
        await fetchAdminProfile();
        if (PUBLIC_ROUTES.includes(location.pathname)) {
          navigate('/dashboard', { replace: true });
        }
      } else if (event === 'TOKEN_REFRESHED') {
        if (!admin) {
          await fetchAdminProfile();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, admin]);

  // Prevent rendering until we have checked auth
  if (!initialized || loading) {
    return null;
  }

  return (
    <AuthContext.Provider 
      value={{
        isInitialized: initialized,
        isAuthenticated: Boolean(admin),
        session: null // We don't expose the session directly for security
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

