/**
 * GET /api/auth/naver/callback?code=&state=
 *
 * 네이버에서 인가 코드를 받아 다음을 수행한다:
 *   1) state 쿠키 검증 (CSRF)
 *   2) code → access_token 교환
 *   3) 네이버 프로필(email, id, name) 조회
 *   4) Supabase admin으로 사용자 upsert (provider 메타 기록)
 *   5) magic-link 생성 → 클라이언트를 magic-link URL로 302
 *      (Supabase 콜백이 /auth/callback 로 돌아와 세션을 자동 세팅)
 *
 * 네이버 토큰 URL: https://nid.naver.com/oauth2.0/token
 * 네이버 프로필:   https://openapi.naver.com/v1/nid/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseAdmin';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function errorRedirect(msg: string) {
  const url = new URL(`${BASE_URL}/login`);
  url.searchParams.set('error', msg);
  return NextResponse.redirect(url.toString());
}

export async function GET(req: NextRequest) {
  try {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return errorRedirect('naver_not_configured');
    }

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const naverError = req.nextUrl.searchParams.get('error');

    if (naverError) return errorRedirect(`naver_${naverError}`);
    if (!code || !state) return errorRedirect('missing_code');

    // state 검증
    const savedState = req.cookies.get('naver_oauth_state')?.value;
    const next = req.cookies.get('naver_oauth_next')?.value || '/';
    if (!savedState || savedState !== state) {
      return errorRedirect('state_mismatch');
    }

    // 1) code → access_token
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', NAVER_CLIENT_SECRET);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('state', state);

    const tokenRes = await fetch(tokenUrl.toString(), { cache: 'no-store' });
    if (!tokenRes.ok) return errorRedirect('token_exchange_failed');
    const tokenJson = await tokenRes.json();
    const accessToken: string | undefined = tokenJson?.access_token;
    if (!accessToken) return errorRedirect('no_access_token');

    // 2) 프로필 조회
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!profileRes.ok) return errorRedirect('profile_fetch_failed');
    const profileJson = await profileRes.json();
    const resp = profileJson?.response ?? {};
    const email: string | undefined = resp.email;
    const naverId: string | undefined = resp.id;
    const name: string | undefined = resp.name || resp.nickname;

    if (!email) return errorRedirect('no_email');

    // 3) Supabase admin: 사용자 upsert
    // listUsers는 서비스 키에서만 사용 가능.
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    });
    const existing = listData?.users?.find((u) => u.email === email);

    if (!existing) {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider: 'naver',
          naver_id: naverId,
          name,
        },
      });
      if (createErr) {
        console.error('[naver/callback] createUser', createErr);
        return errorRedirect('user_create_failed');
      }
    }

    // 4) magic-link 생성 → 클라이언트가 이 URL로 가면 Supabase가 세션을 세팅하고
    //    /auth/callback 으로 돌아옴.
    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${BASE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[naver/callback] generateLink', linkErr);
      return errorRedirect('magiclink_failed');
    }

    const res = NextResponse.redirect(linkData.properties.action_link);
    // 쿠키 정리
    res.cookies.delete('naver_oauth_state');
    res.cookies.delete('naver_oauth_next');
    return res;
  } catch (e: any) {
    console.error('[naver/callback]', e);
    return errorRedirect('unknown_error');
  }
}
