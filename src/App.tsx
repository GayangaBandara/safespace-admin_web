import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAdminStore } from './store/adminStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import { TestConnection } from './components/TestConnection';
import checkEnvironment from './utils/checkEnv';

function App() {
  const { admin, loading, fetchAdminProfile } = useAdminStore();

  useEffect(() => {
    // Check environment variables first
    if (!checkEnvironment()) {
      console.error('Please fix environment variables before continuing');
      return;
    }

    // Initial profile fetch
    fetchAdminProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchAdminProfile();
      } else if (event === 'SIGNED_OUT') {
        // Ensure admin state is cleared on sign out
        useAdminStore.setState({ admin: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdminProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
        <div className="mt-8">
          <TestConnection />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!admin ? <Login /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/signup"
          element={!admin ? <SignUp /> : <Navigate to="/dashboard" replace />}
        />

        {/* Protected routes */}
        {admin ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<div>Users Page Coming Soon</div>} />
            <Route path="doctors" element={<div>Doctors Page Coming Soon</div>} />
            <Route path="reports" element={<div>Reports Page Coming Soon</div>} />
            <Route path="analytics" element={<div>Analytics Page Coming Soon</div>} />
            <Route path="settings" element={<div>Settings Page Coming Soon</div>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        )}
      </Routes>
    </Router>
  );
}

export default App
