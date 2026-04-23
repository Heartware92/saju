/**
 * GET /api/admin/users/[id]
 * 회원 1명 상세 — 기본정보 + 모든 프로필 + 주문 전체 + 사주/타로 기록 최근 N + 크레딧 거래 내역 최근 N
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../_auth';
import { bucketizeAge, VIP_THRESHOLD_WON } from '@/constants/adminLabels';

const RECORDS_LIMIT = 100;
const TRANSACTIONS_LIMIT = 100;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  // auth.user — getUserById
  const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(id);
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }
  const user = userRes.user;

  const [profilesRes, creditRes, ordersRes, sajuRes, tarotRes, txRes] = await Promise.all([
    supabaseAdmin.from('birth_profiles')
      .select('*')
      .eq('user_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('user_credits').select('*').eq('user_id', id).single(),
    supabaseAdmin.from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('saju_records')
      .select('id, category, gender, birth_date, birth_time, birth_place, calendar_type, credit_type, credit_used, is_detailed, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(RECORDS_LIMIT),
    supabaseAdmin.from('tarot_records')
      .select('id, spread_type, question, credit_type, credit_used, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(RECORDS_LIMIT),
    supabaseAdmin.from('credit_transactions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(TRANSACTIONS_LIMIT),
  ]);

  const profiles = profilesRes.data ?? [];
  const primary = profiles.find(p => p.is_primary) ?? profiles[0] ?? null;
  const orders = ordersRes.data ?? [];
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSpent = completedOrders.reduce((s, o) => s + (o.amount ?? 0), 0);

  // 카테고리별 집계
  const sajuByCategory: Record<string, number> = {};
  for (const r of sajuRes.data ?? []) {
    sajuByCategory[r.category ?? 'unknown'] = (sajuByCategory[r.category ?? 'unknown'] ?? 0) + 1;
  }
  const tarotBySpread: Record<string, number> = {};
  for (const r of tarotRes.data ?? []) {
    tarotBySpread[r.spread_type ?? 'unknown'] = (tarotBySpread[r.spread_type ?? 'unknown'] ?? 0) + 1;
  }

  // 나이 계산
  let age: number | null = null;
  if (primary?.birth_date) {
    const [y, m, d] = (primary.birth_date as string).split('-').map(Number);
    if (y && m && d) {
      const nowDate = new Date();
      age = nowDate.getFullYear() - y;
      const mm = nowDate.getMonth() + 1;
      const dd = nowDate.getDate();
      if (mm < m || (mm === m && dd < d)) age -= 1;
      if (age < 0 || age > 130) age = null;
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? '',
      provider: user.app_metadata?.provider ?? 'email',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at ?? null,
      emailConfirmed: !!user.email_confirmed_at,
      phone: user.phone ?? null,
      bannedUntil: (user as any).banned_until ?? null,
      adminNote: (user.user_metadata?.admin_note as string | undefined) ?? '',
    },
    primary: primary ? {
      name: primary.name,
      gender: primary.gender,
      birthDate: primary.birth_date,
      birthTime: primary.birth_time,
      birthPlace: primary.birth_place,
      calendarType: primary.calendar_type,
      age,
      ageBucket: bucketizeAge(primary.birth_date),
    } : null,
    profiles,
    credit: creditRes.data ?? null,
    orders,
    sajuRecords: sajuRes.data ?? [],
    tarotRecords: tarotRes.data ?? [],
    transactions: txRes.data ?? [],
    aggregates: {
      totalSpent,
      orderCount: completedOrders.length,
      refundCount: orders.filter(o => o.status === 'refunded').length,
      isVip: totalSpent >= VIP_THRESHOLD_WON,
      sajuTotal: (sajuRes.data ?? []).length,
      tarotTotal: (tarotRes.data ?? []).length,
      sajuByCategory,
      tarotBySpread,
    },
  }, { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' } });
}
