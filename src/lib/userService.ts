import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserError extends Error {
  public code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'UserError';
    this.code = code;
  }
}

export class UserService {
  static async checkUsersTable(): Promise<boolean> {
    try {
      await supabase
        .from('users')
        .select('id')
        .limit(1);

      return true;
    } catch (error) {
      // If error is about relation not existing, table doesn't exist
      if (error instanceof Error && error.message.includes('relation "public.users" does not exist')) {
        return false;
      }
      return false;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    // Check if users table exists first
    const tableExists = await this.checkUsersTable();
    if (!tableExists) {
      throw new Error('Users table does not exist. Please run the database migration to create the users table. Migration file: supabase/migrations/00008_create_users_table.sql');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        throw new Error('Users table does not exist. Please run the database migration: supabase/migrations/00008_create_users_table.sql');
      }
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  static async createUser(userData: UserInsert): Promise<User> {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('users') as any)
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new UserError(`Failed to create user: ${error.message}`, error.code);
    }

    return data;
  }

  static async updateUser(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('users') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new UserError(`Failed to update user: ${error.message}`, error.code);
    }

    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new UserError(`Failed to delete user: ${error.message}`, error.code);
    }
  }

  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    recentRegistrations: number;
  }> {
    // Check if users table exists first
    const tableExists = await this.checkUsersTable();
    if (!tableExists) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        recentRegistrations: 0
      };
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('status, created_at');

    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          suspended: 0,
          recentRegistrations: 0
        };
      }
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    const typedUsers = users as Array<{ status: string; created_at: string }> | null;

    const stats = {
      total: typedUsers?.length || 0,
      active: typedUsers?.filter(u => u.status === 'active').length || 0,
      inactive: typedUsers?.filter(u => u.status === 'inactive').length || 0,
      suspended: typedUsers?.filter(u => u.status === 'suspended').length || 0,
      recentRegistrations: typedUsers?.filter(u => {
        const createdDate = new Date(u.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length || 0
    };

    return stats;
  }

  static async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<User> {
    return this.updateUser(id, { status });
  }

  static async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data || [];
  }
}