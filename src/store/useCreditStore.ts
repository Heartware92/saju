/**
 * 크레딧 상태 관리 (Zustand)
 * 해(☀️)/달(🌙) 이중 크레딧 시스템
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { creditDB, auth } from '../services/supabase';
import type { CreditType, CreditTransaction } from '../types/credit';

const STALE_MS = 30_000; // 30초 내 재조회 생략

interface CreditState {
  sunBalance: number;
  moonBalance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;
  lastFetched: number; // timestamp

  fetchBalance: (userId?: string) => Promise<void>;
  fetchTransactions: (userId?: string) => Promise<void>;
  consumeCredit: (creditType: CreditType, amount: number, reason: string) => Promise<boolean>;
  reset: () => void;
}

export const useCreditStore = create<CreditState>()(
  persist(
    (set, get) => ({
      sunBalance: 0,
      moonBalance: 0,
      transactions: [],
      loading: false,
      error: null,
      lastFetched: 0,

      fetchBalance: async (userId?: string) => {
        // stale-time: 30초 내 중복 요청 차단
        if (Date.now() - get().lastFetched < STALE_MS) return;

        try {
          set({ loading: true, error: null });

          // userId가 전달되면 getUser() 네트워크 왕복 생략
          const uid = userId ?? (await auth.getCurrentUser())?.id;
          if (!uid) {
            set({ sunBalance: 0, moonBalance: 0, loading: false });
            return;
          }

          const userCredit = await creditDB.getBalance(uid);
          set({
            sunBalance: userCredit?.sun_balance ?? 0,
            moonBalance: userCredit?.moon_balance ?? 0,
            loading: false,
            lastFetched: Date.now(),
          });
        } catch (error: any) {
          console.error('Error fetching balance:', error);
          set({ error: error.message, loading: false });
        }
      },

      fetchTransactions: async (userId?: string) => {
        try {
          set({ loading: true, error: null });

          const uid = userId ?? (await auth.getCurrentUser())?.id;
          if (!uid) {
            set({ transactions: [], loading: false });
            return;
          }

          const transactions = await creditDB.getTransactions(uid);
          set({ transactions, loading: false });
        } catch (error: any) {
          console.error('Error fetching transactions:', error);
          set({ error: error.message, loading: false });
        }
      },

      consumeCredit: async (creditType: CreditType, amount: number, reason: string): Promise<boolean> => {
        const currentBalance = creditType === 'sun' ? get().sunBalance : get().moonBalance;

        if (currentBalance < amount) {
          const label = creditType === 'sun' ? '해' : '달';
          set({ error: `${label} 크레딧이 부족합니다` });
          return false;
        }

        try {
          set({ loading: true, error: null });
          const user = await auth.getCurrentUser();

          if (!user) throw new Error('로그인이 필요합니다');

          const success = await creditDB.consumeCredit(user.id, creditType, amount, reason);

          if (success) {
            const newBalance = currentBalance - amount;
            set({
              ...(creditType === 'sun' ? { sunBalance: newBalance } : { moonBalance: newBalance }),
              loading: false,
              lastFetched: Date.now(), // 소비 후 캐시 갱신
            });
            get().fetchTransactions(user.id);
          }

          return success;
        } catch (error: any) {
          console.error('Error consuming credit:', error);
          set({ error: error.message, loading: false });
          return false;
        }
      },

      reset: () => {
        set({
          sunBalance: 0,
          moonBalance: 0,
          transactions: [],
          loading: false,
          error: null,
          lastFetched: 0,
        });
      },
    }),
    {
      name: 'credit-storage',
      partialize: (state) => ({
        sunBalance: state.sunBalance,
        moonBalance: state.moonBalance,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
