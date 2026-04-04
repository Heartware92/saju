/**
 * 크레딧 상태 관리 (Zustand)
 * 해(☀️)/달(🌙) 이중 크레딧 시스템
 */

import { create } from 'zustand';
import { creditDB, auth } from '../services/supabase';
import type { CreditType, CreditTransaction } from '../types/credit';

interface CreditState {
  sunBalance: number;
  moonBalance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  consumeCredit: (creditType: CreditType, amount: number, reason: string) => Promise<boolean>;
  reset: () => void;
}

export const useCreditStore = create<CreditState>((set, get) => ({
  sunBalance: 0,
  moonBalance: 0,
  transactions: [],
  loading: false,
  error: null,

  fetchBalance: async () => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        set({ sunBalance: 0, moonBalance: 0, loading: false });
        return;
      }

      const userCredit = await creditDB.getBalance(user.id);
      set({
        sunBalance: userCredit?.sun_balance ?? 0,
        moonBalance: userCredit?.moon_balance ?? 0,
        loading: false
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        set({ transactions: [], loading: false });
        return;
      }

      const transactions = await creditDB.getTransactions(user.id);
      set({ transactions, loading: false });
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      set({ error: error.message, loading: false });
    }
  },

  consumeCredit: async (creditType: CreditType, amount: number, reason: string): Promise<boolean> => {
    const currentBalance = creditType === 'sun' ? get().sunBalance : get().moonBalance;

    if (currentBalance < amount) {
      const label = creditType === 'sun' ? '☀️ 해' : '🌙 달';
      set({ error: `${label} 크레딧이 부족합니다` });
      return false;
    }

    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        throw new Error('로그인이 필요합니다');
      }

      const success = await creditDB.consumeCredit(user.id, creditType, amount, reason);

      if (success) {
        const newBalance = currentBalance - amount;
        if (creditType === 'sun') {
          set({ sunBalance: newBalance, loading: false });
        } else {
          set({ moonBalance: newBalance, loading: false });
        }
        get().fetchTransactions();
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
      error: null
    });
  }
}));
