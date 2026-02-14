/**
 * 크레딧 상태 관리 (Zustand)
 */

import { create } from 'zustand';
import { creditDB, auth } from '../services/supabase';
import type { CreditTransaction } from '../types/credit';

interface CreditState {
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  consumeCredit: (amount: number, reason: string) => Promise<boolean>;
  addCredit: (amount: number, packageId: string, orderId?: string) => Promise<void>;
  reset: () => void;
}

export const useCreditStore = create<CreditState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,

  /**
   * 크레딧 잔액 조회
   */
  fetchBalance: async () => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        set({ balance: 0, loading: false });
        return;
      }

      const balance = await creditDB.getBalance(user.id);
      set({ balance, loading: false });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * 크레딧 거래 내역 조회
   */
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

  /**
   * 크레딧 소비
   * @param amount 소비할 엽전 개수
   * @param reason 사용 사유
   * @returns 성공 여부
   */
  consumeCredit: async (amount: number, reason: string): Promise<boolean> => {
    const currentBalance = get().balance;

    // 잔액 부족 체크
    if (currentBalance < amount) {
      set({ error: '엽전이 부족합니다' });
      return false;
    }

    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        throw new Error('로그인이 필요합니다');
      }

      const newBalance = currentBalance - amount;

      // DB 업데이트
      await creditDB.updateBalance(user.id, newBalance);

      // 거래 기록 추가
      await creditDB.addTransaction({
        user_id: user.id,
        type: 'consume',
        amount: -amount,
        balance_after: newBalance,
        reason
      });

      // 상태 업데이트
      set({ balance: newBalance, loading: false });

      // 거래 내역 새로고침
      get().fetchTransactions();

      return true;
    } catch (error: any) {
      console.error('Error consuming credit:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  /**
   * 크레딧 추가 (구매 또는 보너스)
   * @param amount 추가할 엽전 개수
   * @param packageId 패키지 ID
   * @param orderId 주문 ID (선택)
   */
  addCredit: async (amount: number, packageId: string, orderId?: string) => {
    try {
      set({ loading: true, error: null });
      const user = await auth.getCurrentUser();

      if (!user) {
        throw new Error('로그인이 필요합니다');
      }

      const currentBalance = get().balance;
      const newBalance = currentBalance + amount;

      // DB 업데이트
      await creditDB.updateBalance(user.id, newBalance);

      // 거래 기록 추가
      await creditDB.addTransaction({
        user_id: user.id,
        type: 'purchase',
        amount: amount,
        balance_after: newBalance,
        reason: `${packageId} 패키지 구매`,
        order_id: orderId
      });

      // 상태 업데이트
      set({ balance: newBalance, loading: false });

      // 거래 내역 새로고침
      get().fetchTransactions();
    } catch (error: any) {
      console.error('Error adding credit:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * 상태 초기화 (로그아웃 시)
   */
  reset: () => {
    set({
      balance: 0,
      transactions: [],
      loading: false,
      error: null
    });
  }
}));
