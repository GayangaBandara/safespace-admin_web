import { useState, useEffect, useRef } from 'react';
import { useAdminStore } from '../store/adminStore';
import { supabase } from '../lib/supabase';

interface ActivityLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
}

const AdminProfile = () => {
  const { admin, fetchAdminProfile } = useAdminStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    recentActions: 0,
    lastLogin: null as string | null,
  });

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (admin) {
      setFormData({
        full_name: admin.full_name || '',
        email: admin.email || '',
      });
      fetchActivityLogs();
      fetchStats();
    }
  }, [admin]);

  const fetchActivityLogs = async () => {
    if (!admin?.id) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    }
  };

  const fetchStats = async () => {
    if (!admin?.id) return;

    try {
      // Get total actions
      const { count: totalActions } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', admin.id);

      // Get recent actions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentActions } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', admin.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalActions: totalActions || 0,
        recentActions: recentActions || 0,
        lastLogin: admin.updated_at,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!admin?.id) return;

    setLoading(true);
    setErrors({});

    try {
      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('admins') as any)
        .update({
          full_name: formData.full_name,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (error) throw error;

      // Refresh admin data
      await fetchAdminProfile();
      setIsEditing(false);

      // Log the action (optional - won't fail if audit_logs table doesn't exist or RLS policy prevents insert)
      try {
        await supabase.from('audit_logs').insert({
          admin_id: admin.id,
          action: 'profile_updated',
          table_name: 'admins',
          record_id: admin.id,
          changes: { full_name: formData.full_name, email: formData.email },
        });
      } catch (auditError) {
        console.warn('Could not log profile update to audit logs:', auditError);
      }

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!admin?.id) return;

    setLoading(true);
    setErrors({});

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Log the action (optional - won't fail if audit_logs table doesn't exist or RLS policy prevents insert)
      try {
        await supabase.from('audit_logs').insert({
          admin_id: admin.id,
          action: 'password_changed',
          table_name: 'admins',
          record_id: admin.id,
          changes: { password_updated: true },
        });
      } catch (auditError) {
        console.warn('Could not log password change to audit logs:', auditError);
      }

      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      superadmin: { label: 'Super Admin', className: 'bg-red-100 text-red-800' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      moderator: { label: 'Moderator', className: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ avatar: 'Please select a valid image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'File size must be less than 5MB' });
        return;
      }

      setAvatarFile(file);
      setErrors({});

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !admin?.id) return;

    setUploadingAvatar(true);
    setErrors({});

    try {
      // Step 1: Upload to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${admin.id}_${Date.now()}.${fileExt}`;
      const filePath = `admin-avatars/${fileName}`; // Updated filePath

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Correct bucket name
        .upload(filePath, avatarFile);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage Error: Bucket "admin-avatars" not found. Please create it in your Supabase dashboard.');
        }
        if (uploadError.message.includes('security policy')) {
            throw new Error(`Storage RLS Error: ${uploadError.message}. Check policies on storage.objects for the 'admin-avatars' bucket.`);
        }
        throw uploadError;
      }

      // Step 2: Get public URL with a cache-busting parameter
      const { data } = supabase.storage
        .from('avatars') // Correct bucket name
        .getPublicUrl(filePath, {
            transform: {
                // `updated_at` is a trick to bust the cache.
                // You can use any value that changes when the file is updated.
                // 'tr:updated_at' is not a real transformation, but it makes the URL unique.
                // Supabase Storage will ignore it but it will bypass the cache.
                // For this to work, you may need to enable 'cacheControl' on your bucket to a low value like 'no-cache'
                // or ensure your storage policies are correct.
                // I am adding this as a precaution.
                // The most reliable way is to make sure your state management is correct.
                // A simpler alternative is `new Date().getTime()` as a query param.
                // I will use that for simplicity.
                // `?t=${new Date().getTime()}`
            }
        });

      const avatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      // Step 3: Update admin profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('admins')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (updateError) {
        if (updateError.message.includes('column "avatar_url" does not exist')) {
          throw new Error('Database Error: The "admins" table is missing the "avatar_url" column.');
        }
        if (updateError.message.includes('security policy')) {
            throw new Error(`Database RLS Error: ${updateError.message}. Check the UPDATE policy on the 'admins' table.`);
        }
        throw updateError;
      }

      // Refresh admin data
      await fetchAdminProfile();

      // Log the action
      try {
        await supabase.from('audit_logs').insert({
          admin_id: admin.id,
          action: 'avatar_updated',
          table_name: 'admins',
          record_id: admin.id,
          changes: { avatar_updated: true },
        });
      } catch (auditError) {
        console.warn('Could not log avatar update to audit logs:', auditError);
      }

      setAvatarFile(null);
      setAvatarPreview(null);

    } catch (error) {
      setErrors({ avatar: error instanceof Error ? error.message : 'Failed to upload avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons = {
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      approved: '✅',
      rejected: '❌',
      profile_updated: '👤',
      password_changed: '🔒',
      avatar_updated: '📸',
    };
    return icons[action as keyof typeof icons] || '📝';
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your admin account and view your activity
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="btn-secondary"
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Avatar Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={avatarPreview || admin?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.full_name || admin?.email || 'Admin')}&background=4f46e5&color=fff&size=80`}
                          alt="Avatar preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full hover:bg-indigo-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1">
                        {avatarFile && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{avatarFile.name}</span>
                            <button
                              onClick={handleAvatarUpload}
                              disabled={uploadingAvatar}
                              className="btn-primary text-xs py-1 px-3"
                            >
                              {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                            </button>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          <p>JPG, PNG or GIF. Max size 5MB.</p>
                          {errors.avatar && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-md text-red-800">
                              <p className="font-semibold text-sm">Upload Error:</p>
                              <p className="text-xs mt-1">{errors.avatar}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 input-field"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={admin?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.full_name || admin?.email || 'Admin')}&background=4f46e5&color=fff&size=64`}
                      alt="Profile avatar"
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{admin.full_name || 'No name set'}</h4>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                      <div className="mt-1">{getRoleBadge(admin.role)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{admin.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(admin.updated_at).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Role</dt>
                        <dd className="mt-1 text-sm text-gray-900">{admin.role}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password Change */}
          {isChangingPassword && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="mt-1 input-field"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="mt-1 input-field"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      onClick={() => setIsChangingPassword(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity</p>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.table_name} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Account Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Actions</span>
                  <span className="text-lg font-semibold text-gray-900">{stats.totalActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recent Actions (7 days)</span>
                  <span className="text-lg font-semibold text-indigo-600">{stats.recentActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm text-gray-900">
                    {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => fetchActivityLogs()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  🔄 Refresh Activity
                </button>
                <button
                  onClick={() => fetchStats()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  📊 Update Statistics
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  🔄 Reload Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;