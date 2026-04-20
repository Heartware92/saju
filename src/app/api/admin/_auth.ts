/**
 * 어드민 인증 헬퍼 — 모든 /api/admin/* 라우트에서 공통 사용
 * ADMIN_EMAIL 환경변수에 등록된 이메일만 접근 허용
 */
import { supabaseAdmin } from '@/services/supabaseAdmin';

export async function requireAdmin(request: Request): Promise<{ userId: string } | Response> {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: '세션이 만료되었습니다.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(data.user.email ?? '')) {
    return new Response(JSON.stringify({ error: '관리자 권한이 없습니다.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  return { userId: data.user.id };
}
