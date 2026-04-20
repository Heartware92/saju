/**
 * GET /api/admin/records?page=1&type=saju|tarot&category=
 * 서비스 이용 기록 (사주 분석 + 타로 분석)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../_auth';

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const type = searchParams.get('type') ?? 'saju';
  const category = searchParams.get('category') ?? '';
  const from = (page - 1) * PAGE_SIZE;

  let data: any[] = [];
  let count = 0;

  if (type === 'tarot') {
    let q = supabaseAdmin
      .from('tarot_records')
      .select('id, user_id, spread_type, credit_type, credit_used, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (category) q = q.eq('spread_type', category);
    const res = await q;
    data = res.data ?? [];
    count = res.count ?? 0;
  } else {
    let q = supabaseAdmin
      .from('saju_records')
      .select('id, user_id, category, gender, calendar_type, credit_type, credit_used, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (category) q = q.eq('category', category);
    const res = await q;
    data = res.data ?? [];
    count = res.count ?? 0;
  }

  // 이메일 매핑
  const userIds = [...new Set(data.map(r => r.user_id))];
  let emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    emailMap = new Map((authUsers?.users ?? []).map(u => [u.id, u.email ?? '']));
  }

  // 카테고리별 집계 (페이지 무관)
  const [sajuCatRes, tarotCatRes] = await Promise.all([
    supabaseAdmin.from('saju_records').select('category'),
    supabaseAdmin.from('tarot_records').select('spread_type'),
  ]);

  const sajuCategories = countBy(sajuCatRes.data ?? [], 'category');
  const tarotCategories = countBy(tarotCatRes.data ?? [], 'spread_type');

  return NextResponse.json({
    records: data.map(r => ({ ...r, userEmail: emailMap.get(r.user_id) ?? r.user_id })),
    total: count,
    page,
    pageSize: PAGE_SIZE,
    categorySummary: type === 'tarot' ? tarotCategories : sajuCategories,
  });
}

function countBy(arr: any[], key: string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const val = item[key] ?? 'unknown';
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
