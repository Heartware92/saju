'use client';

/**
 * OAuth 콜백 페이지 (Google / Kakao / Naver magic-link 공용)
 *
 * Supabase는 OAuth 성공 시 `?code=...`를 붙여 이 페이지로 리다이렉트한다.
 * PKCE flow에서는 `exchangeCodeForSession`으로 code를 세션으로 교환한다.
 *
 * Naver 커스텀 OAuth의 경우 서버가 magic-link로 한 번 더 리다이렉트하고,
 * 그 magic-link 콜백도 이 경로로 돌아온다 (Supabase가 자동 세션 세팅).
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../services/supabase';

type Status = 'processing' | 'success' | 'failed';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    if (!searchParams) return;

    (async () => {
      try {
        // 오류가 쿼리에 실려 돌아온 경우 (사용자 취소 등)
        const oauthError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (oauthError) {
          setStatus('failed');
          setMessage(errorDescription || '로그인이 취소되었거나 실패했습니다.');
          return;
        }

        // code-flow: ?code=
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('failed');
            setMessage(error.message || '세션 교환 실패');
            return;
          }
        } else {
          // token-flow (magic link 클릭 직후): 해시에 access_token이 실려 오는 경우
          // supabase-js가 자동으로 세션을 복원하므로 getSession만 확인
          await supabase.auth.getSession();
        }

        setStatus('success');
        setMessage('로그인되었습니다.');
        // 목적지: ?next= 파라미터 있으면 사용, 없으면 홈
        const next = searchParams.get('next') || '/';
        setTimeout(() => router.replace(next), 400);
      } catch (e: any) {
        setStatus('failed');
        setMessage(e?.message || '로그인 처리 중 오류가 발생했습니다.');
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-space-surface/70 border border-[var(--border-subtle)] p-8 text-center">
        <div className="text-5xl mb-4">
          {status === 'processing' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'failed' && '⚠️'}
        </div>
        <h1 className="text-lg font-bold mb-2 text-text-primary">
          {status === 'processing' && '로그인 처리 중'}
          {status === 'success' && '로그인 성공'}
          {status === 'failed' && '로그인 실패'}
        </h1>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">{message}</p>

        {status === 'failed' && (
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-lg bg-cta text-white text-sm font-bold"
          >
            로그인 페이지로
          </button>
        )}
      </div>
    </div>
  );
}
