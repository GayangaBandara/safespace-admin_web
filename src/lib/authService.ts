import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

export class AuthService {
  static async signUpWithEmailPassword(email: string, password: string, username: string): Promise<User> {
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username
        }
      }
    });

    if (signUpError) {
      throw new Error(`Signup failed: ${signUpError.message}`);
    }

    if (!user?.id) {
      throw new Error('No user ID returned from signup');
    }

    const newUser: UserInsert = {
      id: user.id,
      email: user.email!,
      full_name: username,
      status: 'active'
    };

    // Note: Supabase typing issues with strict mode
    // Using any as a workaround for now
    const { data, error: insertError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('users') as any)
      .insert(newUser)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }

    return data;
  }

  static async login(email: string, password: string): Promise<User> {
    const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw new Error(`Login failed: ${signInError.message}`);
    }

    if (!authUser?.id) {
      throw new Error('No user data returned from authentication');
    }

    // Note: Supabase typing issues with strict mode
    // Using any as a workaround for now
    const { data: user, error: userError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('users') as any)
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        throw new Error('User profile not found. Please contact an administrator.');
      }
      throw new Error(`Failed to fetch user profile: ${userError.message}`);
    }

    if (user.status !== 'active') {
      throw new Error('Your account is not active. Please wait for administrator approval.');
    }

    return user;
  }

  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Failed to get session: ${authError.message}`);
    }
    
    if (!session) {
      return null;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select()
      .eq('id', session.user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${userError.message}`);
    }

    return user;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Note: Supabase typing issues with strict mode
    // Using any as a workaround for now
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('users') as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }
}