import { supabase } from './supabase';
import type { UserRole, User } from '../types/supabase';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  user_role: UserRole | null;
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
  static async getAllUsersWithRoles(): Promise<UserWithRole[]> {
    try {
      // Get all user_roles first
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) {
        if (rolesError.message.includes('relation "public.user_roles" does not exist')) {
          throw new Error('user_roles table does not exist. Please run the database migration: supabase/migrations/00009_create_user_roles_table.sql');
        }
        throw new UserRolesError(`Failed to fetch user roles: ${rolesError.message}`, rolesError.code);
      }

      // Get all users data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        if (usersError.message.includes('relation "public.users" does not exist')) {
          throw new Error('users table does not exist. Please run the database migration: supabase/migrations/00008_create_users_table.sql');
        }
        throw new UserRolesError(`Failed to fetch users: ${usersError.message}`, usersError.code);
      }

      // Create a map for efficient lookup
      const usersMap = new Map((usersData || []).map((user: User) => [user.id, user]));
      
      // Combine user_roles with user data
      const results: UserWithRole[] = [];
      
      // Add users with roles
      for (const role of userRolesData || []) {
        // Handle null user_id
        if (!role.user_id) {
          continue;
        }
        
        const user = usersMap.get(role.user_id);
        
        if (user) {
          results.push({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            status: (user.status || 'active') as 'active' | 'inactive' | 'suspended',
            created_at: user.created_at,
            user_role: {
              id: role.id,
              user_id: role.user_id,
              role: role.role,
              created_at: role.created_at || '',
              updated_at: role.updated_at || ''
            }
          });
          // Remove from map to avoid duplicates
          usersMap.delete(role.user_id);
        }
      }

      // Add users without roles
      for (const [, user] of usersMap) {
        results.push({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          status: (user.status || 'active') as 'active' | 'inactive' | 'suspended',
          created_at: user.created_at,
          user_role: null
        });
      }

      // Sort by created_at descending
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to fetch users with roles');
    }
  }

  static async getAllUserRoles(): Promise<UserRole[]> {
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

      return (data || []) as UserRole[];
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to fetch user roles');
    }
  }

  static async updateUserRole(userId: string, role: UserRole['role']): Promise<UserRole> {
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

        return data as UserRole;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();

        if (error) {
          throw new UserRolesError(`Failed to create user role: ${error.message}`, error.code);
        }

        return data as UserRole;
      }
    } catch (error) {
      if (error instanceof UserRolesError) {
        throw error;
      }
      throw new UserRolesError(error instanceof Error ? error.message : 'Failed to update user role');
    }
  }

  static async getUserRole(userId: string): Promise<UserRole | null> {
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

      return data as UserRole;
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

  static async getRoleStats(): Promise<{
    total: number;
    patients: number;
    doctors: number;
    admins: number;
    usersWithoutRoles: number;
  }> {
    try {
      // Get all users with their roles
      const usersWithRoles = await this.getAllUsersWithRoles();
      
      const stats = {
        total: usersWithRoles.length,
        patients: usersWithRoles.filter(u => u.user_role?.role === 'patient').length,
        doctors: usersWithRoles.filter(u => u.user_role?.role === 'doctor').length,
        admins: usersWithRoles.filter(u => u.user_role?.role === 'admin').length,
        usersWithoutRoles: usersWithRoles.filter(u => !u.user_role).length
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
          usersWithoutRoles: 0
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
}