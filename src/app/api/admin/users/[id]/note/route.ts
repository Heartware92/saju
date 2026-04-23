/**
 * POST /api/admin/users/[id]/note
 * Body: { note: string }
 * auth.users.user_metadata.admin_note 에 저장 (간단 방식 — 별도 테이블 불요)
 *
 * GET /api/admin/users/[id]/note — 현재 저장된 메모 반환
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

  let body: { note?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const note = (body.note ?? '').slice(0, 2000); // 2000자 제한

  const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (uErr || !userRes?.user) {
    return NextResponse.json({ error: '사용자 없음' }, { status: 404 });
  }

  const nextMeta = { ...(userRes.user.user_metadata ?? {}), admin_note: note, admin_note_at: new Date().toISOString() };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: nextMeta,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await invalidateAll();
  return NextResponse.json({ ok: true, note });
}
