import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AdminManagement from './pages/AdminManagement';
import AddNewAdmin from './pages/AddNewAdmin';
import ManageAdmins from './pages/ManageAdmins';
import Doctors from './pages/Doctors';
import NewDoctor from './pages/NewDoctor';
import EntertainmentManagement from './pages/Entertainment';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import AdminProfile from './pages/AdminProfile';

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
            <Route path="doctors" element={<Doctors />} />
            <Route path="newdoctors" element={<NewDoctor />} />
            <Route path="entertainment" element={<EntertainmentManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<AdminProfile />} />
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