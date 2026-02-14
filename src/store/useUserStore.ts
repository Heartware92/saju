/**
 * 사용자 인증 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, auth } from '../services/supabase';
import { useCreditStore } from './useCreditStore';
import type { AuthUser } from '../types/user';

interface UserState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      /**
       * 앱 초기화 시 인증 상태 확인
       */
      initialize: async () => {
        try {
          set({ loading: true });

          // 현재 세션 확인
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            set({ user: session.user, loading: false });
            // 크레딧 정보 로드
            useCreditStore.getState().fetchBalance();
          } else {
            set({ user: null, loading: false });
          }

          // 인증 상태 변경 리스너 등록
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              set({ user: session.user });
              useCreditStore.getState().fetchBalance();
            } else {
              set({ user: null });
              useCreditStore.getState().reset();
            }
          });
        } catch (error: any) {
          console.error('Error initializing auth:', error);
          set({ error: error.message, loading: false });
        }
      },

      /**
       * 이메일/비밀번호 로그인
       */
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const response = await auth.signInWithEmail(email, password);

          set({ user: response.user, loading: false });

          // 크레딧 정보 로드
          useCreditStore.getState().fetchBalance();
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            error: error.message === 'Invalid login credentials'
              ? '이메일 또는 비밀번호가 올바르지 않습니다'
              : error.message,
            loading: false
          });
          throw error;
        }
      },

      /**
       * 이메일/비밀번호 회원가입
       */
      signup: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const response = await auth.signUpWithEmail(email, password);

          set({ user: response.user || null, loading: false });

          // 회원가입 시 자동으로 1엽전이 Supabase Trigger로 지급됨
          // 크레딧 정보 로드
          setTimeout(() => {
            useCreditStore.getState().fetchBalance();
          }, 1000);
        } catch (error: any) {
          console.error('Signup error:', error);
          set({
            error: error.message === 'User already registered'
              ? '이미 가입된 이메일입니다'
              : error.message,
            loading: false
          });
          throw error;
        }
      },

      /**
       * 로그아웃
       */
      logout: async () => {
        try {
          set({ loading: true, error: null });

          await auth.signOut();

          set({ user: null, loading: false });

          // 크레딧 상태 초기화
          useCreditStore.getState().reset();
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ error: error.message, loading: false });
        }
      },

      /**
       * 비밀번호 재설정 이메일 전송
       */
      resetPassword: async (email: string) => {
        try {
          set({ loading: true, error: null });

          await auth.resetPassword(email);

          set({ loading: false });
        } catch (error: any) {
          console.error('Reset password error:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);
