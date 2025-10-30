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

    fetchAdminProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchAdminProfile();
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

        {/* Protected routes - use a layout with nested child routes */}
        <Route
          path="/"
          element={admin ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<div>Users</div>} />
          <Route path="doctors" element={<div>Doctors</div>} />
          <Route path="reports" element={<div>Reports</div>} />
          <Route path="analytics" element={<div>Analytics</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
