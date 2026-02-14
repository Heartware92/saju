/**
 * 포트원(PortOne) 결제 통합
 */

import * as PortOne from '@portone/browser-sdk/v2';
import { orderDB, auth } from './supabase';
import { useCreditStore } from '../store/useCreditStore';
import { getPackageById } from '../constants/pricing';
import type { Order } from '../types/credit';

const PORTONE_STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173';

if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
  console.warn('PortOne credentials are not set. Payment will not work.');
}

export interface PaymentRequest {
  packageId: string;
  amount: number;
  creditAmount: number;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  message?: string;
}

/**
 * 포트원 결제 처리
 * @param request 결제 요청 정보
 * @returns 결제 결과
 */
export const processPayment = async (
  request: PaymentRequest
): Promise<PaymentResult> => {
  try {
    // 1. 현재 로그인한 사용자 확인
    const user = await auth.getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'LOGIN_REQUIRED',
        message: '로그인이 필요합니다'
      };
    }

    // 2. 패키지 정보 조회
    const packageInfo = getPackageById(request.packageId);
    if (!packageInfo) {
      return {
        success: false,
        error: 'INVALID_PACKAGE',
        message: '올바르지 않은 패키지입니다'
      };
    }

    // 3. 주문 생성 (Supabase)
    const orderData: Omit<Order, 'id' | 'created_at'> = {
      user_id: user.id,
      package_id: request.packageId,
      package_name: packageInfo.name,
      amount: request.amount,
      credit_amount: request.creditAmount,
      status: 'pending'
    };

    const order = await orderDB.createOrder(orderData);

    // 4. 포트원 결제창 호출
    const paymentId = `${order.id}-${Date.now()}`;

    const response = await PortOne.requestPayment({
      storeId: PORTONE_STORE_ID,
      channelKey: PORTONE_CHANNEL_KEY,
      paymentId: paymentId,
      orderName: `엽전 ${request.creditAmount}개 (${packageInfo.name})`,
      totalAmount: request.amount,
      currency: 'KRW',
      payMethod: 'CARD',
      redirectUrl: `${BASE_URL}/payment/callback`,
      // 고객 정보
      customer: {
        email: user.email || undefined,
      },
      // 추가 데이터
      customData: {
        orderId: order.id,
        packageId: request.packageId,
        userId: user.id
      }
    });

    // 5. 결제 결과 처리
    if (response?.code !== undefined) {
      // 결제 실패
      await orderDB.updateOrderStatus(order.id, 'failed');

      return {
        success: false,
        error: response.code,
        message: response.message || '결제에 실패했습니다'
      };
    }

    // 6. 결제 성공
    // 주문 상태 업데이트
    await orderDB.updateOrderStatus(
      order.id,
      'completed',
      response?.paymentId,
      (response as any)?.method
    );

    // 7. 크레딧 추가
    await useCreditStore.getState().addCredit(
      request.creditAmount,
      request.packageId,
      order.id
    );

    return {
      success: true,
      orderId: order.id,
      message: '결제가 완료되었습니다'
    };

  } catch (error: any) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: 'PAYMENT_ERROR',
      message: error.message || '결제 처리 중 오류가 발생했습니다'
    };
  }
};

/**
 * 결제 콜백 처리 (리다이렉트 방식용)
 * @param paymentId 결제 ID
 */
export const handlePaymentCallback = async (paymentId: string) => {
  try {
    // 포트원에서 결제 정보 조회
    // 실제 운영 환경에서는 서버에서 검증 필요
    console.log('Payment callback received:', paymentId);

    // TODO: 서버에서 결제 검증 후 크레딧 지급

  } catch (error) {
    console.error('Payment callback error:', error);
  }
};

/**
 * 환불 요청
 * @param orderId 주문 ID
 */
export const requestRefund = async (orderId: string): Promise<PaymentResult> => {
  try {
    // TODO: 포트원 환불 API 호출
    // 실제 구현 시 서버에서 처리 권장

    await orderDB.updateOrderStatus(orderId, 'refunded');

    return {
      success: true,
      message: '환불이 요청되었습니다'
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'REFUND_ERROR',
      message: error.message || '환불 처리 중 오류가 발생했습니다'
    };
  }
};
