import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AdminManagement from './pages/AdminManagement';
import AddNewAdmin from './pages/AddNewAdmin';
import ManageAdmins from './pages/ManageAdmins';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="doctors" element={<div>Doctors Page Coming Soon</div>} />
            <Route path="reports" element={<div>Reports Page Coming Soon</div>} />
            <Route path="analytics" element={<div>Analytics Page Coming Soon</div>} />
            <Route path="settings" element={<div>Settings Page Coming Soon</div>} />
            <Route path="admin/add" element={<AddNewAdmin />} />
            <Route path="admin/manage" element={<ManageAdmins />} />
            <Route path="admin/roles" element={<AdminManagement />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App