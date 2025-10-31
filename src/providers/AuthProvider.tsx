import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminStore } from '../store/adminStore';
import { AuthContext } from './AuthContext';
import { TestConnection } from '../components/TestConnection';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const DEFAULT_AUTH_ROUTE = '/login';
const DEFAULT_APP_ROUTE = '/dashboard';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, loading, initialized } = useAdminStore();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // First ensure we're starting fresh
        if (!mounted) return;
        
        useAdminStore.setState({ loading: true, error: null });

        // Try to refresh the session first
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError);
        }

        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Failed to verify your session. Please try logging in again.');
        }

        if (session?.user) {
          console.log('Session found for user:', session.user.id);
          
          // Fetch admin details if we have a session
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (adminError) {
            console.error('Admin fetch error:', adminError);
            throw new Error('Could not verify admin access. Please contact support.');
          }

          if (!adminData) {
            throw new Error('Admin account not found. Please check your credentials.');
          }

          if (mounted) {
            console.log('Setting admin state:', adminData);
            useAdminStore.setState({
              admin: adminData,
              loading: false,
              initialized: true,
              error: null
            });
          }

          // Handle routing
          const currentPath = location.pathname;
          if (PUBLIC_ROUTES.includes(currentPath)) {
            navigate(DEFAULT_APP_ROUTE, { replace: true });
          }
        } else {
          console.log('No active session found');
          if (mounted) {
            useAdminStore.setState({
              admin: null,
              loading: false,
              initialized: true,
              error: null
            });
          }

          // Redirect to login only if not on a public route
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            navigate(DEFAULT_AUTH_ROUTE, { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          useAdminStore.setState({
            admin: null,
            loading: false,
            initialized: true,
            error: error instanceof Error ? error.message : 'Authentication failed'
          });
        }
        
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate(DEFAULT_AUTH_ROUTE, { replace: true });
        }
      }
    }

    if (!initialized) {
      initAuth();
    }

    return () => {
      mounted = false;
    };
  }, [initialized, location.pathname, navigate]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        useAdminStore.setState({
          admin: null,
          loading: false,
          initialized: true,
          error: null
        });
        
        if (!PUBLIC_ROUTES.includes(location.pathname)) {
          navigate(DEFAULT_AUTH_ROUTE, { replace: true });
        }
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Just update with session data and redirect
        useAdminStore.setState({
          admin: {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || null,
            role: 'moderator',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          loading: false,
          initialized: true,
          error: null
        });

        if (PUBLIC_ROUTES.includes(location.pathname)) {
          navigate(DEFAULT_APP_ROUTE, { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Prevent rendering until we have checked auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
        <div className="mt-8 max-w-lg w-full mx-auto">
          <TestConnection />
        </div>
      </div>
    );
  }
  
  // If we have an error in the store, show it
  const error = useAdminStore.getState().error;
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg">
        <div className="text-center max-w-lg mx-auto p-4">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            onClick={() => {
              useAdminStore.setState({ error: null });
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
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
