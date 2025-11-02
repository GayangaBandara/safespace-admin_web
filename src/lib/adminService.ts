import { supabase, supabaseAdmin } from './supabase';

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSignupData {
  email: string;
  password: string;
  fullName: string;
}

export class AdminError extends Error {
  public code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
  }
}

export class AdminService {
  static async createAdmin(adminData: {
    id: string;
    email: string;
    full_name: string;
    role: 'pending' | 'admin' | 'moderator' | 'superadmin';
  }): Promise<Admin> {
    try {
      console.log('Creating admin record with data:', adminData);

      // Create the admin record using supabaseAdmin to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('admins')
        .insert({
          id: adminData.id,
          email: adminData.email,
          full_name: adminData.full_name,
          role: adminData.role
        })
        .select()
        .single();

      console.log('Admin record creation result:', { data, error });

      if (error) {
        if (error.message.includes('duplicate key')) {
          throw new AdminError('An admin with this email already exists');
        } else if (error.message.includes('violates foreign key constraint')) {
          throw new AdminError('User must exist in auth.users before creating admin');
        } else {
          throw new AdminError(`Failed to create admin: ${error.message}`, error.code);
        }
      }

      return data;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to create admin');
    }
  }

  static async signup(email: string, password: string, fullName: string, role: 'admin' | 'moderator' | 'superadmin' = 'admin'): Promise<Admin> {
    let authUserId: string | null = null;
    
    try {
      console.log('Starting admin signup process...', { email, fullName, role });

      // Step 1: Create user in auth.users with direct insertion approach
      console.log('Creating auth user with direct insertion...');
      
      // Create a temporary user first to get the ID
      const tempPassword = password;
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role
        }
      });

      console.log('Auth creation result:', { authData, authError });

      if (authError) {
        console.error('Auth creation error:', authError);
        
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          throw new AdminError('An account with this email already exists');
        } else if (authError.message.includes('password')) {
          throw new AdminError('Password must be at least 6 characters long');
        } else if (authError.message.includes('weak_password')) {
          throw new AdminError('Password is too weak. Please use a stronger password.');
        } else {
          throw new AdminError(`Failed to create user account: ${authError.message}`);
        }
      }

      const user = authData.user;
      if (!user?.id) {
        throw new AdminError('No user ID returned from authentication service');
      }

      authUserId = user.id;
      console.log('Auth user created successfully:', user.id);

      // Step 2: Wait a moment for the database triggers
      console.log('Waiting for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Create admin record
      console.log('Creating admin record...');
      const admin = await this.createAdmin({
        id: user.id,
        email,
        full_name: fullName,
        role: role as 'pending' | 'admin' | 'moderator' | 'superadmin'
      });

      console.log('Admin record created successfully:', admin.id);

      // Step 4: Update user_roles table
      try {
        console.log('Updating user role...');
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', user.id);

        if (roleError) {
          console.warn('User role update warning:', roleError);
        } else {
          console.log('User role updated successfully');
        }
      } catch (roleError) {
        console.warn('User role update exception (non-critical):', roleError);
      }

      console.log('Admin signup process completed successfully');
      return admin;
      
    } catch (signupError) {
      console.error('Admin signup process failed:', {
        error: signupError,
        message: signupError instanceof Error ? signupError.message : 'Unknown error',
        stack: signupError instanceof Error ? signupError.stack : undefined
      });
      
      // Cleanup auth user if we created one but admin creation failed
      if (authUserId) {
        try {
          console.log('Cleaning up auth user due to admin creation failure:', authUserId);
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('Auth user cleanup completed');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }
      
      if (signupError instanceof AdminError) {
        throw signupError;
      }
      
      // Provide specific error message
      const errorMessage = signupError instanceof Error ? signupError.message : 'Unknown error occurred';
      throw new AdminError(`Database error creating new user: ${errorMessage}`);
    }
  }

  static async getAllAdmins(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new AdminError(`Failed to fetch admins: ${error.message}`, error.code);
      }

      return data || [];
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to fetch admins');
    }
  }

  static async getAdminById(id: string): Promise<Admin | null> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw new AdminError(`Failed to fetch admin: ${error.message}`, error.code);
      }

      return data;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to fetch admin');
    }
  }

  static async updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin> {
    try {
      // Update admin record
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (adminError) {
        throw new AdminError(`Failed to update admin: ${adminError.message}`, adminError.code);
      }

      // Update user role if role changed
      if (updates.role) {
        if (updates.role === 'pending') {
          // Remove admin role from user_roles
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', id);
        } else {
          // Update user role to 'admin' for all non-pending roles
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: roleError } = await (supabase as any)
            .from('user_roles')
            .upsert({
              user_id: id,
              role: 'admin' // All admins get 'admin' role in user_roles
            });

          if (roleError) {
            console.warn('Could not update user role:', roleError);
          }
        }
      }

      return admin;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to update admin');
    }
  }

  static async deleteAdmin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AdminError(`Failed to delete admin: ${error.message}`, error.code);
      }

      // Remove from user_roles table as well
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to delete admin');
    }
  }

  static async approveAdmin(
    adminId: string,
    approve: boolean,
    approverId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Use the RPC function if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('approve_admin', {
        admin_id: adminId,
        approve,
        approver_id: approverId
      });

      if (error) {
        throw new AdminError(`Failed to approve admin: ${error.message}`, error.code);
      }

      return data || { success: true, message: approve ? 'Admin approved successfully' : 'Admin rejected successfully' };
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to approve/reject admin');
    }
  }

  static async login(email: string, password: string): Promise<Admin> {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new AdminError(`Login failed: ${signInError.message}`);
      }

      // Get the admin profile
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError) {
        throw new AdminError(`Failed to fetch admin profile: ${adminError.message}`);
      }

      if (admin.role === 'pending') {
        throw new AdminError('Your account is pending approval');
      }

      return admin;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Login failed');
    }
  }

  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new AdminError(`Logout failed: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  static async getCurrentAdmin(): Promise<Admin | null> {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new AdminError(`Failed to get session: ${authError.message}`);
      }
      
      if (!session) {
        return null;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select()
        .eq('id', session.user.id)
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          return null;
        }
        throw new AdminError(`Failed to fetch admin profile: ${adminError.message}`);
      }

      return admin;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError(error instanceof Error ? error.message : 'Failed to get current admin');
    }
  }
}