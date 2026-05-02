/**
 * GET /api/admin/consultations/[id]
 * 상담소 대화 상세 — messages 포함 전체 데이터 반환
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../_auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('consultation_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '상담 기록을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
  const email = userData?.user?.email ?? '';

  return NextResponse.json({ ...data, userEmail: email });
}
