/**
 * Supabase 클라이언트 설정 및 헬퍼 함수
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CreditTransaction,
  Order,
  SajuRecord,
  TarotRecord
} from '../types/credit';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 인증 관련 헬퍼 함수
 */

export const auth = {
  // 현재 로그인한 사용자 가져오기
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 이메일/비밀번호 로그인
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // 이메일/비밀번호 회원가입
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 비밀번호 재설정 이메일 전송
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
};

/**
 * 크레딧 관련 DB 함수
 */

export const creditDB = {
  // 사용자 크레딧 잔액 조회
  getBalance: async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
    return data?.balance ?? 0;
  },

  // 크레딧 잔액 업데이트
  updateBalance: async (userId: string, newBalance: number) => {
    const { error } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // 크레딧 거래 기록 추가
  addTransaction: async (transaction: Omit<CreditTransaction, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 크레딧 거래 내역 조회
  getTransactions: async (userId: string, limit = 50): Promise<CreditTransaction[]> => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data ?? [];
  }
};

/**
 * 주문 관련 DB 함수
 */

export const orderDB = {
  // 주문 생성
  createOrder: async (order: Omit<Order, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 주문 상태 업데이트
  updateOrderStatus: async (
    orderId: string,
    status: Order['status'],
    paymentKey?: string,
    paymentMethod?: string
  ) => {
    const updates: any = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    if (paymentKey) {
      updates.payment_key = paymentKey;
    }
    if (paymentMethod) {
      updates.payment_method = paymentMethod;
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) throw error;
  },

  // 주문 내역 조회
  getOrders: async (userId: string, limit = 50): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    return data ?? [];
  }
};

/**
 * 사주 기록 관련 DB 함수
 */

export const sajuDB = {
  // 사주 기록 저장
  saveRecord: async (record: Omit<SajuRecord, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('saju_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 사주 기록 조회
  getRecords: async (userId: string, limit = 50): Promise<SajuRecord[]> => {
    const { data, error } = await supabase
      .from('saju_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching saju records:', error);
      return [];
    }
    return data ?? [];
  },

  // 특정 사주 기록 조회
  getRecordById: async (recordId: string): Promise<SajuRecord | null> => {
    const { data, error } = await supabase
      .from('saju_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Error fetching saju record:', error);
      return null;
    }
    return data;
  }
};

/**
 * 타로 기록 관련 DB 함수
 */

export const tarotDB = {
  // 타로 기록 저장
  saveRecord: async (record: Omit<TarotRecord, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('tarot_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 타로 기록 조회
  getRecords: async (userId: string, limit = 50): Promise<TarotRecord[]> => {
    const { data, error } = await supabase
      .from('tarot_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching tarot records:', error);
      return [];
    }
    return data ?? [];
  }
};
