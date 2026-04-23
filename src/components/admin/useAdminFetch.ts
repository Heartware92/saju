/**
 * 어드민 전용 경량 데이터 훅.
 *
 * 3단 캐시:
 *  1. 컴포넌트 state — 탭 재진입 시 재호출 없음
 *  2. sessionStorage — 페이지 새로고침 후 즉시 표시 (stale-while-revalidate)
 *  3. API 서버 캐시 (_cache.ts) + Cache-Control
 *
 * force=true 호출 시: sessionStorage 캐시 버리고 + URL 에 force=1 붙여 서버 캐시도 무효화.
 *
 * 외부 라이브러리(react-query 등) 없이 필요한 기능만.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** URL — null 이면 fetch 보류 (토큰 대기 등) */
  url: string | null;
  /** Bearer 토큰 */
  token: string | null;
  /** sessionStorage 키 — 미지정 시 저장 안 함 */
  cacheKey?: string;
  /** sessionStorage 데이터를 stale 로 간주할 ms (기본 30초) */
  staleAfterMs?: number;
  /** auto refetch 중단 조건 */
  enabled?: boolean;
}

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string;
  /** stale 상태 (sessionStorage 에서 로드되어 백그라운드 갱신 대기 중) */
  isStale: boolean;
}

export function useAdminFetch<T = unknown>({
  url, token, cacheKey, staleAfterMs = 30_000, enabled = true,
}: Options) {
  const [state, setState] = useState<State<T>>({ data: null, loading: false, error: '', isStale: false });
  const lastUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (force: boolean) => {
    if (!url || !token || !enabled) return;
    // 중복 요청 취소
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const finalUrl = force
      ? url + (url.includes('?') ? '&' : '?') + 'force=1'
      : url;

    setState(s => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetch(finalUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ac.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      if (ac.signal.aborted) return;
      setState({ data: json, loading: false, error: '', isStale: false });
      if (cacheKey) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: json, savedAt: Date.now() }));
        } catch { /* storage 꽉 차면 무시 */ }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setState(s => ({ ...s, loading: false, error: e.message ?? '알 수 없는 오류' }));
    }
  }, [url, token, enabled, cacheKey]);

  // URL / token 바뀌면 재호출
  useEffect(() => {
    if (!url || !token || !enabled) return;
    if (lastUrlRef.current === url) return; // 같은 URL 재진입 시 재호출 안 함
    lastUrlRef.current = url;

    // 1단계: sessionStorage 로 즉시 표시 (있으면)
    let usedCache = false;
    if (cacheKey) {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const { data, savedAt } = JSON.parse(raw);
          const age = Date.now() - savedAt;
          setState({ data, loading: false, error: '', isStale: age > staleAfterMs });
          usedCache = true;
          // stale 이면 백그라운드 갱신
          if (age > staleAfterMs) doFetch(false);
          return; // fresh 면 fetch 생략
        }
      } catch { /* JSON parse 실패 시 무시 */ }
    }

    if (!usedCache) doFetch(false);
    return () => { abortRef.current?.abort(); };
  }, [url, token, enabled, cacheKey, staleAfterMs, doFetch]);

  const refetch = useCallback(() => {
    lastUrlRef.current = null; // 동일 URL 이어도 재호출 강제
    lastUrlRef.current = url;
    doFetch(true);
  }, [doFetch, url]);

  return { ...state, refetch };
}
