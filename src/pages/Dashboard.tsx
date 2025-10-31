import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  totalReports: number;
}

interface DoctorStatus {
  status: string;
  count: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalReports: 0,
  });
  const [doctorStats, setDoctorStats] = useState<DoctorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const { admin } = useAdminStore();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (admin?.id) {
          // Fetch admin profile first
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', admin.id)
            .single();

          if (adminError) {
            console.error('Error fetching admin details:', adminError);
          } else if (adminData) {
            // Update admin store with complete data
            useAdminStore.setState({ admin: adminData });
          }
        }

        // Fetch total users
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact' });

        // Fetch total doctors
        const { count: doctorCount } = await supabase
          .from('doctors')
          .select('*', { count: 'exact' });

        // Fetch total appointments
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact' });

        // Fetch total reports
        const { count: reportCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact' });

        // Fetch doctor status statistics
        const { data: doctorStatusData } = await supabase
          .from('doctors')
          .select('status');

        // Calculate doctor status counts
        const statusCounts: Record<string, number> = {};
        (doctorStatusData as { status: string }[] | null)?.forEach((doctor) => {
          statusCounts[doctor.status] = (statusCounts[doctor.status] || 0) + 1;
        });

        const doctorStatusStats = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }));

        setStats({
          totalUsers: userCount || 0,
          totalDoctors: doctorCount || 0,
          totalAppointments: appointmentCount || 0,
          totalReports: reportCount || 0,
        });

        setDoctorStats(doctorStatusStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [admin?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card-shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your SafeSpace platform metrics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="text-2xl font-bold text-gray-900">{stats.totalUsers}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card-shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Doctors</dt>
                <dd className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card-shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments</dt>
                <dd className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card-shadow overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
                <dd className="text-2xl font-bold text-gray-900">{stats.totalReports}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Status Chart */}
      <div className="card-shadow p-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Doctor Status Distribution</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={doctorStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="count"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;