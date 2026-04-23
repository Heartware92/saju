/**
 * POST /api/admin/users/[id]/ban
 * Body: { action: 'ban' | 'unban' }
 * Supabase auth의 ban_duration 기능을 활용
 *  - ban: ban_duration='8760h' (=1년)
 *  - unban: ban_duration='none'
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

  let body: { action?: 'ban' | 'unban' };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const action = body.action;
  if (action !== 'ban' && action !== 'unban') {
    return NextResponse.json({ error: 'action은 ban 또는 unban' }, { status: 400 });
  }

  const banDuration = action === 'ban' ? '8760h' : 'none';

  // Supabase JS에서 ban_duration은 any 캐스팅 필요 (타입 정의 최신화 안됨)
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  } as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await invalidateAll();
  return NextResponse.json({ ok: true, userId, action });
}
