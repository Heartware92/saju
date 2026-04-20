/**
 * GET /api/admin/users?page=1&search=&limit=20
 * 사용자 목록 — 프로필·크레딧·최근 주문 포함
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../_auth';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const search = searchParams.get('search')?.trim() ?? '';
  const from = (page - 1) * PAGE_SIZE;

  // 1. Supabase Auth 사용자 목록 (관리자 API)
  const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage: PAGE_SIZE,
  });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  let users = authList.users;
  if (search) {
    users = users.filter(u =>
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }

  const userIds = users.map(u => u.id);

  // 2. 크레딧, 주문, 프로필 수를 병렬 조회
  const [creditsRes, ordersRes, profilesRes] = await Promise.all([
    supabaseAdmin.from('user_credits').select('user_id, sun_balance, moon_balance, total_sun_purchased, total_moon_purchased').in('user_id', userIds),
    supabaseAdmin.from('orders').select('user_id, status, amount, created_at, package_name').in('user_id', userIds).eq('status', 'completed').order('created_at', { ascending: false }),
    supabaseAdmin.from('birth_profiles').select('user_id', { count: 'exact' }).in('user_id', userIds),
  ]);

  const creditMap = new Map((creditsRes.data ?? []).map(c => [c.user_id, c]));
  const ordersByUser = new Map<string, typeof ordersRes.data>( );
  for (const o of ordersRes.data ?? []) {
    if (!ordersByUser.has(o.user_id)) ordersByUser.set(o.user_id, []);
    ordersByUser.get(o.user_id)!.push(o);
  }
  const profileCountMap = new Map<string, number>();
  for (const p of profilesRes.data ?? []) {
    profileCountMap.set(p.user_id, (profileCountMap.get(p.user_id) ?? 0) + 1);
  }

  const result = users.map(u => {
    const credit = creditMap.get(u.id);
    const orders = ordersByUser.get(u.id) ?? [];
    const lastOrder = orders[0] ?? null;
    return {
      id: u.id,
      email: u.email ?? '',
      provider: u.app_metadata?.provider ?? 'email',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      profileCount: profileCountMap.get(u.id) ?? 0,
      sunBalance: credit?.sun_balance ?? 0,
      moonBalance: credit?.moon_balance ?? 0,
      totalSpent: orders.reduce((s, o) => s + (o.amount ?? 0), 0),
      orderCount: orders.length,
      lastOrderAt: lastOrder?.created_at ?? null,
      lastPackage: lastOrder?.package_name ?? null,
    };
  });

  return NextResponse.json({
    users: result,
    total: authList.total ?? users.length,
    page,
    pageSize: PAGE_SIZE,
  });
}
