/**
 * POST /api/admin/users/[id]/note
 * Body: { note: string }
 * auth.users.user_metadata.admin_note 에 저장 + admin_audit_logs 에 변경 이력 기록
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';
import { requireAdmin } from '../../../_auth';
import { invalidateAll } from '../../../_cache';
import { writeAudit, clientMeta } from '../../../_audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: 'id 누락' }, { status: 400 });

  let body: { note?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const note = (body.note ?? '').slice(0, 2000);

  const { data: userRes, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (uErr || !userRes?.user) {
    return NextResponse.json({ error: '사용자 없음' }, { status: 404 });
  }

  const previousNote = (userRes.user.user_metadata?.admin_note as string | undefined) ?? '';
  const nextMeta = { ...(userRes.user.user_metadata ?? {}), admin_note: note, admin_note_at: new Date().toISOString() };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: nextMeta,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { ipAddress, userAgent } = clientMeta(request);
  await writeAudit({
    actorUserId: undefined,
    actorEmail: auth.email,
    targetUserId: userId,
    targetEmail: userRes.user.email ?? null,
    action: 'note_update',
    before: { note: previousNote },
    after: { note },
    reason: note ? note.slice(0, 200) : '(빈 메모로 초기화)',
    ipAddress,
    userAgent,
  });

  await invalidateAll();
  return NextResponse.json({ ok: true, note });
}
