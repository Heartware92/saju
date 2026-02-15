/**
 * 로그인 페이지 - 이메일 로그인
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // body 배경을 임시로 변경하고 cleanup에서 복원
  useEffect(() => {
    const originalBg = document.body.style.background;
    const originalBgColor = document.body.style.backgroundColor;
    const originalBgImage = document.body.style.backgroundImage;

    document.body.style.background = '#f9fafb';
    document.body.style.backgroundColor = '#f9fafb';
    document.body.style.backgroundImage = 'none';

    return () => {
      document.body.style.background = originalBg;
      document.body.style.backgroundColor = originalBgColor;
      document.body.style.backgroundImage = originalBgImage;
    };
  }, []);

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
      // 로그인 성공
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      setError(authError || '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          aria-label="뒤로가기"
        >
          <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
          <span>뒤로가기</span>
        </button>

        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', textAlign: 'center' }}>
            로그인
          </h1>
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 성공 메시지 */}
            {success && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: '#16a34a',
                fontWeight: '600'
              }}>
                ✅ 로그인 성공! 홈으로 이동합니다...
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                이메일
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  height: '3rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                비밀번호
              </label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '3rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  padding: '0 1rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9ca3af';
                  e.target.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '3rem',
                borderRadius: '0.5rem',
                backgroundColor: '#8B4513',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '1rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                marginTop: '1.5rem',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#654321')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#8B4513')}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

        {/* 하단 링크 */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: '#4b5563' }}>아직 계정이 없으신가요?</span>
          {' '}
          <Link
            to="/signup"
            style={{ color: '#8B4513', fontWeight: '700', textDecoration: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            이메일로 회원가입
          </Link>
        </div>

        {/* 구분선 */}
        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          <span style={{ position: 'relative', backgroundColor: '#ffffff', padding: '0 1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
            또는 소셜 계정으로
          </span>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {/* 구글 */}
          <button
            type="button"
            onClick={() => alert('구글 로그인은 준비 중입니다')}
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
            title="구글로 시작하기"
          >
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          {/* 네이버 */}
          <button
            type="button"
            onClick={() => alert('네이버 로그인은 준비 중입니다')}
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#03C75A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '0.9rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(3, 199, 90, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
            title="네이버로 시작하기"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
          </button>

          {/* 카카오 */}
          <button
            type="button"
            onClick={() => alert('카카오 로그인은 준비 중입니다')}
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#FEE500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 229, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
            title="카카오로 시작하기"
          >
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.696.696 0 0 0-.653.447l-1.661 4.075a.472.472 0 0 0 .874.357l.33-.813h2.07l.299.8a.472.472 0 1 0 .884-.33l-.345-.926zM8.293 9.302a.472.472 0 0 0-.471-.472H4.577a.472.472 0 1 0 0 .944h1.16v3.736a.472.472 0 0 0 .944 0V9.774h1.14c.26 0 .472-.212.472-.472z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
