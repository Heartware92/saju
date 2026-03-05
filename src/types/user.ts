/**
 * 사용자 관련 타입 정의
 */

import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email?: string;
  created_at?: string;
  last_login?: string;
}

export type AuthUser = SupabaseUser;

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
}
