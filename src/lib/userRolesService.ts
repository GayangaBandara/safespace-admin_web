import { supabase } from './supabase';
import type { UserRole } from '../types/supabase';

export interface UserRoleDisplay {
  id: string;
  user_id: string;
  role: 'patient' | 'doctor' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export class UserRolesError extends Error {
  public code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'UserRolesError';
    this.code = code;
  }
}

export class UserRolesService {
  static async getAllUserRoles(): Promise<UserRoleDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.user_roles" does not exist')) {
          throw new Error('user_roles table does not exist. Please run the database migration: supabase/migrations/00009_create_user_roles_table.sql');
        }
        throw new UserRolesError(`Failed to fetch user roles: ${error.message}`, error.code);
      }

      return (data || []) as UserRoleDisplay[];
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to fetch user roles');
    }
  }

  static async getAllUserRolesWithPagination(page: number = 1, limit: number = 10): Promise<{
    data: UserRoleDisplay[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      // Get total count first
      const { count, error: countError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new UserRolesError(`Failed to count user roles: ${countError.message}`, countError.code);
      }

      // Calculate pagination
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch data with pagination
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new UserRolesError(`Failed to fetch user roles: ${error.message}`, error.code);
      }

      return {
        data: (data || []) as UserRoleDisplay[],
        total,
        totalPages,
        currentPage: page
      };
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to fetch user roles');
    }
  }

  static async updateUserRole(userId: string, role: UserRole['role']): Promise<UserRoleDisplay> {
    try {
      // Check if user_role record exists for this user
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing record
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw new UserRolesError(`Failed to update user role: ${error.message}`, error.code);
        }

        return data as UserRoleDisplay;
      } else {
        // Create new record using the INSERT format you provided
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw new UserRolesError(`Failed to create user role: ${error.message}`, error.code);
        }

        return data as UserRoleDisplay;
      }
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to update user role');
    }
  }

  static async getUserRole(userId: string): Promise<UserRoleDisplay | null> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw new UserRolesError(`Failed to fetch user role: ${error.message}`, error.code);
      }

      return data as UserRoleDisplay;
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to fetch user role');
    }
  }

  static async deleteUserRole(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new UserRolesError(`Failed to delete user role: ${error.message}`, error.code);
      }
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to delete user role');
    }
  }

  static async createUserRole(userId: string, role: UserRole['role']): Promise<UserRoleDisplay> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new UserRolesError(`Failed to create user role: ${error.message}`, error.code);
      }

      return data as UserRoleDisplay;
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to create user role');
    }
  }

  static async getRoleStats(): Promise<{
    total: number;
    patients: number;
    doctors: number;
    admins: number;
    superadmins: number;
  }> {
    try {
      // Get all user roles for statistics
      const userRoles = await this.getAllUserRoles();
      
      const stats = {
        total: userRoles.length,
        patients: userRoles.filter(u => u.role === 'patient').length,
        doctors: userRoles.filter(u => u.role === 'doctor').length,
        admins: userRoles.filter(u => u.role === 'admin').length,
        superadmins: userRoles.filter(u => u.role === 'superadmin').length
      };

      return stats;
    } catch (error) {
      // If user_roles table doesn't exist, return empty stats
      if (error instanceof UserRolesError && error.message.includes('does not exist')) {
        return {
          total: 0,
          patients: 0,
          doctors: 0,
          admins: 0,
          superadmins: 0
        };
      }
      throw error;
    }
  }

  // Helper method to check if current user is admin
  static async checkCurrentUserIsAdmin(): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return false;
      }

      // Check if user has admin role in user_roles table
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  // Search user roles by user_id or role
  static async searchUserRoles(query: string): Promise<UserRoleDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .or(`user_id.ilike.%${query}%,role.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new UserRolesError(`Failed to search user roles: ${error.message}`, error.code);
      }

      return (data || []) as UserRoleDisplay[];
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to search user roles');
    }
  }
}