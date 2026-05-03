/**
 * POST /api/share/create
 *
 * 보관함 레코드에 공유 토큰을 생성하고 공유 URL을 반환한다.
 * - 이미 토큰이 있으면 기존 토큰 반환 (멱등)
 * - 소유권 검증: 현재 로그인 사용자의 레코드만 허용
 *
 * Body: { recordId: string, type: 'saju' | 'tarot' }
 * Response: { success: true, token: string, shareUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/services/supabaseAdmin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function POST(req: NextRequest) {
  try {
    const { recordId, type } = (await req.json()) as {
      recordId?: string;
      type?: 'saju' | 'tarot';
    };

    if (!recordId || !type || !['saju', 'tarot'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'recordId와 type(saju|tarot)이 필요합니다.' },
        { status: 400 },
      );
    }

    const table = type === 'saju' ? 'saju_records' : 'tarot_records';

    // 인증 확인 — Authorization 헤더에서 JWT 추출
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      // 쿠키 기반 세션 fallback
      const cookieHeader = req.headers.get('cookie') ?? '';
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { cookie: cookieHeader } },
        auth: { persistSession: false },
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { success: false, error: '로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      return await processShare(table, recordId, user.id);
    }

    // Bearer 토큰으로 사용자 확인
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증에 실패했습니다.' },
        { status: 401 },
      );
    }

    return await processShare(table, recordId, user.id);
  } catch (e: any) {
    console.error('[share/create]', e);
    return NextResponse.json(
      { success: false, error: e?.message ?? 'unknown error' },
      { status: 500 },
    );
  }
}

async function processShare(table: string, recordId: string, userId: string) {
  // 1) 레코드 조회 + 소유권 확인
  const { data: record, error: fetchErr } = await supabaseAdmin
    .from(table)
    .select('id, user_id, share_token')
    .eq('id', recordId)
    .maybeSingle();

  if (fetchErr || !record) {
    return NextResponse.json(
      { success: false, error: '레코드를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  if (record.user_id !== userId) {
    return NextResponse.json(
      { success: false, error: '본인의 레코드만 공유할 수 있습니다.' },
      { status: 403 },
    );
  }

  // 2) 이미 토큰이 있으면 재사용
  if (record.share_token) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saju.heartware.co.kr';
    return NextResponse.json({
      success: true,
      token: record.share_token,
      shareUrl: `${baseUrl}/share/${record.share_token}`,
    });
  }

  // 3) 새 토큰 생성
  const newToken = generateToken();

  const { error: updateErr } = await supabaseAdmin
    .from(table)
    .update({ share_token: newToken })
    .eq('id', recordId);

  if (updateErr) {
    return NextResponse.json(
      { success: false, error: '토큰 생성에 실패했습니다.' },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://saju.heartware.co.kr';
  return NextResponse.json({
    success: true,
    token: newToken,
    shareUrl: `${baseUrl}/share/${newToken}`,
  });
}
