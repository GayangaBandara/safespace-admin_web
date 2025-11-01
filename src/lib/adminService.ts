import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type Admin = Database['public']['Tables']['admins']['Row'];
type AdminInsert = Database['public']['Tables']['admins']['Insert'];

export class AdminError extends Error {
  public code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
  }
}

export interface AdminSignupData {
  email: string;
  password: string;
  fullName: string;
}

export class AdminService {
  static async createAdmin(adminData: AdminInsert): Promise<Admin> {
    // Note: Supabase typing issues with strict mode
    // Using any as a workaround for now
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('admins') as any)
      .insert(adminData)
      .select()
      .single();

    if (error) {
      throw new AdminError(`Failed to create admin: ${error.message}`, error.code);
    }

    return data;
  }

  static async signup(email: string, password: string, fullName: string, role: 'pending' | 'moderator' | 'superadmin' = 'pending'): Promise<Admin> {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      throw new AdminError(`Signup failed: ${signUpError.message}`);
    }

    if (!user?.id) {
      throw new AdminError('No user ID returned from signup');
    }

    return this.createAdmin({
      id: user.id,
      email,
      full_name: fullName,
      role
    });
  }

  static async getAllAdmins(): Promise<Admin[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch admins: ${error.message}`);
    }

    return data || [];
  }

  static async getAdminById(id: string): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch admin: ${error.message}`);
    }

    return data;
  }

  // Note: updateAdmin method has type issues with Supabase client
  // This is a known issue with strict typing in Supabase v2
  // For now, we'll comment it out or use a workaround
  // static async updateAdmin(id: string, updates: Record<string, any>): Promise<Admin> {
  //   const { data, error } = await supabase
  //     .from('admins')
  //     .update(updates as any)
  //     .eq('id', id)
  //     .select()
  //     .single();

  //   if (error) {
  //     throw new Error(`Failed to update admin: ${error.message}`);
  //   }

  //   return data;
  // }

  static async deleteAdmin(id: string): Promise<void> {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete admin: ${error.message}`);
    }
  }

  static async approveAdmin(
    adminId: string,
    approve: boolean,
    approverId: string
  ): Promise<{ success: boolean; message: string }> {
    // Note: Supabase RPC typing issues with strict mode
    // Using any as a workaround for now
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('approve_admin', {
      admin_id: adminId,
      approve,
      approver_id: approverId
    });

    if (error) {
      throw new AdminError(`Failed to approve admin: ${error.message}`, error.code);
    }

    return data;
  }

  static async login(email: string, password: string): Promise<Admin> {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new AdminError(`Login failed: ${signInError.message}`);
    }

    // Note: Supabase typing issues with strict mode
    // Using any as a workaround for now
    const { data: admin, error: adminError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('admins') as any)
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
  }

  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AdminError(`Logout failed: ${error.message}`);
    }
  }

  static async getCurrentAdmin(): Promise<Admin | null> {
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
  }
}