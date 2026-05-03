'use client';

/**
 * 비밀번호 초기화 — 2단계: 메일 링크 클릭 후 새 비밀번호 설정
 * Supabase 가 URL hash 에 access_token 등을 담아 redirect 시킨 직후 useEffect 가
 * onAuthStateChange('PASSWORD_RECOVERY') 이벤트를 잡고, 사용자가 새 비밀번호 입력 시
 * supabase.auth.updateUser({password}) 호출.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '../../../services/supabase';
import { BackButton } from '../../../components/ui/BackButton';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  // recovery 세션이 잡혔는지 — 아니면 안내 표시
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    // Supabase 가 메일 링크 redirect 시 hash 토큰을 자동 처리. PASSWORD_RECOVERY 이벤트로 감지.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setRecoveryReady(true);
      }
    });
    // 이미 세션이 있으면 ready
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const passwordStrength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', '매우 약함', '약함', '보통', '강함'][passwordStrength];
  const strengthColor = ['', '#F87171', '#FB923C', '#FBBF24', '#34D399'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await auth.updatePassword(password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError('비밀번호 변경 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-auth-shell">
      <div className="app-auth-container flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-3 left-3 z-20">
          <BackButton to="/login" />
        </div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cta/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-moon-halo/5 rounded-full blur-3xl" />

        <div className="w-full relative z-10 max-w-[460px]">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-space-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-text-primary mb-2">새 비밀번호 설정</h1>
              <p className="text-text-secondary text-sm leading-relaxed">
                새로 사용할 비밀번호를 입력해주세요.
              </p>
            </div>

            {!recoveryReady && !done && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-200 mb-4">
                메일 링크를 통해 들어와야 비밀번호를 변경할 수 있어요.
                <br />링크가 만료되었다면 다시 받아주세요.
              </div>
            )}

            {done ? (
              <div className="rounded-lg bg-status-success/10 border border-status-success/20 p-4 text-center">
                <p className="text-status-success font-semibold mb-1">비밀번호가 변경됐어요!</p>
                <p className="text-sm text-text-secondary">로그인 페이지로 이동합니다...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-status-error/10 border border-status-error/20 p-3 text-sm text-status-error">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">새 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="6자 이상"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 rounded-lg bg-space-elevated/60 border border-[var(--border-default)] px-4 pr-12 text-text-primary text-sm outline-none transition-all focus:border-cta focus:ring-1 focus:ring-cta/30"
                      required
                      autoFocus
                      disabled={!recoveryReady}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary p-1"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full"
                            style={{ backgroundColor: passwordStrength >= i ? strengthColor : 'rgba(255,255,255,0.08)' }}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs" style={{ color: strengthColor || 'var(--text-tertiary)' }}>
                        {strengthLabel || '비밀번호 강도'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">새 비밀번호 확인</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="다시 한 번 입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 rounded-lg bg-space-elevated/60 border border-[var(--border-default)] px-4 text-text-primary text-sm outline-none transition-all focus:border-cta focus:ring-1 focus:ring-cta/30"
                    required
                    disabled={!recoveryReady}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !recoveryReady}
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
