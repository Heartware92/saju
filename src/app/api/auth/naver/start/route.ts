/**
 * GET /api/auth/naver/start
 *
 * 네이버 OAuth 로그인 시작.
 * CSRF 방지용 state를 생성해 httpOnly 쿠키에 저장하고,
 * 네이버 인증 페이지로 302 리다이렉트한다.
 *
 * 네이버 문서: https://developers.naver.com/docs/login/api/api.md
 *   Authorize URL: https://nid.naver.com/oauth2.0/authorize
 *
 * 필요 환경변수:
 *   NEXT_PUBLIC_NAVER_CLIENT_ID
 *   NAVER_CLIENT_SECRET
 *   NEXT_PUBLIC_BASE_URL
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  if (!NAVER_CLIENT_ID) {
    return NextResponse.redirect(
      `${BASE_URL}/login?error=naver_not_configured`
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/api/auth/naver/callback`;

  const authorizeUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  // ?next=/somewhere 로 호출 시 로그인 후 돌아갈 곳 기억
  const next = req.nextUrl.searchParams.get('next') || '/';

  const res = NextResponse.redirect(authorizeUrl.toString());
  // httpOnly 쿠키로 state 보관 — CSRF 검증 + next 경로
  res.cookies.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10분
    path: '/',
  });
  res.cookies.set('naver_oauth_next', next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
