/**
 * POST /api/payment/refund
 *
 * 주문의 PortOne 결제를 취소(환불)한다.
 * PortOne V2 REST API:
 *   POST https://api.portone.io/payments/{paymentId}/cancel
 *   Body: { reason: string }
 *
 * 환불 정책 — 미사용 크레딧 전액 환불 원칙:
 *  - 지급된 해/달 크레딧이 현재 잔액에 모두 남아 있는 경우에만 자동 환불 허용.
 *  - 일부라도 사용했다면 반려하고 고객센터 문의 유도.
 *
 * Body: { orderId: string, reason?: string }
 * Auth: Authorization: Bearer <supabase-access-token>  (클라이언트가 세션 토큰을 전달)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || '';
const PORTONE_API_BASE = 'https://api.portone.io';

interface RefundRequestBody {
  orderId: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!PORTONE_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'PortOne API secret is not configured.' },
        { status: 500 }
      );
    }

    // 사용자 인증 — Supabase access token 필요
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { success: false, error: '세션이 만료되었습니다.' },
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    const { orderId, reason } = (await req.json()) as RefundRequestBody;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1) 주문 조회 — 반드시 요청자 소유여야 함
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '환불 가능한 주문이 아닙니다.' },
        { status: 400 }
      );
    }

    if (!order.portone_payment_id) {
      return NextResponse.json(
        { success: false, error: '결제 정보가 없어 환불할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 2) 미사용 검증 — 현재 잔액이 지급분 이상이어야 함
    const { data: userCredit } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const sunGranted = order.sun_credit_amount ?? 0;
    const moonGranted = order.moon_credit_amount ?? 0;
    const sunBalance = userCredit?.sun_balance ?? 0;
    const moonBalance = userCredit?.moon_balance ?? 0;

    if (sunBalance < sunGranted || moonBalance < moonGranted) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 사용한 크레딧이 있어 자동 환불이 불가합니다. 고객센터에 문의해 주세요.',
        },
        { status: 400 }
      );
    }

    // 3) PortOne 환불 API 호출
    const cancelRes = await fetch(
      `${PORTONE_API_BASE}/payments/${encodeURIComponent(order.portone_payment_id)}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || '사용자 요청 환불' }),
        cache: 'no-store',
      }
    );

    if (!cancelRes.ok) {
      const txt = await cancelRes.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: 'PortOne 환불 실패', detail: txt.slice(0, 500) },
        { status: 502 }
      );
    }

    // 4) 크레딧 회수 + 주문 상태 업데이트
    const newSun = sunBalance - sunGranted;
    const newMoon = moonBalance - moonGranted;

    await supabaseAdmin
      .from('user_credits')
      .update({
        sun_balance: newSun,
        moon_balance: newMoon,
        total_sun_purchased: Math.max(
          0,
          (userCredit?.total_sun_purchased ?? 0) - sunGranted
        ),
        total_moon_purchased: Math.max(
          0,
          (userCredit?.total_moon_purchased ?? 0) - moonGranted
        ),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await supabaseAdmin
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', orderId);

    // 5) 환불 거래 기록
    const txRows = [];
    if (sunGranted > 0) {
      txRows.push({
        user_id: userId,
        credit_type: 'sun',
        type: 'refund',
        amount: -sunGranted,
        balance_after: newSun,
        reason: `환불: ${order.package_name}`,
        order_id: order.id,
      });
    }
    if (moonGranted > 0) {
      txRows.push({
        user_id: userId,
        credit_type: 'moon',
        type: 'refund',
        amount: -moonGranted,
        balance_after: newMoon,
        reason: `환불: ${order.package_name}`,
        order_id: order.id,
      });
    }
    if (txRows.length > 0) {
      await supabaseAdmin.from('credit_transactions').insert(txRows);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (e: any) {
    console.error('[payment/refund]', e);
    return NextResponse.json(
      { success: false, error: e?.message ?? 'unknown error' },
      { status: 500 }
    );
  }
}
