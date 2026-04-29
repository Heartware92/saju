/**
 * GET /api/admin/account-deletions
 *   ?page=1&pageSize=50
 *   &search=email      (이메일 부분 일치)
 *   &reasonCode=...    (사유 카테고리 필터)
 *   &from=YYYY-MM-DD   (탈퇴일 시작)
 *   &to=YYYY-MM-DD     (탈퇴일 끝)
 *
 * 회원 탈퇴 로그 조회 — 어드민 전용. 통계·감사용.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { supabaseAdmin } from '@/services/supabaseAdmin';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

export async function GET(request: NextRequest) {
  const actor = await requireAdmin(request);
  if (actor instanceof Response) return actor;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)));
    const search = searchParams.get('search')?.trim() || '';
    const reasonCode = searchParams.get('reasonCode')?.trim() || '';
    const from = searchParams.get('from')?.trim() || '';
    const to = searchParams.get('to')?.trim() || '';

    let query = supabaseAdmin
      .from('account_deletion_logs')
      .select('id, user_id, email, reason, reason_code, metadata, deleted_at', { count: 'exact' })
      .order('deleted_at', { ascending: false });

    if (search) query = query.ilike('email', `%${search}%`);
    if (reasonCode) query = query.eq('reason_code', reasonCode);
    if (from) query = query.gte('deleted_at', from);
    if (to) {
      // to 는 그날 자정까지 포함하려고 +1일
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('deleted_at', toDate.toISOString().slice(0, 10));
    }

    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize - 1;
    const { data, error, count } = await query.range(startIdx, endIdx);

    if (error) {
      console.error('[admin/account-deletions] query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 사유 카테고리별 집계 (현재 페이지 외 전체 통계)
    const { data: reasonStats } = await supabaseAdmin
      .from('account_deletion_logs')
      .select('reason_code');
    const reasonCounts: Record<string, number> = {};
    (reasonStats ?? []).forEach((r: any) => {
      const key = r.reason_code || 'unknown';
      reasonCounts[key] = (reasonCounts[key] ?? 0) + 1;
    });

    return NextResponse.json({
      items: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
      reasonCounts,
    });
  } catch (error: any) {
    console.error('[admin/account-deletions] unexpected:', error);
    return NextResponse.json({ error: error?.message || '서버 오류' }, { status: 500 });
  }
}
