/**
 * GET /api/admin/audit?page=1&action=&actor=&target=
 * 관리자 감사 로그 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../_auth';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE))));
  const action = searchParams.get('action') ?? '';
  const actor = (searchParams.get('actor') ?? '').trim().toLowerCase();
  const target = (searchParams.get('target') ?? '').trim().toLowerCase();
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (action) query = query.eq('action', action);
  if (actor) query = query.ilike('actor_email', `%${actor}%`);
  if (target) query = query.ilike('target_email', `%${target}%`);

  const { data, count, error } = await query;
  if (error) {
    // 테이블이 아직 없는 경우도 대응 (migration 미실행)
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      return NextResponse.json({
        logs: [], total: 0, page, pageSize,
        warning: 'admin_audit_logs 테이블이 없습니다. 004_admin_audit_logs.sql 마이그레이션 실행 필요.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
