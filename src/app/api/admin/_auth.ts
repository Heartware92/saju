/**
 * 어드민 인증 헬퍼 — 모든 /api/admin/* 라우트에서 공통 사용
 *
 * 인증 방식: ADMIN_API_KEY 환경변수와 일치하는 키를 x-admin-key 헤더로 전달.
 * Supabase 로그인과 완전히 분리되어 관리자 계정 없이도 접근 가능.
 */

export interface AdminActor {
  email: string;
}

export async function requireAdmin(request: Request): Promise<AdminActor | Response> {
  const apiKey = request.headers.get('x-admin-key') ?? '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '관리자 인증키가 필요합니다.' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const validKey = process.env.ADMIN_API_KEY ?? '';
  if (!validKey) {
    console.error('[admin] ADMIN_API_KEY 환경변수가 설정되지 않았습니다.');
    return new Response(JSON.stringify({ error: '서버 설정 오류입니다.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (apiKey !== validKey) {
    return new Response(JSON.stringify({ error: '인증키가 올바르지 않습니다.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  return { email: 'admin' };
}
