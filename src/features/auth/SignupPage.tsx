/**
 * 회원가입 페이지 - 코스믹 테마
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '../../store/useUserStore';
import { auth } from '../../services/supabase';
import { BackButton } from '../../components/ui/BackButton';

export const SignupPage: React.FC = () => {
  const router = useRouter();
  const { signup, loading } = useUserStore();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 비밀번호 표시·숨김 토글 — 입력 실수 줄임
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // 한국 법규 + KISA 가이드 — 동의 항목 3개로 분리
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedAge14, setAgreedAge14] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 모두 동의 — 3개 한 번에 토글
  const allAgreed = agreedTerms && agreedPrivacy && agreedAge14;
  const toggleAllAgree = (v: boolean) => {
    setAgreedTerms(v);
    setAgreedPrivacy(v);
    setAgreedAge14(v);
  };

  // 비밀번호 강도 평가 — 0(없음)~4(강함). UI 바 시각화 + 색상.
  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return score; // 0~4
  })();
  const strengthLabel = ['', '매우 약함', '약함', '보통', '강함'][passwordStrength];
  const strengthColor = ['', '#F87171', '#FB923C', '#FBBF24', '#34D399'][passwordStrength];

  const handleSocial = async (provider: 'google' | 'kakao') => {
    setError('');
    try {
      await auth.signInWithProvider(provider);
    } catch (err: any) {
      setError(err?.message || '소셜 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
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

    if (!agreedTerms) {
      setError('이용약관에 동의해주세요.');
      return;
    }
    if (!agreedPrivacy) {
      setError('개인정보처리방침에 동의해주세요.');
      return;
    }
    if (!agreedAge14) {
      setError('만 14세 이상임을 확인해주세요.');
      return;
    }

    try {
      await signup(email, password);
      setSuccess(true);
      setTimeout(() => {
        // replace — 가입 완료 후 뒤로가기로 가입 폼 돌아가지 않도록
        router.replace('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err?.message || '회원가입에 실패했습니다.';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('이미 가입된 이메일입니다.');
      } else if (msg.includes('invalid') && msg.includes('email')) {
        setError('올바른 이메일 형식이 아닙니다.');
      } else if (msg.includes('weak_password') || msg.includes('too short')) {
        setError('비밀번호가 너무 짧습니다. 6자 이상 입력해주세요.');
      } else {
        setError(msg);
      }
    }
  };

  const inputClass = "w-full h-12 rounded-lg bg-space-elevated/60 border border-[var(--border-default)] px-4 text-text-primary placeholder-text-tertiary text-sm outline-none transition-all focus:border-cta focus:ring-1 focus:ring-cta/30";

  return (
    <div className="app-auth-shell">
      <div className="app-auth-container flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* 뒤로가기 — 최상단 좌측 absolute 고정 (텍스트 없는 아이콘만, 공통 BackButton)
         이메일 폼 단계면 단계 뒤로, 아니면 홈으로 — 둘 다 onClick 으로 처리 */}
      <div className="absolute top-3 left-3 z-20">
        <BackButton onClick={() => showEmailForm ? setShowEmailForm(false) : router.push('/')} />
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-sun-core/5 rounded-full blur-3xl" />

      <div className="w-full relative z-10">
        {/* Card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-space-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {showEmailForm ? '회원가입' : '시작하기'}
            </h1>
            <p className="text-text-secondary text-sm">
              {showEmailForm ? '정보를 입력해주세요' : '가입 방법을 선택하세요'}
            </p>
          </div>

          {!showEmailForm ? (
            /* Method selection */
            <div className="space-y-4">
              {/* Email signup button */}
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-cta to-cta-active text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-cta/20"
              >
                <span className="text-lg">✉️</span>
                <span>이메일로 회원가입</span>
              </button>

              {/* Divider */}
              <div className="relative text-center my-6">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border-subtle)]" />
                <span className="relative bg-space-surface/80 px-3 text-xs text-text-tertiary">
                  또는 소셜 계정으로
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
          ) : (
            /* Email signup form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <div className="rounded-lg bg-status-success/10 border border-status-success/20 p-3 text-sm text-status-success font-medium text-center">
                  회원가입 완료! 🌙 달 크레딧 1개가 지급되었습니다.<br/>
                  <span className="text-xs font-normal">로그인 페이지로 이동합니다...</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-status-error/10 border border-status-error/20 p-3 text-sm text-status-error">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  이메일 <span className="text-status-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* Password — 표시·숨김 토글 + 강도 시각화 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  비밀번호 <span className="text-status-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="최소 6자 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
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
                {/* 강도 시각화 — 4단계 */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: passwordStrength >= i ? strengthColor : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: strengthColor || 'var(--text-tertiary)' }}>
                      {strengthLabel || '비밀번호 강도'}
                    </p>
                  </div>
                )}
                <p className="mt-1 text-xs text-text-tertiary">영문 대소문자·숫자·기호 조합 권장 · 8자 이상</p>
              </div>

              {/* Confirm Password — 토글 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  비밀번호 확인 <span className="text-status-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary p-1"
                    aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-status-error">비밀번호가 일치하지 않아요</p>
                )}
              </div>

              {/* 동의 항목 — 한국 KISA 가이드: 이용약관·개인정보·만14세 별도 분리 */}
              <div className="pt-2 space-y-2.5 border-t border-[var(--border-subtle)] pt-4">
                {/* 모두 동의 */}
                <label className="flex items-center gap-3 cursor-pointer pb-2 border-b border-[var(--border-subtle)]">
                  <input
                    type="checkbox"
                    checked={allAgreed}
                    onChange={(e) => toggleAllAgree(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--cta-primary)] cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-text-primary">모두 동의 (필수 + 선택 포함)</span>
                </label>

                {/* 이용약관 */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--cta-primary)] cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary flex-1">
                    <span className="text-status-error font-bold">[필수]</span>{' '}
                    이용약관에 동의합니다{' '}
                    <a
                      href="/terms"
                      className="text-cta hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      보기
                    </a>
                  </span>
                </label>

                {/* 개인정보처리방침 */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--cta-primary)] cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary flex-1">
                    <span className="text-status-error font-bold">[필수]</span>{' '}
                    개인정보처리방침에 동의합니다{' '}
                    <a
                      href="/privacy"
                      className="text-cta hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      보기
                    </a>
                  </span>
                </label>

                {/* 만 14세 이상 — 한국 개인정보보호법 22조 의무 */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedAge14}
                    onChange={(e) => setAgreedAge14(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--cta-primary)] cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary flex-1">
                    <span className="text-status-error font-bold">[필수]</span>{' '}
                    만 14세 이상입니다
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 hover:shadow-lg hover:shadow-cta/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? '가입 중...' : '회원가입 완료'}
              </button>
            </form>
          )}

          {/* Bottom link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-text-tertiary">이미 계정이 있으신가요?</span>{' '}
            <Link href="/login" className="text-cta font-semibold hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
