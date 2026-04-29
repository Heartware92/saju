/**
 * 로그인 페이지 - 코스믹 테마
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '../../store/useUserStore';
import { auth } from '../../services/supabase';
import { BackButton } from '../../components/ui/BackButton';

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading } = useUserStore();

  // 로그인 성공 후 항상 홈으로 (사용자 의도)
  // 이전엔 ?from= 파라미터로 원래 가려던 페이지로 돌아갔지만,
  // 비로그인 홈 카드가 /saju/input 을 from 으로 넘겨 "프로필 수정 화면 같은 곳" 으로 보였음.
  // 단순하게 홈으로 통일.
  void searchParams;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Supabase 는 기본 30일 세션 유지 — 체크박스는 명시적 UX 표시용. 동작은 Supabase 기본값 그대로.
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSocial = async (provider: 'google' | 'kakao') => {
    setError('');
    try {
      await auth.signInWithProvider(provider);
      // signInWithOAuth는 즉시 리다이렉트하므로 여기서 추가 작업 불필요
    } catch (err: any) {
      setError(err?.message || '소셜 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        // replace — 로그인 완료 후 뒤로가기로 로그인 페이지 돌아가지 않도록. 무조건 홈.
        router.replace('/');
      }, 500);
    } catch (err: any) {
      const msg = err?.message || '로그인에 실패했습니다.';
      if (msg.includes('Invalid login')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="app-auth-shell">
      <div className="app-auth-container flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* 뒤로가기 — 최상단 좌측 absolute 고정 (텍스트 없는 아이콘만, 공통 BackButton) */}
      <div className="absolute top-3 left-3 z-20">
        <BackButton to="/" />
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-moon-halo/5 rounded-full blur-3xl" />

      <div className="w-full relative z-10">
        {/* Card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-space-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">로그인</h1>
            <p className="text-text-secondary text-sm">이천점에 오신 것을 환영합니다</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div className="rounded-lg bg-status-success/10 border border-status-success/20 p-3 text-sm text-status-success font-medium text-center">
                로그인 성공! 홈으로 이동합니다...
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-status-error/10 border border-status-error/20 p-3 text-sm text-status-error">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">이메일</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-lg bg-space-elevated/60 border border-[var(--border-default)] px-4 text-text-primary placeholder-text-tertiary text-sm outline-none transition-all focus:border-cta focus:ring-1 focus:ring-cta/30"
                required
              />
            </div>

            {/* Password — 표시·숨김 토글 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-lg bg-space-elevated/60 border border-[var(--border-default)] px-4 pr-12 text-text-primary placeholder-text-tertiary text-sm outline-none transition-all focus:border-cta focus:ring-1 focus:ring-cta/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary p-1"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* 자동 로그인 + 비밀번호 초기화 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--cta-primary)] cursor-pointer"
                />
                <span className="text-text-secondary">자동 로그인</span>
              </label>
              <Link href="/auth/reset" className="text-text-tertiary hover:text-cta transition-colors">
                비밀번호 초기화
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 hover:shadow-lg hover:shadow-cta/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-text-tertiary">아직 계정이 없으신가요?</span>{' '}
            <Link href="/signup" className="text-cta font-semibold hover:underline">
              회원가입
            </Link>
          </div>

          {/* Divider */}
          <div className="relative text-center my-6">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border-subtle)]" />
            <span className="relative bg-space-surface/80 px-3 text-xs text-text-tertiary">
              소셜 계정으로 로그인
            </span>
          </div>

          {/* Social buttons */}
          <div className="flex justify-center gap-4">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocial('google')}
              className="w-14 h-14 rounded-full border border-[var(--border-default)] bg-space-elevated/40 flex items-center justify-center transition-all hover:scale-105 hover:border-[var(--border-strong)] hover:bg-space-elevated"
              title="구글로 시작하기"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Kakao */}
            <button
              type="button"
              onClick={() => handleSocial('kakao')}
              className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#FEE500]/20"
              title="카카오로 시작하기"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.696.696 0 0 0-.653.447l-1.661 4.075a.472.472 0 0 0 .874.357l.33-.813h2.07l.299.8a.472.472 0 1 0 .884-.33l-.345-.926zM8.293 9.302a.472.472 0 0 0-.471-.472H4.577a.472.472 0 1 0 0 .944h1.16v3.736a.472.472 0 0 0 .944 0V9.774h1.14c.26 0 .472-.212.472-.472z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
