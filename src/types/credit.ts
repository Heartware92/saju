/**
 * 크레딧 시스템 관련 타입 정의
 */

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'consume' | 'bonus' | 'refund';
  amount: number;
  balance_after: number;
  reason: string;
  order_id?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  amount: number;
  credit_amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_key?: string;
  portone_payment_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface UserCredit {
  user_id: string;
  balance: number;
  total_purchased: number;
  total_consumed: number;
  created_at: string;
  updated_at: string;
}

export interface SajuRecord {
  id: string;
  user_id: string;
  birth_date: string;
  birth_place?: string;
  gender: 'male' | 'female';
  result_data: any;  // SajuResult JSON
  interpretation_basic?: string;
  interpretation_detailed?: string;
  credit_used: number;
  is_detailed: boolean;
  created_at: string;
}

export interface TarotRecord {
  id: string;
  user_id: string;
  spread_type: string;
  cards: any;  // JSON
  question?: string;
  interpretation?: string;
  credit_used: number;
  created_at: string;
}
