import { supabase } from './supabase';

export async function clearAuthData() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear all local storage keys related to Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('safespace-admin') ||
        key.includes('auth')
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove the collected keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove key: ${key}`, e);
      }
    });

    // Clear session storage as well
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear session storage', e);
    }

    // Attempt to clear cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });

    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}