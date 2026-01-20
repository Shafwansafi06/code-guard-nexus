/**
 * Authentication providers utility
 * Handles Google OAuth and Phone authentication via Supabase
 */

import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Google sign-in failed' };
  }
}

/**
 * Sign in with Phone (OTP)
 */
export async function signInWithPhone(phone: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        // Optional: add custom OTP length or validity period
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Phone sign-in failed' };
  }
}

/**
 * Verify Phone OTP
 */
export async function verifyPhoneOTP(phone: string, token: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error: any) {
    return { success: false, error: error.message || 'OTP verification failed' };
  }
}

/**
 * Sign up with Phone
 */
export async function signUpWithPhone(phone: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      phone: phone,
      password: password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error: any) {
    return { success: false, error: error.message || 'Phone sign-up failed' };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session };
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed' };
  }
}
