/**
 * POST /api/admin/users/[id]/ban
 * Body: { action: 'ban' | 'unban', reason?: string }
 * Supabase auth의 ban_duration 기능 활용 + admin_audit_logs 기록
 *  - ban: ban_duration='8760h' (=1년)
 *  - unban: ban_duration='none'
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

  let body: { action?: 'ban' | 'unban'; reason?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }

  const action = body.action;
  if (action !== 'ban' && action !== 'unban') {
    return NextResponse.json({ error: 'action은 ban 또는 unban' }, { status: 400 });
  }

  const { data: before } = await supabaseAdmin.auth.admin.getUserById(userId);
  const previousBannedUntil = (before?.user as any)?.banned_until ?? null;

  const banDuration = action === 'ban' ? '8760h' : 'none';
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  } as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: after } = await supabaseAdmin.auth.admin.getUserById(userId);
  const nextBannedUntil = (after?.user as any)?.banned_until ?? null;

  const { ipAddress, userAgent } = clientMeta(request);
  await writeAudit({
    actorUserId: auth.userId,
    actorEmail: auth.email,
    targetUserId: userId,
    targetEmail: after?.user?.email ?? before?.user?.email ?? null,
    action,
    before: { bannedUntil: previousBannedUntil },
    after: { bannedUntil: nextBannedUntil },
    reason: body.reason ?? undefined,
    ipAddress,
    userAgent,
  });

  await invalidateAll();
  return NextResponse.json({ ok: true, userId, action });
}
