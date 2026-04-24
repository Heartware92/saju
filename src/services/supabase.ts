/**
 * Supabase 클라이언트 설정 및 헬퍼 함수
 */

import { createClient } from '@supabase/supabase-js';
import type {
  CreditType,
  CreditTransaction,
  Order,
  UserCredit,
  SajuRecord,
  TarotRecord,
  BirthProfile
} from '../types/credit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

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
  },

  /**
   * OAuth 소셜 로그인 (Google / Kakao) — Supabase 네이티브 지원 제공자.
   * 브라우저가 제공자의 인증 페이지로 이동한 뒤, 완료되면
   * `NEXT_PUBLIC_BASE_URL/auth/callback` 으로 돌아와 code 교환이 이뤄진다.
   */
  signInWithProvider: async (provider: 'google' | 'kakao') => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

};

/**
 * 크레딧 관련 DB 함수
 */

export const creditDB = {
  // 사용자 크레딧 잔액 조회 (해/달 모두)
  getBalance: async (userId: string): Promise<UserCredit | null> => {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching balance:', error);
      return null;
    }

    return data;
  },

  // 크레딧 잔액 업데이트 (특정 타입)
  updateBalance: async (userId: string, creditType: CreditType, newBalance: number) => {
    const field = creditType === 'sun' ? 'sun_balance' : 'moon_balance';
    const { error } = await supabase
      .from('user_credits')
      .update({ [field]: newBalance })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // 크레딧 소비 (잔액 확인 + 차감 + 거래 기록)
  consumeCredit: async (userId: string, creditType: CreditType, amount: number, reason: string): Promise<boolean> => {
    const userCredit = await creditDB.getBalance(userId);
    if (!userCredit) return false;

    const currentBalance = creditType === 'sun' ? userCredit.sun_balance : userCredit.moon_balance;
    if (currentBalance < amount) return false;

    const newBalance = currentBalance - amount;
    const balanceField = creditType === 'sun' ? 'sun_balance' : 'moon_balance';
    const consumedField = creditType === 'sun' ? 'total_sun_consumed' : 'total_moon_consumed';

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        [balanceField]: newBalance,
        [consumedField]: (creditType === 'sun' ? userCredit.total_sun_consumed : userCredit.total_moon_consumed) + amount
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    await creditDB.addTransaction({
      user_id: userId,
      credit_type: creditType,
      type: 'consume',
      amount: -amount,
      balance_after: newBalance,
      reason
    });

    return true;
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
  },

  // 특정 타로 기록 조회 (보관함 재생용)
  getRecordById: async (recordId: string): Promise<TarotRecord | null> => {
    const { data, error } = await supabase
      .from('tarot_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Error fetching tarot record:', error);
      return null;
    }
    return data;
  }
};

/**
 * 사주 프로필 관련 DB 함수
 */

export const profileDB = {
  getProfiles: async (userId: string): Promise<BirthProfile[]> => {
    const { data, error } = await supabase
      .from('birth_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    // 에러 시 throw — 호출 측이 catch 해서 로컬 캐시를 유지하도록.
    // 과거엔 []를 반환했으나, 그 경우 스토어가 "빈 목록"으로 오해해
    // localStorage 까지 덮어써서 대표 프로필이 사라진 것처럼 보이는 버그가 있었음.
    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
    return data ?? [];
  },

  createProfile: async (profile: Omit<BirthProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BirthProfile> => {
    const { data, error } = await supabase
      .from('birth_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateProfile: async (id: string, updates: Partial<Omit<BirthProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<BirthProfile> => {
    const { data, error } = await supabase
      .from('birth_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProfile: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('birth_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 대표 프로필 지정 — 사용자의 다른 프로필 is_primary 를 모두 false 로 돌린 뒤
   * 대상만 true 로 세팅. 동시성 위험은 RLS + 단일 유저 사용이라 무시.
   */
  setPrimaryProfile: async (userId: string, profileId: string): Promise<void> => {
    const { error: unsetError } = await supabase
      .from('birth_profiles')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .neq('id', profileId);

    if (unsetError) throw unsetError;

    const { error: setError } = await supabase
      .from('birth_profiles')
      .update({ is_primary: true })
      .eq('id', profileId);

    if (setError) throw setError;
  }
};
