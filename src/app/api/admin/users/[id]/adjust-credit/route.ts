/**
 * POST /api/admin/users/[id]/adjust-credit
 * Body: { creditType: 'sun' | 'moon', delta: number, reason: string }
 *   delta: +로 지급, -로 차감 (양수·음수 모두 허용)
 *   reason: 필수 사유
 * 효과: user_credits 잔액 갱신 + credit_transactions insert (type='admin_adjust')
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../../_auth';
import { invalidateAll } from '../../../_cache';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: 'id 누락' }, { status: 400 });

  let body: { creditType?: 'sun' | 'moon'; delta?: number; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const creditType = body.creditType;
  const delta = Number(body.delta ?? 0);
  const reason = (body.reason ?? '').trim();

  if (creditType !== 'sun' && creditType !== 'moon') {
    return NextResponse.json({ error: 'creditType은 sun 또는 moon' }, { status: 400 });
  }
  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: 'delta는 0이 아닌 정수' }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: '사유 필수' }, { status: 400 });
  }
  if (Math.abs(delta) > 10_000) {
    return NextResponse.json({ error: 'delta 절댓값은 10,000 이하' }, { status: 400 });
  }

  // 현재 잔액 조회 → 음수 방지
  const { data: current, error: cErr } = await supabaseAdmin
    .from('user_credits')
    .select('sun_balance, moon_balance, total_sun_purchased, total_moon_purchased, total_sun_consumed, total_moon_consumed')
    .eq('user_id', userId)
    .single();
  if (cErr || !current) {
    return NextResponse.json({ error: '크레딧 레코드 없음' }, { status: 404 });
  }

  const balanceField = creditType === 'sun' ? 'sun_balance' : 'moon_balance';
  const currentBalance = current[balanceField] as number;
  const newBalance = currentBalance + delta;
  if (newBalance < 0) {
    return NextResponse.json({
      error: `잔액 부족: 현재 ${currentBalance}, 차감 ${delta} → 결과 ${newBalance}`,
    }, { status: 400 });
  }

  // 잔액 업데이트
  const updatePayload: Record<string, number> = { [balanceField]: newBalance };
  // 관리자 지급은 total_*_purchased 에 누적 (원가/매출과 구분을 위해 선택적)
  // 현재 스키마에서는 잔액만 갱신하고 purchase 로 섞지 않음
  const { error: uErr } = await supabaseAdmin
    .from('user_credits')
    .update(updatePayload)
    .eq('user_id', userId);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  // 거래 기록
  const { error: tErr } = await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    credit_type: creditType,
    type: 'admin_adjust',
    amount: delta,
    balance_after: newBalance,
    reason,
  });
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  // 서버 캐시 무효화
  await invalidateAll();

  return NextResponse.json({
    ok: true,
    userId,
    creditType,
    delta,
    newBalance,
    reason,
  });
}
